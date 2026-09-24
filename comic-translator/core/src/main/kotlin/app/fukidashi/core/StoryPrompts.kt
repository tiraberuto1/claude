package app.fukidashi.core

/**
 * 端末内の小さな LLM 向けのプロンプトと、その出力の読み取り。
 * 小さなモデルは JSON を崩しやすいので、「[番号] 訳文」の行形式で答えさせ、寛容に読む。
 */
object StoryPrompts {
    /** あらすじ抽出に渡す英文の上限（モデルの文脈長 4096 トークンに収めるため） */
    const val SUMMARY_INPUT_CHARS = 5000

    fun summary(pages: List<List<String>>, ctx: StoryContext): String {
        val sb = StringBuilder()
        sb.appendLine("以下はアメリカン・コミックの 1 章分のセリフです（ページ順）。")
        if (ctx.summaries.isNotEmpty()) sb.appendLine("前の章のあらすじ: ${ctx.summaries.last()}")
        sb.appendLine()
        var used = 0
        loop@ for ((p, lines) in pages.withIndex()) {
            for (l in lines) {
                if (used + l.length > SUMMARY_INPUT_CHARS) { sb.appendLine("（以下略）"); break@loop }
                if (used == 0 || l === lines.first()) sb.appendLine("--- ${p + 1} ページ")
                sb.appendLine(l); used += l.length
            }
        }
        sb.appendLine()
        sb.appendLine("次の形式で、日本語で答えてください。")
        sb.appendLine("あらすじ: （この章の出来事を 3〜5 文で）")
        sb.appendLine("登場人物:")
        sb.appendLine("英語の名前 = カタカナの名前（口調や性格を短く）")
        return sb.toString()
    }

    data class Summary(val text: String, val names: Map<String, String>, val styles: Map<String, String>)

    fun parseSummary(out: String): Summary {
        val names = LinkedHashMap<String, String>(); val styles = LinkedHashMap<String, String>()
        val summary = StringBuilder()
        var inSummary = false
        for (raw in out.lines()) {
            val line = raw.trim().trimStart('-', '*', '・', ' ')
            if (line.isEmpty()) continue
            if (line.startsWith("あらすじ")) { inSummary = true; summary.append(line.substringAfter(':').substringAfter('：').trim()); continue }
            if (line.startsWith("登場人物")) { inSummary = false; continue }
            val eq = line.indexOfFirst { it == '=' || it == '＝' }
            if (eq > 0) {
                inSummary = false
                val en = line.substring(0, eq).trim().trim('*')
                var ja = line.substring(eq + 1).trim()
                val open = ja.indexOfFirst { it == '（' || it == '(' }
                if (open >= 0) {
                    styles[en] = ja.substring(open + 1).trimEnd('）', ')').trim()
                    ja = ja.substring(0, open).trim()
                }
                if (en.any { it.isLetter() && it.code < 128 } && ja.isNotEmpty()) names[en] = ja
                continue
            }
            if (inSummary) summary.append(line)
        }
        return Summary(summary.toString().trim(), names, styles)
    }

    fun translate(lines: List<String>, ctx: StoryContext, chapterSummary: String): String {
        val sb = StringBuilder()
        sb.appendLine("あなたはアメリカン・コミックの日本語版の翻訳者です。")
        sb.appendLine("下の英語のセリフを、物語の流れと登場人物の口調を踏まえて、吹き出しに収まる自然で短い日本語のセリフに訳してください。")
        if (ctx.summaries.isNotEmpty() || chapterSummary.isNotBlank()) {
            sb.appendLine().appendLine("# あらすじ")
            ctx.summaries.takeLast(2).forEach { sb.appendLine("- $it") }
            if (chapterSummary.isNotBlank()) sb.appendLine("- この章: $chapterSummary")
        }
        val relevant = ctx.glossary.filterKeys { k -> lines.any { it.contains(k, ignoreCase = true) } }
            .ifEmpty { ctx.glossary.entries.toList().takeLast(12).associate { it.toPair() } }
        if (relevant.isNotEmpty()) {
            sb.appendLine().appendLine("# 名前の訳（必ずこの表記を使う）")
            relevant.forEach { (en, ja) -> sb.appendLine("$en = $ja") }
        }
        val styles = ctx.notes.filterKeys { it in relevant }
        if (styles.isNotEmpty()) {
            sb.appendLine().appendLine("# 口調")
            styles.forEach { (en, n) -> sb.appendLine("${ctx.glossary[en] ?: en}: $n") }
        }
        if (ctx.recent.isNotEmpty()) {
            sb.appendLine().appendLine("# 直前のセリフ（参考。訳し直さない）")
            ctx.recent.takeLast(6).forEach { (en, ja) -> sb.appendLine("$en → $ja") }
        }
        sb.appendLine().appendLine("# 訳すセリフ")
        lines.forEachIndexed { i, l -> sb.appendLine("[${i + 1}] $l") }
        sb.appendLine()
        sb.appendLine("# 答え方")
        sb.appendLine("1 行に 1 つ、「[番号] 訳文」の形で、[1] から [${lines.size}] まですべて番号順に書いてください。")
        sb.appendLine("原文や説明は書かないでください。擬音はカタカナの擬音語にしてください。")
        return sb.toString()
    }

    private val numbered = Regex("""^\s*[\[【(（]?\s*(\d{1,3})\s*[\]】)）:：.．、]\s*(.+?)\s*$""")

    /** 「[番号] 訳文」の行を読む。日本語を含まない行（原文の繰り返しなど）は捨てる */
    fun parseNumbered(out: String, count: Int): Map<Int, String> {
        val res = LinkedHashMap<Int, String>()
        for (line in out.lines()) {
            val m = numbered.find(line) ?: continue
            val n = m.groupValues[1].toInt()
            var text = m.groupValues[2].trim().removeSurrounding("「", "」").trim()
            // 「英文 → 訳文」の形で返してきた場合は訳文だけ取る
            if ("→" in text) text = text.substringAfterLast("→").trim()
            if (n !in 1..count || n in res || text.isEmpty()) continue
            if (!looksJapanese(text)) continue
            res[n] = text
        }
        return res
    }

    fun looksJapanese(s: String) = s.any { it in '぀'..'ヿ' || it in '一'..'鿿' || it in '！'..'～' } ||
        s.none { it in 'a'..'z' || it in 'A'..'Z' }
}
