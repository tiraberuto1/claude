package app.fukidashi.core

/** 文字幅の測り方（Android では Paint.measureText を渡す） */
fun interface TextMeasurer {
    fun width(text: String, size: Float): Float
}

data class TextLayout(val size: Float, val lines: List<String>, val lineHeight: Float) {
    val height get() = lines.size * lineHeight
}

/**
 * 日本語の横組みを矩形に収める。
 * 行頭禁則（、。」ッャなど）はぶら下げ、行末禁則（「（など）は次行へ送り、英数字の語は分割しない。
 */
object JapaneseLayout {
    private const val NO_START = "、。，．,.！？!?」』）)]｝〉》ーぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ～…‥・：；ー"
    private const val NO_END = "「『（([｛〈《"
    const val LINE_SPACING = 1.2f

    fun tokens(text: String): List<String> {
        val out = ArrayList<String>()
        var i = 0
        while (i < text.length) {
            val c = text[i]
            if (c.isLatinWordChar()) {
                var j = i
                while (j < text.length && text[j].isLatinWordChar()) j++
                out += text.substring(i, j); i = j
            } else {
                out += c.toString(); i++
            }
        }
        return out
    }

    private fun Char.isLatinWordChar() = this in 'a'..'z' || this in 'A'..'Z' || this in '0'..'9' || this == '\''

    fun wrap(text: String, maxWidth: Float, size: Float, m: TextMeasurer): List<String> {
        val result = ArrayList<String>()
        for (para in text.split('\n')) {
            var line = StringBuilder()
            for (tok in tokens(para)) {
                if (line.isEmpty() && tok == " ") continue
                val candidate = line.toString() + tok
                if (line.isEmpty() || m.width(candidate, size) <= maxWidth) { line.append(tok); continue }
                if (tok.length == 1 && tok[0] in NO_START) { line.append(tok); continue } // ぶら下げ
                var carry = ""
                if (line.length > 1 && line.last() in NO_END) { carry = line.last().toString(); line.setLength(line.length - 1) }
                result += line.toString().trimEnd()
                line = StringBuilder(carry + if (tok == " ") "" else tok)
            }
            if (line.isNotEmpty()) result += line.toString().trimEnd()
        }
        return result
    }

    /** 収まる最大の文字サイズを二分探索で求める。最小サイズでも溢れる場合はそのサイズで返す */
    fun fit(text: String, width: Float, height: Float, m: TextMeasurer, maxSize: Float, minSize: Float = 7f): TextLayout {
        var lo = minSize
        var hi = maxOf(minSize, maxSize)
        var best = layoutAt(text, width, lo, m)
        repeat(18) {
            val mid = (lo + hi) / 2
            val l = layoutAt(text, width, mid, m)
            if (fits(l, width, height, m)) { best = l; lo = mid } else hi = mid
        }
        return best
    }

    private fun layoutAt(text: String, width: Float, size: Float, m: TextMeasurer) =
        TextLayout(size, wrap(text, width, size, m), size * LINE_SPACING)

    private fun fits(l: TextLayout, width: Float, height: Float, m: TextMeasurer) =
        l.height <= height && l.lines.all { m.width(it, l.size) <= width * 1.04f }
}
