package app.fukidashi.translator

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings as SystemSettings
import android.widget.Button
import android.widget.RadioGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import com.google.android.material.materialswitch.MaterialSwitch
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

class MainActivity : AppCompatActivity() {
    private lateinit var settings: Settings

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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        settings = Settings(this)

        val group = findViewById<RadioGroup>(R.id.engineGroup)
        val keyLayout = findViewById<TextInputLayout>(R.id.apiKeyLayout)
        val key = findViewById<TextInputEditText>(R.id.apiKey)
        group.check(if (settings.engine == Engine.CLAUDE) R.id.engineClaude else R.id.engineOnDevice)
        keyLayout.isEnabled = settings.engine == Engine.CLAUDE
        group.setOnCheckedChangeListener { _, id ->
            settings.engine = if (id == R.id.engineClaude) Engine.CLAUDE else Engine.ON_DEVICE
            keyLayout.isEnabled = settings.engine == Engine.CLAUDE
        }
        key.setText(settings.claudeApiKey)
        key.doAfterTextChanged { settings.claudeApiKey = it?.toString() ?: ""; keyLayout.error = null }

        findViewById<MaterialSwitch>(R.id.autoMode).apply {
            isChecked = settings.autoMode
            setOnCheckedChangeListener { _, on -> settings.autoMode = on }
        }
        findViewById<Button>(R.id.overlayButton).setOnClickListener { openOverlaySettings() }
        findViewById<Button>(R.id.startButton).setOnClickListener { start(keyLayout) }
        findViewById<Button>(R.id.stopButton).setOnClickListener { stopCaptureService(); refresh() }
    }

    override fun onResume() { super.onResume(); refresh() }

    private fun refresh() {
        val ok = SystemSettings.canDrawOverlays(this)
        findViewById<TextView>(R.id.overlayStatus).text =
            if (ok) "✓ 他のアプリの上に表示できます" else "他のアプリの上に訳文を表示するための許可が必要です"
        findViewById<Button>(R.id.overlayButton).isEnabled = !ok
        val running = CaptureService.isRunning
        findViewById<Button>(R.id.startButton).apply { isEnabled = !running; text = if (running) "翻訳中" else "開始" }
        findViewById<Button>(R.id.stopButton).isEnabled = running
    }

    private fun start(keyLayout: TextInputLayout) {
        if (!SystemSettings.canDrawOverlays(this)) { openOverlaySettings(); return }
        if (settings.engine == Engine.CLAUDE && settings.claudeApiKey.isBlank()) {
            keyLayout.error = "Claude で翻訳するには API キーを入力してください"
            return
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            // 通知は翻訳中の表示と停止ボタンに使う。拒否されても翻訳はできる
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
}
