package app.fukidashi.core

/** 1 ページ分の翻訳依頼 */
class PageInput(
    val balloons: List<Balloon>,
    /** 画面の JPEG（Claude のように絵も見る翻訳器だけが使う） */
    val jpeg: ByteArray? = null,
    val width: Int = 0,
    val height: Int = 0,
)

class TranslationException(message: String, cause: Throwable? = null) : Exception(message, cause)

/** 吹き出し id → 日本語。空文字は「訳さない（元の絵を残す）」 */
interface Translator {
    /** 呼び出し側でバックグラウンドスレッドから呼ぶ（ネットワークやモデル推論でブロックする） */
    fun translate(page: PageInput): Map<Int, String>
    val needsImage: Boolean get() = false
}

/** 同じ英文を何度も訳さないための LRU キャッシュ付きラッパー */
class CachedTranslator(private val inner: Translator, private val capacity: Int = 500) : Translator {
    private val cache = object : LinkedHashMap<String, Map<String, String>>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Map<String, String>>) = size > capacity
    }
    override val needsImage get() = inner.needsImage

    @Synchronized
    override fun translate(page: PageInput): Map<Int, String> {
        val key = page.balloons.joinToString("\u0001") { it.text }
        cache[key]?.let { hit -> return page.balloons.associate { it.id to (hit[it.text] ?: "") } }
        val res = inner.translate(page)
        cache[key] = page.balloons.associate { it.text to (res[it.id] ?: "") }
        return res
    }
}
