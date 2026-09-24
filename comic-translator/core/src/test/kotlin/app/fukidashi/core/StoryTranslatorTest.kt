package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class StoryTranslatorTest {
    private fun balloon(id: Int, text: String) = Balloon(id, listOf(OcrLine(text, Box(0, id * 40, 100, id * 40 + 30))), Box(0, id * 40, 100, id * 40 + 30))

    /** プロンプトの「[n] 英文」を読んで「[n] 訳n」を返す偽モデル。skip の番号は答えない */
    private class FakeLlm(val skipOnce: Set<String> = emptySet()) : LlmEngine {
        val prompts = ArrayList<String>()
        private val skipped = HashSet<String>()
        override fun generate(prompt: String): String {
            prompts += prompt
            if (prompt.contains("あらすじ: （")) return "あらすじ: ピーターが街を守る。\n登場人物:\nPeter = ピーター（軽口を叩く）\nMary Jane = メリー・ジェーン"
            val todo = prompt.substringAfter("# 訳すセリフ").substringBefore("# 答え方")
            return Regex("""\[(\d+)] (.+)""").findAll(todo).mapNotNull { m ->
                val en = m.groupValues[2]
                if (en in skipOnce && skipped.add(en)) null else "[${m.groupValues[1]}] 訳:${en.length}文字"
            }.joinToString("\n")
        }
    }

    @Test fun chapterIsSummarizedThenTranslatedInChunksWithContext() {
        val ctx = StoryContext("Spider-Man")
        val llm = FakeLlm()
        val pages = List(3) { p -> List(5) { i -> balloon(i + 1, "Line ${p * 5 + i} Peter") } }
        val progress = ArrayList<Int>()
        val out = StoryTranslator(llm, ctx, chunkSize = 6).translateChapter(pages, progress = { d, _ -> progress += d })
        assertEquals(3, out.size)
        assertTrue(out.all { it.size == 5 })
        assertEquals("ピーター", ctx.glossary["Peter"])
        assertEquals("軽口を叩く", ctx.notes["Peter"])
        assertEquals(listOf("ピーターが街を守る。"), ctx.summaries)
        assertEquals(listOf(1, 2, 3, 4), progress)
        // 2 回目以降の依頼には名前の訳と直前のセリフが入る
        val last = llm.prompts.last()
        assertTrue("Peter = ピーター" in last && "# 直前のセリフ" in last && "この章: ピーターが街を守る。" in last, last)
    }

    @Test fun missingLinesAreRetriedThenFilledByFallback() {
        val fallback = object : Translator { override fun translate(page: PageInput) = page.balloons.associate { it.id to "機械訳" } }
        val llm = object : LlmEngine { override fun generate(prompt: String) = "[1] ひとつめ\n[3] English only" }
        val out = StoryTranslator(llm, StoryContext("x"), fallback).translateChapter(listOf(listOf(balloon(1, "One"), balloon(2, "Two"), balloon(3, "Three"))), summarize = false)
        assertEquals("ひとつめ", out[0][1])
        assertEquals("ひとつめ", out[0][2]) // 再試行の [1] が 2 番目の行の答え
        assertEquals("機械訳", out[0][3])
    }

    @Test fun parseNumberedIsLenient() {
        val out = """
            訳は次のとおりです。
            [1] 「行くぞ！」
            2. まさか…
            （3）Where? → どこだ？
            【4】 Hello there
            [9] 余分
        """.trimIndent()
        assertEquals(mapOf(1 to "行くぞ！", 2 to "まさか…", 3 to "どこだ？"), StoryPrompts.parseNumbered(out, 4))
    }

    @Test fun contextRoundTripsThroughJson() {
        val c = StoryContext("X-Men")
        c.learnNames(mapOf("Logan" to "ローガン"), mapOf("Logan" to "ぶっきらぼう"))
        c.remember("Bub.", "よう、坊主")
        c.addSummary("ローガンが戻ってくる。")
        val r = StoryContext.fromJson(c.toJson())
        assertEquals("X-Men", r.title); assertEquals("ローガン", r.glossary["Logan"]); assertEquals("ぶっきらぼう", r.notes["Logan"])
        assertEquals("よう、坊主", r.recent.last().second); assertEquals(listOf("ローガンが戻ってくる。"), r.summaries)
    }
}
