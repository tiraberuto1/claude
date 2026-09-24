package app.fukidashi.core

/**
 * 章の一括処理で訳したページの保管庫。ページは画面の縮小画像（指紋）で見分け、
 * 読み返したときに OCR も翻訳もせずにすぐ訳文を出す。
 */
class PageLibrary {
    class Page(val thumb: Thumbnail, val patches: List<Patch>)

    private val pages = ArrayList<Page>()
    val size get() = pages.size

    fun add(thumb: Thumbnail, patches: List<Patch>) {
        // 同じページを取り込み直したら置き換える
        pages.removeAll { it.thumb.sameShape(thumb) && it.thumb.difference(thumb) < MATCH }
        pages += Page(thumb, patches)
        while (pages.size > LIMIT) pages.removeAt(0)
    }

    /** いちばん近いページ。十分に近いものがなければ null */
    fun find(thumb: Thumbnail): Page? =
        pages.filter { it.thumb.sameShape(thumb) }
            .minByOrNull { it.thumb.difference(thumb) }
            ?.takeIf { it.thumb.difference(thumb) < MATCH }

    fun clear() = pages.clear()

    fun toJson(): String = MiniJson.stringify(mapOf("pages" to pages.map { p ->
        mapOf(
            "w" to p.thumb.width, "h" to p.thumb.height, "sw" to p.thumb.srcWidth, "sh" to p.thumb.srcHeight,
            "lum" to p.thumb.lum.map { Math.round(it * 1000) },
            "patches" to p.patches.map { it.toJson() },
        )
    }))

    companion object {
        const val MATCH = 0.02f
        const val LIMIT = 600

        fun fromJson(json: String): PageLibrary = PageLibrary().apply {
            for (p in MiniJson.parse(json).asMap()["pages"].asList()) {
                val m = p.asMap()
                val lum = m["lum"].asList().map { it.asInt() / 1000f }.toFloatArray()
                val t = Thumbnail(m["w"].asInt(), m["h"].asInt(), m["sw"].asInt(), m["sh"].asInt(), lum)
                pages += Page(t, m["patches"].asList().map { Patch.fromJson(it.asMap()) })
            }
        }
    }
}
