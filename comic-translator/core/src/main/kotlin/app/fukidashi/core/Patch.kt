package app.fukidashi.core

/** 吹き出し 1 つ分の描画内容（画面座標）。background と ink は ARGB */
data class Patch(val box: Box, val background: Int, val ink: Int, val text: String, val letterHeight: Int) {
    fun toJson(): Map<String, Any?> = mapOf("b" to listOf(box.left, box.top, box.right, box.bottom), "bg" to background, "ink" to ink, "t" to text, "lh" to letterHeight)

    companion object {
        fun fromJson(m: Map<String, Any?>): Patch {
            val b = m["b"].asList().map { it.asInt() }
            return Patch(Box(b[0], b[1], b[2], b[3]), m["bg"].asInt(), m["ink"].asInt(), m["t"] as? String ?: "", m["lh"].asInt(12))
        }
    }
}
