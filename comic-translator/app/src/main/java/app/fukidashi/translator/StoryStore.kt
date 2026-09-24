package app.fukidashi.translator

import android.content.Context
import app.fukidashi.core.PageLibrary
import app.fukidashi.core.StoryContext
import java.io.File

/** 作品ごとの訳語・文脈・訳したページを端末内に保存する */
class StoryStore(context: Context) {
    private val root = File(context.filesDir, "works")

    private fun dir(title: String) = File(root, safe(title)).apply { mkdirs() }

    fun loadContext(title: String): StoryContext =
        read(File(dir(title), "context.json"))?.let { runCatching { StoryContext.fromJson(it) }.getOrNull() } ?: StoryContext(displayTitle(title))

    fun saveContext(ctx: StoryContext, title: String) = write(File(dir(title), "context.json"), ctx.toJson())

    fun loadLibrary(title: String): PageLibrary =
        read(File(dir(title), "pages.json"))?.let { runCatching { PageLibrary.fromJson(it) }.getOrNull() } ?: PageLibrary()

    fun saveLibrary(lib: PageLibrary, title: String) = write(File(dir(title), "pages.json"), lib.toJson())

    fun reset(title: String) { File(root, safe(title)).deleteRecursively() }

    private fun read(f: File) = if (f.exists()) f.readText() else null

    /** 書き込み途中で落ちても壊れないよう、一時ファイルに書いてから置き換える */
    private fun write(f: File, text: String) {
        val tmp = File(f.parentFile, f.name + ".tmp")
        tmp.writeText(text)
        if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f) }
    }

    companion object {
        fun displayTitle(t: String) = t.ifBlank { "未設定の作品" }
        private fun safe(t: String) = displayTitle(t).replace(Regex("""[\\/:*?"<>|\s]"""), "_").take(60)
    }
}
