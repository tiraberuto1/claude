package app.fukidashi.core

/** アメコミ写植の英文を、機械翻訳に通しやすい普通の文に直す */
object ComicText {
    private val contractionsOfI = Regex("\\bi(?=('m|'ll|'ve|'d)?\\b)")

    fun normalize(lines: List<String>): String {
        val sb = StringBuilder()
        for (raw in lines) {
            val line = raw.trim()
            if (line.isEmpty()) continue
            if (sb.isEmpty()) { sb.append(line); continue }
            val prev = sb.last()
            // 行末ハイフンで単語が分かれている（"WON-" + "DERFUL"）。"--" はダッシュなので残す
            if (prev == '-' && sb.length >= 2 && sb[sb.length - 2].isLetter() && line.first().isLetter()) {
                sb.setLength(sb.length - 1)
                sb.append(line)
            } else {
                sb.append(' ').append(line)
            }
        }
        var s = sb.toString()
            .replace(Regex("\\s*--\\s*"), "—")
            .replace(Regex("\\s+"), " ")
            .replace(Regex("\\s+([,.!?…])"), "$1")
            .trim()
        if (isShouting(s)) s = sentenceCase(s)
        return s
    }

    /** 英字の 8 割以上が大文字なら写植の全大文字とみなす */
    fun isShouting(s: String): Boolean {
        val letters = s.filter { it.isLetter() }
        if (letters.length < 3) return false
        return letters.count { it.isUpperCase() } >= letters.length * 0.8
    }

    fun sentenceCase(s: String): String {
        val lower = s.lowercase()
        val out = StringBuilder(lower.length)
        var capNext = true
        for (c in lower) {
            if (capNext && c.isLetter()) { out.append(c.uppercaseChar()); capNext = false; continue }
            out.append(c)
            if (c == '.' || c == '!' || c == '?' || c == '…' || c == '—') capNext = true
        }
        return contractionsOfI.replace(out) { "I" }
    }
}
