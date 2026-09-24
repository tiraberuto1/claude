package app.fukidashi.translator

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.TextView
import app.fukidashi.core.Box
import app.fukidashi.core.JapaneseLayout
import app.fukidashi.core.Patch
import app.fukidashi.core.TextLayout
import app.fukidashi.core.TextMeasurer
import kotlin.math.abs

/**
 * 他のアプリの上に重ねる窓を管理する。
 *
 * 訳文は吹き出しごとの小さな窓にする。Android 12 以降、他アプリの上に不透明な窓を全面に重ねると
 * その下へのタッチが遮られてページをめくれなくなるため、覆うのは吹き出しの上だけにしている。
 */
class OverlayController(
    private val context: Context,
    private val onBubbleTap: () -> Unit,
    private val onBubbleLongPress: () -> Unit,
) {
    private val wm = context.getSystemService(WindowManager::class.java)
    private val main = Handler(Looper.getMainLooper())
    private val density = context.resources.displayMetrics.density
    private val patches = ArrayList<Pair<View, Patch>>()
    private val bubble: TextView = makeBubble()
    private val bubbleParams = params(dp(58), dp(58), touchable = true).apply { x = dp(12); y = dp(180) }

    val shownBoxes: List<Box> get() = patches.map { it.second.box }
    val hasPatches: Boolean get() = patches.isNotEmpty()
    val bubbleBox: Box get() = Box(bubbleParams.x, bubbleParams.y, bubbleParams.x + bubbleParams.width, bubbleParams.y + bubbleParams.height)

    init { wm.addView(bubble, bubbleParams) }

    fun show(list: List<Patch>) {
        clear()
        for (p in list) {
            val v = PatchView(context, p)
            v.setOnClickListener { peekOriginal() }
            wm.addView(v, params(p.box.width, p.box.height, touchable = true).apply { x = p.box.left; y = p.box.top })
            patches += v to p
        }
    }

    fun clear() {
        for ((v, _) in patches) runCatching { wm.removeView(v) }
        patches.clear()
    }

    /** 画面を取り込む間だけ自分の窓を隠す */
    fun setCaptureHidden(hidden: Boolean) {
        val vis = if (hidden) View.INVISIBLE else View.VISIBLE
        bubble.visibility = vis
        for ((v, _) in patches) v.visibility = vis
    }

    /** 一括処理の進み具合など、短い文字をボタンに出す */
    fun setProgress(text: String) {
        bubble.textSize = 13f
        bubble.text = text
        (bubble.background as GradientDrawable).setColor(BubbleState.BUSY.color)
    }

    fun setState(state: BubbleState) {
        bubble.textSize = 20f
        bubble.text = state.label
        (bubble.background as GradientDrawable).setColor(state.color)
    }

    fun removeAll() { clear(); runCatching { wm.removeView(bubble) } }

    /** 訳文をタップすると、しばらく原文を見せる */
    private fun peekOriginal() {
        for ((v, _) in patches) v.visibility = View.INVISIBLE
        main.postDelayed({ for ((v, _) in patches) v.visibility = View.VISIBLE }, 2500)
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun makeBubble() = TextView(context).apply {
        gravity = Gravity.CENTER
        textSize = 20f
        typeface = Typeface.DEFAULT_BOLD
        setTextColor(Color.WHITE)
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setStroke(dp(3), Color.WHITE) }
        elevation = dp(6).toFloat()
        contentDescription = "吹き出しを翻訳"
        val slop = ViewConfiguration.get(context).scaledTouchSlop
        var downX = 0f; var downY = 0f; var startX = 0; var startY = 0; var moved = false; var downAt = 0L
        setOnTouchListener { _, e ->
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> { downX = e.rawX; downY = e.rawY; startX = bubbleParams.x; startY = bubbleParams.y; moved = false; downAt = e.eventTime }
                MotionEvent.ACTION_MOVE -> {
                    if (abs(e.rawX - downX) > slop || abs(e.rawY - downY) > slop) moved = true
                    if (moved) { bubbleParams.x = startX + (e.rawX - downX).toInt(); bubbleParams.y = startY + (e.rawY - downY).toInt(); wm.updateViewLayout(this, bubbleParams) }
                }
                MotionEvent.ACTION_UP -> if (!moved) {
                    if (e.eventTime - downAt > ViewConfiguration.getLongPressTimeout()) onBubbleLongPress() else onBubbleTap()
                }
            }
            true
        }
    }

    private fun params(w: Int, h: Int, touchable: Boolean) = WindowManager.LayoutParams(
        w, h, WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or (if (touchable) 0 else WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE),
        PixelFormat.TRANSLUCENT,
    ).apply {
        gravity = Gravity.TOP or Gravity.START
        if (Build.VERSION.SDK_INT >= 28) layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        if (Build.VERSION.SDK_INT >= 30) fitInsetsTypes = 0
    }

    private fun dp(v: Int) = (v * density).toInt()
}

enum class BubbleState(val label: String, val color: Int) {
    READY("訳", Color.rgb(224, 68, 44)),
    BUSY("…", Color.rgb(94, 100, 114)),
    SHOWING("原", Color.rgb(27, 31, 42)),
    ERROR("!", Color.rgb(184, 50, 30)),
}

/** 吹き出しの地色で英文を塗りつぶし、日本語を収まる最大の大きさで組む */
@SuppressLint("ViewConstructor")
private class PatchView(context: Context, private val p: Patch) : View(context) {
    private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = p.background }
    private val ink = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = p.ink
        typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
    }
    private var layout: TextLayout? = null

    init { contentDescription = p.text }

    override fun onSizeChanged(w: Int, h: Int, ow: Int, oh: Int) {
        val pad = p.letterHeight * 0.15f
        val measurer = TextMeasurer { t, size -> ink.textSize = size; ink.measureText(t) }
        // 日本語は英語の写植より字面が大きく見えるので、元の字の高さより少し小さい値を上限にする
        layout = JapaneseLayout.fit(p.text, w - pad * 2, h - pad * 2, measurer, maxSize = p.letterHeight * 0.95f, minSize = 9f * resources.displayMetrics.density)
    }

    override fun onDraw(c: Canvas) {
        val r = p.letterHeight * 0.6f
        c.drawRoundRect(RectF(0f, 0f, width.toFloat(), height.toFloat()), r, r, fill)
        val l = layout ?: return
        ink.textSize = l.size
        val fm = ink.fontMetrics
        var y = (height - l.height) / 2f + (l.lineHeight - (fm.descent - fm.ascent)) / 2f - fm.ascent
        for (line in l.lines) {
            c.drawText(line, (width - ink.measureText(line)) / 2f, y, ink)
            y += l.lineHeight
        }
    }
}
