package app.fukidashi.translator

import android.content.Context

enum class Engine { ON_DEVICE, CLAUDE }

/** 設定（端末内の非公開領域に保存。allowBackup=false なのでバックアップにも出ない） */
class Settings(context: Context) {
    private val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)

    var engine: Engine
        get() = runCatching { Engine.valueOf(prefs.getString("engine", null) ?: "") }.getOrDefault(Engine.ON_DEVICE)
        set(v) = prefs.edit().putString("engine", v.name).apply()

    var claudeApiKey: String
        get() = prefs.getString("claude_api_key", "") ?: ""
        set(v) = prefs.edit().putString("claude_api_key", v.trim()).apply()

    /** ページがめくられたら自動で訳し直す */
    var autoMode: Boolean
        get() = prefs.getBoolean("auto", true)
        set(v) = prefs.edit().putBoolean("auto", v).apply()
}
