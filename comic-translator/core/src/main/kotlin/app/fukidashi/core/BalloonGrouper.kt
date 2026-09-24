package app.fukidashi.core

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * OCR の行を吹き出し単位にまとめる。
 *
 * アメコミの写植は「全大文字・中央揃え・行間が詰まっている」のが基本なので、
 * 字の高さが近く、上下の隙間が字の高さ程度以内で、左右の中心が揃っている行を同じ吹き出しとみなす。
 * 同じ高さに並んだ行は、隙間が狭いときだけ（OCR が 1 行を分割した場合）つなぐ。
 */
class BalloonGrouper(
    private val verticalGap: Float = 0.9f,
    private val sizeRatio: Float = 1.8f,
    private val minLetters: Int = 2,
) {
    fun group(lines: List<OcrLine>): List<Balloon> {
        val ls = lines.filter(::isDialogue)
        if (ls.isEmpty()) return emptyList()
        val parent = IntArray(ls.size) { it }
        fun find(i: Int): Int { var x = i; while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x] }; return x }
        for (i in ls.indices) for (j in i + 1 until ls.size) {
            if (related(ls[i].box, ls[j].box)) parent[find(i)] = find(j)
        }
        val groups = ls.indices.groupBy(::find).values.map { idx -> idx.map { ls[it] }.sortedBy { it.box.top } }
        return groups
            .map { g -> g to g.map { it.box }.reduce(Box::union) }
            .sortedWith(readingOrder())
            .mapIndexed { n, (g, box) -> Balloon(n + 1, g, box) }
    }

    internal fun related(a: Box, b: Box): Boolean {
        val h = min(a.height, b.height).toFloat()
        if (h <= 0) return false
        if (max(a.height, b.height) / h > sizeRatio) return false
        val oy = a.overlapY(b)
        if (oy > h * 0.4f) {
            // 同じ行：OCR が単語の途中で切った程度の隙間ならつなぐ
            return -a.overlapX(b) < h * 0.9f
        }
        if (-oy > h * verticalGap) return false
        // 上下に並ぶ行：中央揃えか、横の重なりが十分にある
        val ox = a.overlapX(b)
        val centered = abs(a.centerX - b.centerX) < max(a.width, b.width) * 0.35f
        return centered || ox > min(a.width, b.width) * 0.6f
    }

    private fun isDialogue(l: OcrLine): Boolean {
        val letters = l.text.count { it.isLetter() }
        if (letters < minLetters && !l.text.any { it == '!' || it == '?' }) return false
        if (l.confidence < 0.3f) return false
        // ページ番号やクレジットのような数字だけの行は除く
        if (l.text.all { it.isDigit() || it.isWhitespace() }) return false
        return true
    }

    /** 上の段から、同じ段の中では左から（行の高さ 2 つ分以内は同じ段とみなす） */
    private fun readingOrder() = Comparator<Pair<List<OcrLine>, Box>> { (ga, a), (gb, b) ->
        val tol = max(ga.first().box.height, gb.first().box.height) * 2
        if (abs(a.top - b.top) > tol) a.top.compareTo(b.top) else a.left.compareTo(b.left)
    }
}
