package app.fukidashi.translator

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Rect
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.IntentCompat
import app.fukidashi.core.Balloon
import app.fukidashi.core.CachedTranslator
import app.fukidashi.core.LlmEngine
import app.fukidashi.core.PageChangeDetector
import app.fukidashi.core.PageLibrary
import app.fukidashi.core.Patch
import app.fukidashi.core.StoryContext
import app.fukidashi.core.StoryTranslator
import app.fukidashi.core.Thumbnail
import app.fukidashi.core.TranslationException
import app.fukidashi.core.Translator
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.runInterruptible
import kotlinx.coroutines.withContext

/**
 * 画面の取り込みと訳文の表示を受け持つフォアグラウンドサービス。翻訳はすべて端末内で行う。
 *
 * - 「訳」ボタン、または自動モードでページが止まったとき：保存済みのページならすぐ表示し、なければ訳す
 * - ボタンの長押し、または通知の「章を一括処理」：ページを自動でめくりながら章を取り込み、
 *   あらすじと人名を抜き出してから、文脈つきでまとめて訳して保存する
 */
class CaptureService : Service() {
    companion object {
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"
        const val ACTION_STOP = "app.fukidashi.translator.STOP"
        const val ACTION_BATCH = "app.fukidashi.translator.BATCH"
        const val ACTION_CANCEL = "app.fukidashi.translator.CANCEL"
        private const val CHANNEL = "capture"
        private const val NOTIFICATION_ID = 1

        @Volatile var isRunning = false
            private set
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var settings: Settings
    private lateinit var store: StoryStore
    private lateinit var title: String
    private lateinit var story: StoryContext
    private lateinit var library: PageLibrary
    private var projection: MediaProjection? = null
    private var capturer: ScreenCapturer? = null
    private var overlay: OverlayController? = null
    private var translator: Translator? = null
    private var storyTranslator: StoryTranslator? = null
    private var mlkit: MlKitTranslator? = null
    private var llm: LocalLlm? = null
    private val pipeline by lazy { TranslationPipeline() }
    private val detector = PageChangeDetector()
    private var busy = false
    private var autoJob: Job? = null
    private var batchJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> { stopSelf(); return START_NOT_STICKY }
            ACTION_BATCH -> { if (projection != null) startBatch(); return START_NOT_STICKY }
            ACTION_CANCEL -> { batchJob?.cancel(); return START_NOT_STICKY }
        }
        if (projection != null) return START_NOT_STICKY

        // Android 14 以降は、MediaProjection を取得する前にフォアグラウンド化しておく必要がある
        ServiceCompat.startForeground(
            this, NOTIFICATION_ID, notification("準備しています"),
            if (Build.VERSION.SDK_INT >= 29) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION else 0,
        )
        val code = intent?.getIntExtra(EXTRA_RESULT_CODE, 0) ?: 0
        val data = intent?.let { IntentCompat.getParcelableExtra(it, EXTRA_RESULT_DATA, Intent::class.java) }
        val mp = data?.let { getSystemService(MediaProjectionManager::class.java).getMediaProjection(code, it) }
        if (mp == null) { stopSelf(); return START_NOT_STICKY }
        projection = mp
        mp.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() { stopSelf() }
        }, Handler(Looper.getMainLooper()))

        settings = Settings(this)
        store = StoryStore(this)
        title = settings.workTitle
        story = store.loadContext(title)
        library = store.loadLibrary(title)
        capturer = ScreenCapturer(mp).also { startCapture(it) }
        overlay = OverlayController(this, onBubbleTap = ::onBubbleTap, onBubbleLongPress = ::startBatch)
        translator = buildTranslator()
        isRunning = true
        updateNotification()
        if (settings.autoMode) autoJob = scope.launch { autoLoop() }
        return START_NOT_STICKY
    }

    private fun buildTranslator(): Translator {
        val mt = MlKitTranslator().also { mlkit = it }
        val engine = settings.engine
        // モデルを先に用意しておく（ML Kit は初回のみ約 30MB、LLM は読み込みに数秒〜数十秒）
        scope.launch {
            overlay?.setProgress(if (engine == Engine.LOCAL_LLM) "読込" else "…")
            val err = withContext(Dispatchers.IO) {
                runCatching { mt.ensureModel(); if (engine == Engine.LOCAL_LLM) localLlm() }.exceptionOrNull()
            }
            overlay?.setState(if (err == null) BubbleState.READY else BubbleState.ERROR)
            err?.let { toast(it.message ?: "翻訳の準備ができませんでした") }
        }
        return when (engine) {
            Engine.ON_DEVICE -> CachedTranslator(mt)
            Engine.LOCAL_LLM -> StoryTranslator(LlmEngine { p -> localLlm().generate(p) }, story, fallback = mt).also { storyTranslator = it }
        }
    }

    @Synchronized
    private fun localLlm(): LocalLlm = llm ?: LocalLlm(this, settings.modelPath, settings.wrapGemmaTemplate).also { llm = it }

    private fun onBubbleTap() {
        val o = overlay ?: return
        if (batchJob?.isActive == true) { batchJob?.cancel(); return }
        if (busy) return
        if (o.hasPatches) {
            // 訳文を消して原文に戻す。自動モードでも、次にページが変わるまでは訳し直さない
            o.clear(); o.setState(BubbleState.READY)
            capturer?.snapshot()?.let { detector.markShown(thumb(it), listOf(o.bubbleBox)); it.recycle() }
            return
        }
        scope.launch { translateNow() }
    }

    /** 今のページを訳す。一括処理で保存済みのページなら、OCR も翻訳もせずにすぐ出す */
    private suspend fun translateNow() {
        val o = overlay ?: return
        val cap = capturer ?: return
        if (busy) return
        busy = true
        o.setState(BubbleState.BUSY)
        try {
            val bmp = captureClean(o, cap) ?: run { toast("画面を取り込めませんでした"); o.setState(BubbleState.ERROR); return }
            val t = thumb(bmp)
            if (t.looksBlank) {
                bmp.recycle()
                toast("このアプリは画面の取り込みを禁止しているため翻訳できません")
                o.setState(BubbleState.ERROR)
                return
            }
            val patches = library.find(t)?.patches ?: run {
                val p = pipeline.run(bmp, translator ?: return)
                if (p.isNotEmpty()) { library.add(t, p); saveAsync() }
                p
            }
            bmp.recycle()
            o.show(patches)
            o.setState(if (patches.isEmpty()) BubbleState.READY else BubbleState.SHOWING)
            if (patches.isEmpty()) toast("吹き出しが見つかりませんでした")
            detector.markShown(t, patches.map { it.box } + o.bubbleBox)
        } catch (e: CancellationException) {
            throw e
        } catch (e: TranslationException) {
            toast(e.message ?: "翻訳に失敗しました"); o.setState(BubbleState.ERROR)
        } catch (e: Exception) {
            toast("翻訳に失敗しました: ${e.message}"); o.setState(BubbleState.ERROR)
        } finally {
            busy = false
        }
    }

    private fun startBatch() {
        if (batchJob?.isActive == true || busy) return
        if (PageTurnService.instance == null) {
            toast("章の一括処理には、ユーザー補助の「フキダシ翻訳のページめくり」をオンにしてください")
            startActivity(Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            return
        }
        batchJob = scope.launch { runBatch() }
    }

    private class Scan(val thumb: Thumbnail, val balloons: List<Balloon>, val geometry: Map<Int, Patch>)

    /**
     * 章の一括処理。今のページから、めくっても変わらなくなる（章の終わり）か上限に達するまで取り込み、
     * 最後にまとめて訳して保存する。途中で中止しても、訳し終えた分は保存する。
     */
    private suspend fun runBatch() {
        val o = overlay ?: return
        val cap = capturer ?: return
        val turner = PageTurnService.instance ?: return
        busy = true
        o.clear()
        val scans = ArrayList<Scan>()
        try {
            // 1. 取り込み：自分の窓は隠したままにして、ページをめくりながら文字と位置を読む
            o.setCaptureHidden(true)
            notify("章を取り込んでいます", cancellable = true)
            delay(250)
            while (scans.size < settings.maxPages) {
                val bmp = withContext(Dispatchers.Default) { cap.snapshot() } ?: break
                val t = thumb(bmp)
                if (t.looksBlank) { bmp.recycle(); toast("このアプリは画面の取り込みを禁止しているため処理できません"); return }
                if (library.find(t) == null) {
                    val balloons = pipeline.detect(bmp)
                    scans += Scan(t, balloons, withContext(Dispatchers.Default) { pipeline.geometry(bmp, balloons) })
                } else {
                    scans += Scan(t, emptyList(), emptyMap()) // 既に訳してあるページ
                }
                bmp.recycle()
                notify("取り込み ${scans.size} ページ", cancellable = true)
                if (!turner.turn(settings.pageTurn) || !waitForNewPage(t, cap)) break
            }
            o.setCaptureHidden(false)

            // 2. 翻訳：あらすじと人名を抜き出してから、文脈つきでまとめて訳す
            val todo = scans.filter { it.balloons.isNotEmpty() }
            val st = storyTranslator
            val results: List<Map<Int, String>> = if (st != null) {
                runInterruptible(Dispatchers.IO) {
                    st.translateChapter(todo.map { it.balloons }, progress = { d, total ->
                        scope.launch { o.setProgress("訳 $d/$total"); notify("翻訳中 $d / $total", cancellable = true) }
                    }, cancelled = { batchJob?.isCancelled == true })
                }
            } else {
                todo.mapIndexed { i, s ->
                    o.setProgress("訳 ${i + 1}/${todo.size}")
                    withContext(Dispatchers.IO) { translator!!.translate(app.fukidashi.core.PageInput(s.balloons)) }
                }
            }
            // 3. 保存：ページの見た目（指紋）と訳文を結びつける
            todo.forEachIndexed { i, s ->
                val ja = results.getOrNull(i) ?: return@forEachIndexed
                val patches = s.balloons.mapNotNull { b -> ja[b.id]?.takeIf { it.isNotBlank() }?.let { s.geometry[b.id]?.copy(text = it) } }
                if (patches.isNotEmpty()) library.add(s.thumb, patches)
            }
            save()
            o.setState(BubbleState.READY)
            toast("${scans.size} ページを処理しました。章の最初に戻って読んでください")
        } catch (e: CancellationException) {
            save()
            o.setCaptureHidden(false); o.setState(BubbleState.READY)
            toast("一括処理を中止しました")
        } catch (e: Exception) {
            save()
            o.setCaptureHidden(false); o.setState(BubbleState.ERROR)
            toast(e.message ?: "一括処理に失敗しました")
        } finally {
            busy = false
            detector.reset()
            updateNotification()
        }
    }

    /** めくった後、画面が前のページから変わり、動きが止まるまで待つ。変わらなければ章の終わり */
    private suspend fun waitForNewPage(prev: Thumbnail, cap: ScreenCapturer): Boolean {
        val start = System.currentTimeMillis()
        var last: Thumbnail? = null
        var changed = false
        var stable = 0
        while (System.currentTimeMillis() - start < 5000) {
            delay(250)
            val bmp = withContext(Dispatchers.Default) { cap.snapshot() } ?: continue
            val t = thumb(bmp); bmp.recycle()
            if (!changed && t.difference(prev) > 0.03f) changed = true
            if (changed) {
                stable = if (last != null && t.difference(last) < 0.012f) stable + 1 else 0
                if (stable >= 2) return true
            }
            last = t
        }
        return false
    }

    /** 自分の窓を隠し、隠れた後のフレームが届くのを待ってから取り込む */
    private suspend fun captureClean(o: OverlayController, cap: ScreenCapturer): Bitmap? {
        o.setCaptureHidden(true)
        val hiddenAt = System.nanoTime()
        try {
            delay(120)
            var waited = 120
            while (cap.frameTimeNanos < hiddenAt && waited < 900) { delay(40); waited += 40 }
            return withContext(Dispatchers.Default) { cap.snapshot() }
        } finally {
            o.setCaptureHidden(false)
        }
    }

    /** 自動モード：訳文を出しているページとの違いを見張り、めくられたら消し、止まったら訳す */
    private suspend fun autoLoop() {
        while (scope.isActive) {
            delay(600)
            if (busy) continue
            val cap = capturer ?: continue
            val bmp = withContext(Dispatchers.Default) { cap.snapshot() } ?: continue
            val t = thumb(bmp)
            bmp.recycle()
            if (t.looksBlank) continue
            when (detector.feed(t)) {
                PageChangeDetector.Event.PAGE_TURNING -> { overlay?.clear(); overlay?.setState(BubbleState.READY) }
                PageChangeDetector.Event.PAGE_SETTLED -> translateNow()
                PageChangeDetector.Event.NONE -> {}
            }
        }
    }

    private fun thumb(bmp: Bitmap): Thumbnail {
        val small = Bitmap.createScaledBitmap(bmp, 72, 128, true)
        val px = IntArray(72 * 128)
        small.getPixels(px, 0, 72, 0, 0, 72, 128)
        small.recycle()
        val t = Thumbnail.fromArgb(px, 72, 128)
        // mask の座標は画面座標なので、元の画面サイズを持たせる
        return Thumbnail(t.width, t.height, bmp.width, bmp.height, t.lum)
    }

    private fun save() {
        runCatching { store.saveContext(story, title); store.saveLibrary(library, title) }
    }

    private fun saveAsync() { scope.launch(Dispatchers.IO) { save() } }

    private fun startCapture(cap: ScreenCapturer) {
        val bounds: Rect = if (Build.VERSION.SDK_INT >= 30) {
            getSystemService(WindowManager::class.java).maximumWindowMetrics.bounds
        } else {
            @Suppress("DEPRECATION")
            DisplayMetrics().also { getSystemService(WindowManager::class.java).defaultDisplay.getRealMetrics(it) }
                .let { Rect(0, 0, it.widthPixels, it.heightPixels) }
        }
        cap.start(bounds.width(), bounds.height(), resources.displayMetrics.densityDpi)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // 画面の向きが変わったら取り込みサイズを合わせ、古い訳文は消す
        capturer?.let { startCapture(it) }
        overlay?.clear(); overlay?.setState(BubbleState.READY)
        detector.reset()
    }

    override fun onDestroy() {
        isRunning = false
        scope.cancel()
        if (::store.isInitialized) save()
        overlay?.removeAll(); overlay = null
        capturer?.stop(); capturer = null
        projection?.stop(); projection = null
        mlkit?.close()
        llm?.close()
        runCatching { pipeline.close() }
        super.onDestroy()
    }

    private fun updateNotification() {
        val mode = if (settings.autoMode) "ページをめくると自動で翻訳します" else "浮かんでいる「訳」ボタンで翻訳します"
        notify("${StoryStore.displayTitle(title)}：$mode", cancellable = false)
    }

    private fun notify(text: String, cancellable: Boolean) {
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification(text, cancellable))
    }

    private fun notification(text: String, cancellable: Boolean = false): Notification {
        val nm = getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "翻訳中の表示", NotificationManager.IMPORTANCE_LOW))
        }
        fun action(a: String, req: Int) = PendingIntent.getService(this, req, Intent(this, CaptureService::class.java).setAction(a), PendingIntent.FLAG_IMMUTABLE)
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat)
            .setContentTitle("フキダシ翻訳")
            .setContentText(text)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(open)
            .apply {
                if (cancellable) addAction(0, "中止", action(ACTION_CANCEL, 3))
                else addAction(0, "章を一括処理", action(ACTION_BATCH, 2))
            }
            .addAction(0, "停止", action(ACTION_STOP, 1))
            .build()
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
}

fun Context.stopCaptureService() {
    startService(Intent(this, CaptureService::class.java).setAction(CaptureService.ACTION_STOP))
}
