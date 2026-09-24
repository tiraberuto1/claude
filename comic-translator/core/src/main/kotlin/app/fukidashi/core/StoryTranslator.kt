package app.fukidashi.core

/**
 * 物語の文脈を使って訳す翻訳器。
 *
 * 章を一括で訳すときは、まず章全体のセリフからあらすじと人名を抜き出し（1 回目）、
 * それを添えて数ページずつ訳す（2 回目以降）。訳したセリフは直前の文脈として次の依頼に入れる。
 * モデルが番号を飛ばした行は一度だけ訳し直し、それでも欠けたものは fallback（端末内の機械翻訳）で埋める。
 */
class StoryTranslator(
    private val engine: LlmEngine,
    val context: StoryContext,
    private val fallback: Translator? = null,
    private val chunkSize: Int = 12,
) : Translator {

    /** 1 ページだけ訳す（読みながら訳すとき）。あらすじ抽出は行わない */
    override fun translate(page: PageInput): Map<Int, String> =
        translateChapter(listOf(page.balloons), summarize = false).first()

    fun translateChapter(
        pages: List<List<Balloon>>,
        summarize: Boolean = true,
        progress: (done: Int, total: Int) -> Unit = { _, _ -> },
        cancelled: () -> Boolean = { false },
    ): List<Map<Int, String>> {
        class Item(val page: Int, val balloon: Balloon)
        val items = pages.flatMapIndexed { p, bs -> bs.map { Item(p, it) } }
        val result = List(pages.size) { LinkedHashMap<Int, String>() }
        if (items.isEmpty()) return result

        var chapterSummary = ""
        val chunks = items.chunked(chunkSize)
        val total = chunks.size + if (summarize) 1 else 0
        var done = 0
        if (summarize && items.size >= 6) {
            val s = StoryPrompts.parseSummary(engine.generate(StoryPrompts.summary(pages.map { bs -> bs.map { it.text } }, context)))
            chapterSummary = s.text
            context.learnNames(s.names, s.styles)
            progress(++done, total)
        } else if (summarize) progress(++done, total)

        for (chunk in chunks) {
            if (cancelled()) break
            val texts = chunk.map { it.balloon.text }
            val got = StoryPrompts.parseNumbered(engine.generate(StoryPrompts.translate(texts, context, chapterSummary)), texts.size).toMutableMap()
            val missing = texts.indices.filter { (it + 1) !in got }
            if (missing.isNotEmpty() && missing.size < texts.size || got.isEmpty()) {
                // 欠けた行だけもう一度
                val retry = if (got.isEmpty()) texts.indices.toList() else missing
                val again = StoryPrompts.parseNumbered(engine.generate(StoryPrompts.translate(retry.map { texts[it] }, context, chapterSummary)), retry.size)
                again.forEach { (n, ja) -> got[retry[n - 1] + 1] = ja }
            }
            val stillMissing = texts.indices.filter { (it + 1) !in got }
            val fb0 = fallback
            if (stillMissing.isNotEmpty() && fb0 != null) {
                val bs = stillMissing.map { chunk[it].balloon }
                val fb = runCatching { fb0.translate(PageInput(bs)) }.getOrDefault(emptyMap())
                stillMissing.forEach { i -> fb[chunk[i].balloon.id]?.let { got[i + 1] = it } }
            }
            chunk.forEachIndexed { i, it ->
                val ja = got[i + 1] ?: return@forEachIndexed
                result[it.page][it.balloon.id] = ja
                context.remember(it.balloon.text, ja)
            }
            progress(++done, total)
        }
        if (chapterSummary.isNotBlank()) context.addSummary(chapterSummary)
        return result
    }
}
