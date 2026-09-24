package app.fukidashi.core

/** 端末内 LLM（MediaPipe など）。1 回の呼び出しで 1 つの応答を返す。ブロックするのでバックグラウンドから呼ぶ */
fun interface LlmEngine {
    fun generate(prompt: String): String
}
