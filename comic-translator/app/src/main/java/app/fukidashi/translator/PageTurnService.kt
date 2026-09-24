package app.fukidashi.translator

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * 章の一括処理で、書籍アプリのページをめくるためのユーザー補助サービス。
 * 画面の内容は読まず、スワイプかタップの操作を送るだけ。
 */
class PageTurnService : AccessibilityService() {
    companion object {
        @Volatile var instance: PageTurnService? = null
            private set
    }

    override fun onServiceConnected() { instance = this }
    override fun onUnbind(intent: Intent?): Boolean { instance = null; return super.onUnbind(intent) }
    override fun onDestroy() { instance = null; super.onDestroy() }
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    suspend fun turn(mode: PageTurn): Boolean {
        val dm = resources.displayMetrics
        val w = dm.widthPixels.toFloat(); val h = dm.heightPixels.toFloat()
        val path = Path()
        val duration: Long
        when (mode) {
            PageTurn.SWIPE_LEFT -> { path.moveTo(w * 0.85f, h * 0.5f); path.lineTo(w * 0.15f, h * 0.52f); duration = 220 }
            PageTurn.SWIPE_RIGHT -> { path.moveTo(w * 0.15f, h * 0.5f); path.lineTo(w * 0.85f, h * 0.52f); duration = 220 }
            PageTurn.TAP_RIGHT -> { path.moveTo(w * 0.94f, h * 0.5f); duration = 40 }
            PageTurn.TAP_LEFT -> { path.moveTo(w * 0.06f, h * 0.5f); duration = 40 }
        }
        val gesture = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, duration)).build()
        return suspendCancellableCoroutine { cont ->
            val ok = dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(g: GestureDescription?) { if (cont.isActive) cont.resume(true) }
                override fun onCancelled(g: GestureDescription?) { if (cont.isActive) cont.resume(false) }
            }, null)
            if (!ok && cont.isActive) cont.resume(false)
        }
    }
}
