package app.fukidashi.core

/**
 * 作品ごとの翻訳メモ。章をまたいで訳語と口調をそろえるために、毎回プロンプトに入れる。
 */
class StoryContext(val title: String) {
    /** 固有名詞の訳（英語 → 日本語） */
    val glossary = LinkedHashMap<String, String>()
    /** 登場人物ごとの口調や性格のメモ（英語名 → メモ） */
    val notes = LinkedHashMap<String, String>()
    /** 直前に訳したセリフ（英語, 日本語）。会話の流れをつなぐ */
    val recent = ArrayDeque<Pair<String, String>>()
    /** これまでの章のあらすじ（新しいものが後ろ） */
    val summaries = ArrayList<String>()

    fun remember(en: String, ja: String) {
        if (ja.isBlank()) return
        recent.addLast(en to ja)
        while (recent.size > RECENT) recent.removeFirst()
    }

    fun addSummary(s: String) {
        if (s.isBlank()) return
        summaries += s.trim()
        while (summaries.size > SUMMARIES) summaries.removeAt(0)
    }

    fun learnNames(names: Map<String, String>, styles: Map<String, String> = emptyMap()) {
        for ((en, ja) in names) if (en.isNotBlank() && ja.isNotBlank()) glossary[en.trim()] = ja.trim()
        for ((en, n) in styles) if (en.isNotBlank() && n.isNotBlank()) notes[en.trim()] = n.trim()
        while (glossary.size > GLOSSARY) glossary.remove(glossary.keys.first())
        while (notes.size > GLOSSARY) notes.remove(notes.keys.first())
    }

    fun toJson(): String = MiniJson.stringify(mapOf(
        "title" to title,
        "glossary" to glossary,
        "notes" to notes,
        "recent" to recent.map { listOf(it.first, it.second) },
        "summaries" to summaries,
    ))

    companion object {
        const val RECENT = 12
        const val SUMMARIES = 4
        const val GLOSSARY = 80

        fun fromJson(json: String): StoryContext {
            val m = MiniJson.parse(json).asMap()
            return StoryContext(m["title"] as? String ?: "").apply {
                m["glossary"].asMap().forEach { (k, v) -> glossary[k] = v.toString() }
                m["notes"].asMap().forEach { (k, v) -> notes[k] = v.toString() }
                m["recent"].asList().forEach { p -> val l = p.asList(); if (l.size == 2) recent.addLast(l[0].toString() to l[1].toString()) }
                m["summaries"].asList().forEach { summaries += it.toString() }
            }
        }
    }
}
