package app.fukidashi.core

import kotlin.math.max
import kotlin.math.min

/** 画面座標の矩形（ピクセル、right/bottom は含まない） */
data class Box(val left: Int, val top: Int, val right: Int, val bottom: Int) {
    val width get() = right - left
    val height get() = bottom - top
    val centerX get() = (left + right) / 2f
    val centerY get() = (top + bottom) / 2f
    val area get() = width.toLong() * height

    fun union(o: Box) = Box(min(left, o.left), min(top, o.top), max(right, o.right), max(bottom, o.bottom))
    fun inflate(dx: Int, dy: Int = dx) = Box(left - dx, top - dy, right + dx, bottom + dy)
    fun clampTo(w: Int, h: Int) = Box(left.coerceIn(0, w), top.coerceIn(0, h), right.coerceIn(0, w), bottom.coerceIn(0, h))
    fun intersects(o: Box) = left < o.right && o.left < right && top < o.bottom && o.top < bottom

    /** 横方向の重なり幅（負なら隙間） */
    fun overlapX(o: Box) = min(right, o.right) - max(left, o.left)
    /** 縦方向の重なり幅（負なら隙間） */
    fun overlapY(o: Box) = min(bottom, o.bottom) - max(top, o.top)
}

/** OCR が返す 1 行 */
data class OcrLine(val text: String, val box: Box, val confidence: Float = 1f)

/** 吹き出し（またはキャプション）1 つ分にまとめた行 */
data class Balloon(val id: Int, val lines: List<OcrLine>, val box: Box) {
    /** 翻訳に渡す英文（改行・ハイフン分割を直し、全大文字を文頭大文字に） */
    val text: String by lazy { ComicText.normalize(lines.map { it.text }) }
    /** OCR のままの文字列（Claude には原文も渡す） */
    val rawText: String get() = lines.joinToString("\n") { it.text }
    /** 文字の大きさの目安（行の高さの中央値） */
    val lineHeight: Int get() = lines.map { it.box.height }.sorted()[lines.size / 2]
}
