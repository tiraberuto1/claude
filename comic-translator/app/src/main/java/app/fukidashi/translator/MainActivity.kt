package app.fukidashi.translator

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.provider.Settings as SystemSettings
import android.view.View
import android.widget.Button
import android.widget.CheckBox
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.lifecycleScope
import com.google.android.material.materialswitch.MaterialSwitch
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class MainActivity : AppCompatActivity() {
    private lateinit var settings: Settings
    private lateinit var store: StoryStore
    private var copying = false

    private val projectionRequest = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val data = res.data
        if (res.resultCode != RESULT_OK || data == null) {
            Toast.makeText(this, "画面の取り込みが許可されませんでした", Toast.LENGTH_SHORT).show()
            return@registerForActivityResult
        }
        ContextCompat.startForegroundService(this, Intent(this, CaptureService::class.java)
            .putExtra(CaptureService.EXTRA_RESULT_CODE, res.resultCode)
            .putExtra(CaptureService.EXTRA_RESULT_DATA, data))
        Toast.makeText(this, "書籍アプリでコミックを開き、「訳」ボタンを押してください", Toast.LENGTH_LONG).show()
        moveTaskToBack(true)
    }

    private val notificationRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { requestProjection() }

    private val modelPicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> uri?.let(::importModel) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        settings = Settings(this)
        store = StoryStore(this)

        val group = findViewById<RadioGroup>(R.id.engineGroup)
        group.check(if (settings.engine == Engine.LOCAL_LLM) R.id.engineLlm else R.id.engineOnDevice)
        group.setOnCheckedChangeListener { _, id ->
            settings.engine = if (id == R.id.engineLlm) Engine.LOCAL_LLM else Engine.ON_DEVICE
            refresh()
        }
        findViewById<Button>(R.id.modelButton).setOnClickListener { if (!copying) modelPicker.launch(arrayOf("*/*")) }
        findViewById<CheckBox>(R.id.wrapTemplate).apply {
            isChecked = settings.wrapGemmaTemplate
            setOnCheckedChangeListener { _, on -> settings.wrapGemmaTemplate = on }
        }

        findViewById<TextInputEditText>(R.id.workTitle).apply {
            setText(settings.workTitle)
            doAfterTextChanged { settings.workTitle = it?.toString() ?: ""; refreshStats() }
        }
        findViewById<Button>(R.id.resetWork).setOnClickListener {
            if (CaptureService.isRunning) { toast("翻訳を停止してから消してください"); return@setOnClickListener }
            store.reset(settings.workTitle); refreshStats(); toast("消しました")
        }

        val turns = findViewById<RadioGroup>(R.id.turnGroup)
        PageTurn.entries.forEach { t ->
            turns.addView(RadioButton(this).apply { id = View.generateViewId(); text = t.label; tag = t; isChecked = t == settings.pageTurn })
        }
        turns.setOnCheckedChangeListener { g, id -> (g.findViewById<View>(id)?.tag as? PageTurn)?.let { settings.pageTurn = it } }
        findViewById<TextInputEditText>(R.id.maxPages).apply {
            setText(settings.maxPages.toString())
            doAfterTextChanged { it?.toString()?.toIntOrNull()?.let { n -> settings.maxPages = n } }
        }

        findViewById<MaterialSwitch>(R.id.autoMode).apply {
            isChecked = settings.autoMode
            setOnCheckedChangeListener { _, on -> settings.autoMode = on }
        }
        findViewById<Button>(R.id.overlayButton).setOnClickListener { openOverlaySettings() }
        findViewById<Button>(R.id.a11yButton).setOnClickListener { startActivity(Intent(SystemSettings.ACTION_ACCESSIBILITY_SETTINGS)) }
        findViewById<Button>(R.id.startButton).setOnClickListener { start() }
        findViewById<Button>(R.id.stopButton).setOnClickListener { stopCaptureService(); refresh() }
    }

    override fun onResume() { super.onResume(); refresh() }

    private fun refresh() {
        val overlayOk = SystemSettings.canDrawOverlays(this)
        findViewById<TextView>(R.id.overlayStatus).text =
            if (overlayOk) "✓ 他のアプリの上に訳文を表示できます" else "他のアプリの上に訳文を表示するための許可が必要です"
        findViewById<Button>(R.id.overlayButton).visibility = if (overlayOk) View.GONE else View.VISIBLE

        val a11yOk = accessibilityEnabled()
        findViewById<TextView>(R.id.a11yStatus).text =
            if (a11yOk) "✓ 章の一括処理でページをめくれます" else "章の一括処理には、ユーザー補助の「フキダシ翻訳のページめくり」をオンにします"
        findViewById<Button>(R.id.a11yButton).visibility = if (a11yOk) View.GONE else View.VISIBLE

        findViewById<View>(R.id.llmBox).visibility = if (settings.engine == Engine.LOCAL_LLM) View.VISIBLE else View.GONE
        val model = File(settings.modelPath)
        findViewById<TextView>(R.id.modelStatus).text =
            if (model.exists()) "✓ モデル：${model.name}（${model.length() / 1_000_000} MB）" else "モデルが取り込まれていません"

        val running = CaptureService.isRunning
        findViewById<Button>(R.id.startButton).apply { isEnabled = !running; text = if (running) "翻訳中" else "開始" }
        findViewById<Button>(R.id.stopButton).isEnabled = running
        refreshStats()
    }

    private fun refreshStats() {
        val title = settings.workTitle
        lifecycleScope.launch {
            val (names, pages, chapters) = withContext(Dispatchers.IO) {
                val c = store.loadContext(title); Triple(c.glossary.size, store.loadLibrary(title).size, c.summaries.size)
            }
            findViewById<TextView>(R.id.workStats).text =
                "${StoryStore.displayTitle(title)}：訳語 $names 件・あらすじ $chapters 章分・保存したページ $pages"
        }
    }

    private fun accessibilityEnabled(): Boolean {
        val me = ComponentName(this, PageTurnService::class.java).flattenToString()
        val enabled = SystemSettings.Secure.getString(contentResolver, SystemSettings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
        return enabled.split(':').any { it.equals(me, ignoreCase = true) }
    }

    /** 選んだモデルをアプリの領域にコピーする（MediaPipe はファイルのパスで読むため） */
    private fun importModel(uri: Uri) {
        val name = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
            if (c.moveToFirst()) c.getString(0) else null
        } ?: "model.task"
        if (!name.endsWith(".task") && !name.endsWith(".litertlm")) { toast("MediaPipe 用の .task ファイルを選んでください"); return }
        val size = contentResolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)?.use { c ->
            if (c.moveToFirst()) c.getLong(0) else -1L
        } ?: -1L
        val dir = File(filesDir, "models").apply { mkdirs() }
        val dest = File(dir, name)
        val bar = findViewById<LinearProgressIndicator>(R.id.modelProgress)
        copying = true
        bar.visibility = View.VISIBLE; bar.isIndeterminate = size <= 0; bar.max = 1000
        lifecycleScope.launch {
            val ok = withContext(Dispatchers.IO) {
                runCatching {
                    val tmp = File(dir, "$name.part")
                    contentResolver.openInputStream(uri)!!.use { input ->
                        tmp.outputStream().use { out ->
                            val buf = ByteArray(1 shl 20); var total = 0L
                            while (true) {
                                val n = input.read(buf); if (n < 0) break
                                out.write(buf, 0, n); total += n
                                if (size > 0) withContext(Dispatchers.Main) { bar.progress = (total * 1000 / size).toInt() }
                            }
                        }
                    }
                    // 古いモデルは容量を食うので消す
                    dir.listFiles()?.filter { it.name != tmp.name }?.forEach { it.delete() }
                    tmp.renameTo(dest)
                }.isSuccess
            }
            copying = false
            bar.visibility = View.GONE
            if (ok) { settings.modelPath = dest.absolutePath; toast("モデルを取り込みました") } else toast("モデルを取り込めませんでした。空き容量を確認してください")
            refresh()
        }
    }

    private fun start() {
        if (!SystemSettings.canDrawOverlays(this)) { openOverlaySettings(); return }
        if (settings.engine == Engine.LOCAL_LLM && !File(settings.modelPath).exists()) {
            toast("端末内 AI で訳すには、先にモデルファイルを取り込んでください"); return
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            // 通知は処理状況の表示と「章を一括処理」「停止」に使う。拒否されても翻訳はできる
            notificationRequest.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        requestProjection()
    }

    private fun requestProjection() {
        projectionRequest.launch(getSystemService(MediaProjectionManager::class.java).createScreenCaptureIntent())
    }

    private fun openOverlaySettings() {
        startActivity(Intent(SystemSettings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
    }

    private fun toast(s: String) = Toast.makeText(this, s, Toast.LENGTH_SHORT).show()
}
