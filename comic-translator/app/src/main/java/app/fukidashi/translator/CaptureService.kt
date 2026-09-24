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
import app.fukidashi.core.Box
import app.fukidashi.core.CachedTranslator
import app.fukidashi.core.ClaudeTranslator
import app.fukidashi.core.PageChangeDetector
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
import kotlinx.coroutines.withContext

/**
 * 画面の取り込みと訳文の表示を受け持つフォアグラウンドサービス。
 * 浮かんでいる「訳」ボタンを押すか、自動モードならページをめくって止まったところで翻訳する。
 */
class CaptureService : Service() {
    companion object {
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_RESULT_DATA = "result_data"
        const val ACTION_STOP = "app.fukidashi.translator.STOP"
        private const val CHANNEL = "capture"
        private const val NOTIFICATION_ID = 1

        @Volatile var isRunning = false
            private set
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var settings: Settings
    private var projection: MediaProjection? = null
    private var capturer: ScreenCapturer? = null
    private var overlay: OverlayController? = null
    private var translator: Translator? = null
    private var mlkit: MlKitTranslator? = null
    private val pipeline by lazy { TranslationPipeline() }
    private val detector = PageChangeDetector()
    private var busy = false
    private var autoJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) { stopSelf(); return START_NOT_STICKY }
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
        capturer = ScreenCapturer(mp).also { startCapture(it) }
        overlay = OverlayController(this, onBubbleTap = ::onBubbleTap, onBubbleLongPress = { stopSelf() })
        translator = buildTranslator()
        isRunning = true
        updateNotification()
        if (settings.autoMode) autoJob = scope.launch { autoLoop() }
        return START_NOT_STICKY
    }

    private fun buildTranslator(): Translator = when (settings.engine) {
        Engine.CLAUDE -> CachedTranslator(ClaudeTranslator(settings.claudeApiKey))
        Engine.ON_DEVICE -> {
            val t = MlKitTranslator().also { mlkit = it }
            // 翻訳モデルを先に取っておく（初回のみ約 30MB）
            scope.launch {
                overlay?.setState(BubbleState.BUSY)
                val err = withContext(Dispatchers.IO) { runCatching { t.ensureModel() }.exceptionOrNull() }
                overlay?.setState(if (err == null) BubbleState.READY else BubbleState.ERROR)
                err?.let { toast(it.message ?: "翻訳モデルを用意できませんでした") }
            }
            CachedTranslator(t)
        }
    }

    private fun onBubbleTap() {
        val o = overlay ?: return
        if (busy) return
        if (o.hasPatches) {
            // 訳文を消して原文に戻す。自動モードでも、次にページが変わるまでは訳し直さない
            o.clear(); o.setState(BubbleState.READY)
            capturer?.snapshot()?.let { detector.markShown(thumb(it), listOf(o.bubbleBox)); it.recycle() }
            return
        }
        scope.launch { translateNow() }
    }

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
            val patches = pipeline.run(bmp, translator ?: return)
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
        overlay?.removeAll(); overlay = null
        capturer?.stop(); capturer = null
        projection?.stop(); projection = null
        mlkit?.close()
        runCatching { pipeline.close() }
        super.onDestroy()
    }

    private fun updateNotification() {
        val mode = if (settings.autoMode) "ページをめくると自動で翻訳します" else "浮かんでいる「訳」ボタンで翻訳します"
        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification(mode))
    }

    private fun notification(text: String): Notification {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "翻訳中の表示", NotificationManager.IMPORTANCE_LOW))
        }
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
        val stop = PendingIntent.getService(this, 1, Intent(this, CaptureService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE)
        return NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat)
            .setContentTitle("フキダシ翻訳")
            .setContentText(text)
            .setOngoing(true)
            .setContentIntent(open)
            .addAction(0, "停止", stop)
            .build()
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
}

fun Context.stopCaptureService() {
    startService(Intent(this, CaptureService::class.java).setAction(CaptureService.ACTION_STOP))
}
