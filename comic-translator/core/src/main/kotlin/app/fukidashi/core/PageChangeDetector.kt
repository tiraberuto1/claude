package app.fukidashi.core

import kotlin.math.abs

/** 画面を縮小した輝度画像。ページ送りの検出に使う */
class Thumbnail(val width: Int, val height: Int, val srcWidth: Int, val srcHeight: Int, val lum: FloatArray) {
    val mean: Float get() = lum.average().toFloat()
    val contrast: Float get() { val m = mean; return lum.map { abs(it - m) }.average().toFloat() }

    fun sameShape(o: Thumbnail) = width == o.width && height == o.height && srcWidth == o.srcWidth && srcHeight == o.srcHeight

    /** 保護コンテンツ（FLAG_SECURE）の画面はキャプチャが真っ黒になる */
    val looksBlank: Boolean get() = mean < 0.03f && contrast < 0.01f

    companion object {
        /** ARGB の画素配列から平均輝度の縮小画像を作る */
        fun fromArgb(argb: IntArray, w: Int, h: Int, stride: Int = w, cols: Int = 36, rows: Int = 64): Thumbnail {
            val sum = FloatArray(cols * rows); val cnt = IntArray(cols * rows)
            val step = maxOf(1, minOf(w / cols, h / rows) / 4)
            var y = 0
            while (y < h) {
                val r = y * rows / h
                var x = 0
                while (x < w) {
                    val p = argb[y * stride + x]
                    val l = (0.299f * (p shr 16 and 255) + 0.587f * (p shr 8 and 255) + 0.114f * (p and 255)) / 255f
                    val k = r * cols + x * cols / w
                    sum[k] += l; cnt[k]++
                    x += step
                }
                y += step
            }
            return Thumbnail(cols, rows, w, h, FloatArray(cols * rows) { if (cnt[it] > 0) sum[it] / cnt[it] else 0f })
        }
    }

    /** 平均絶対差（0..1）。mask の領域（自分が描いた訳文の上）は比較しない */
    fun difference(o: Thumbnail, mask: List<Box> = emptyList()): Float {
        require(width == o.width && height == o.height)
        var s = 0f; var n = 0
        for (r in 0 until height) for (c in 0 until width) {
            if (mask.isNotEmpty()) {
                val x0 = c * srcWidth / width; val y0 = r * srcHeight / height
                val cell = Box(x0, y0, (c + 1) * srcWidth / width, (r + 1) * srcHeight / height)
                if (mask.any { it.intersects(cell) }) continue
            }
            s += abs(lum[r * width + c] - o.lum[r * width + c]); n++
        }
        return if (n == 0) 0f else s / n
    }
}

/**
 * 自動モードの状態遷移。
 * 訳文を表示中のページと比べて大きく変わったら「めくり中」とし、訳文を消す。
 * 連続した 2 フレームがほぼ同じになったら「落ち着いた」として翻訳を始める。
 */
class PageChangeDetector(private val changeThreshold: Float = 0.05f, private val settleThreshold: Float = 0.012f) {
    enum class Event { NONE, PAGE_TURNING, PAGE_SETTLED }

    private var shown: Thumbnail? = null
    private var shownMask: List<Box> = emptyList()
    private var last: Thumbnail? = null
    private var turning = true
    private var stableFrames = 0

    /** 訳文を表示したページを基準として登録する */
    fun markShown(t: Thumbnail, mask: List<Box>) { shown = t; shownMask = mask; turning = false; stableFrames = 0 }

    fun reset() { shown = null; last = null; turning = true; stableFrames = 0 }

    fun feed(t: Thumbnail): Event {
        val prev = last
        last = t
        if (!turning) {
            val s = shown ?: return Event.NONE
            if (t.difference(s, shownMask) > changeThreshold) { turning = true; stableFrames = 0; return Event.PAGE_TURNING }
            return Event.NONE
        }
        if (prev == null) return Event.NONE
        stableFrames = if (t.difference(prev) < settleThreshold) stableFrames + 1 else 0
        if (stableFrames >= 2) { turning = false; stableFrames = 0; shown = t; shownMask = emptyList(); return Event.PAGE_SETTLED }
        return Event.NONE
    }
}
