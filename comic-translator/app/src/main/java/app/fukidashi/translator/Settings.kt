package app.fukidashi.translator

import android.content.Context

enum class Engine { ON_DEVICE, LOCAL_LLM }

/** ページのめくり方（書籍アプリと作品の向きに合わせる） */
enum class PageTurn(val label: String) {
    SWIPE_LEFT("左へスワイプ（アメコミなど左開き）"),
    SWIPE_RIGHT("右へスワイプ（右開き）"),
    TAP_RIGHT("右端をタップ"),
    TAP_LEFT("左端をタップ"),
}

/** 設定（端末内の非公開領域に保存。allowBackup=false なのでバックアップにも出ない） */
class Settings(context: Context) {
    private val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)

    var engine: Engine
        get() = runCatching { Engine.valueOf(prefs.getString("engine", null) ?: "") }.getOrDefault(Engine.ON_DEVICE)
        set(v) = prefs.edit().putString("engine", v.name).apply()

    /** 端末に取り込んだ LLM モデル（.task）のパス */
    var modelPath: String
        get() = prefs.getString("model_path", "") ?: ""
        set(v) = prefs.edit().putString("model_path", v).apply()

    /** モデルファイルに会話の書式が入っていない場合に、Gemma の書式を自分で付ける */
    var wrapGemmaTemplate: Boolean
        get() = prefs.getBoolean("wrap_gemma", false)
        set(v) = prefs.edit().putBoolean("wrap_gemma", v).apply()

    /** 訳語や文脈を分けて覚える作品名 */
    var workTitle: String
        get() = prefs.getString("work_title", "") ?: ""
        set(v) = prefs.edit().putString("work_title", v.trim()).apply()

    var pageTurn: PageTurn
        get() = runCatching { PageTurn.valueOf(prefs.getString("page_turn", null) ?: "") }.getOrDefault(PageTurn.SWIPE_LEFT)
        set(v) = prefs.edit().putString("page_turn", v.name).apply()

    /** 一括処理で取り込むページ数の上限 */
    var maxPages: Int
        get() = prefs.getInt("max_pages", 40)
        set(v) = prefs.edit().putInt("max_pages", v.coerceIn(2, 200)).apply()

    /** ページがめくられたら自動で訳し直す */
    var autoMode: Boolean
        get() = prefs.getBoolean("auto", true)
        set(v) = prefs.edit().putBoolean("auto", v).apply()
}
