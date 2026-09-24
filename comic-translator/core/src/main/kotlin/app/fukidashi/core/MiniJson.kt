package app.fukidashi.core

/**
 * 保存用の小さな JSON 読み書き（外部ライブラリなしで core を Android と JVM の両方で使うため）。
 * 読み込み結果は Map<String, Any?> / List<Any?> / String / Double / Boolean / null。
 */
object MiniJson {
    fun stringify(v: Any?): String = StringBuilder().also { write(it, v) }.toString()

    private fun write(sb: StringBuilder, v: Any?) {
        when (v) {
            null -> sb.append("null")
            is String -> quote(sb, v)
            is Boolean -> sb.append(v)
            is Float -> sb.append(if (v.isFinite()) v.toString() else "0")
            is Double -> sb.append(if (v.isFinite()) v.toString() else "0")
            is Number -> sb.append(v.toString())
            is Map<*, *> -> {
                sb.append('{')
                var first = true
                for ((k, x) in v) { if (!first) sb.append(','); first = false; quote(sb, k.toString()); sb.append(':'); write(sb, x) }
                sb.append('}')
            }
            is Iterable<*> -> { sb.append('['); v.forEachIndexed { i, x -> if (i > 0) sb.append(','); write(sb, x) }; sb.append(']') }
            is FloatArray -> write(sb, v.toList())
            is IntArray -> write(sb, v.toList())
            else -> quote(sb, v.toString())
        }
    }

    private fun quote(sb: StringBuilder, s: String) {
        sb.append('"')
        for (c in s) when (c) {
            '"' -> sb.append("\\\""); '\\' -> sb.append("\\\\"); '\n' -> sb.append("\\n"); '\r' -> sb.append("\\r"); '\t' -> sb.append("\\t")
            else -> if (c < ' ') sb.append(String.format("\\u%04x", c.code)) else sb.append(c)
        }
        sb.append('"')
    }

    fun parse(s: String): Any? = Parser(s).run { val v = value(); ws(); if (i != s.length) err("余分な文字"); v }

    private class Parser(val s: String) {
        var i = 0
        fun err(m: String): Nothing = throw IllegalArgumentException("JSON: $m ($i)")
        fun ws() { while (i < s.length && s[i].isWhitespace()) i++ }
        fun value(): Any? {
            ws()
            if (i >= s.length) err("終端")
            return when (val c = s[i]) {
                '{' -> obj(); '[' -> arr(); '"' -> str()
                't' -> lit("true", true); 'f' -> lit("false", false); 'n' -> lit("null", null)
                else -> if (c == '-' || c.isDigit()) num() else err("不明な文字 $c")
            }
        }
        fun lit(w: String, v: Any?): Any? { if (!s.startsWith(w, i)) err(w); i += w.length; return v }
        fun num(): Double { val st = i; while (i < s.length && (s[i].isDigit() || s[i] in "+-.eE")) i++; return s.substring(st, i).toDouble() }
        fun str(): String {
            i++
            val sb = StringBuilder()
            while (true) {
                if (i >= s.length) err("文字列が閉じていない")
                val c = s[i++]
                when (c) {
                    '"' -> return sb.toString()
                    '\\' -> when (val e = s[i++]) {
                        'n' -> sb.append('\n'); 'r' -> sb.append('\r'); 't' -> sb.append('\t'); 'b' -> sb.append('\b'); 'f' -> sb.append('\u000c')
                        'u' -> { sb.append(s.substring(i, i + 4).toInt(16).toChar()); i += 4 }
                        else -> sb.append(e)
                    }
                    else -> sb.append(c)
                }
            }
        }
        fun arr(): List<Any?> {
            i++; val out = ArrayList<Any?>(); ws()
            if (s[i] == ']') { i++; return out }
            while (true) { out += value(); ws(); when (s[i++]) { ',' -> {}; ']' -> return out; else -> err("配列") } }
        }
        fun obj(): Map<String, Any?> {
            i++; val out = LinkedHashMap<String, Any?>(); ws()
            if (s[i] == '}') { i++; return out }
            while (true) {
                ws(); val k = str(); ws(); if (s[i++] != ':') err(":"); out[k] = value(); ws()
                when (s[i++]) { ',' -> {}; '}' -> return out; else -> err("オブジェクト") }
            }
        }
    }
}

@Suppress("UNCHECKED_CAST")
internal fun Any?.asMap() = this as? Map<String, Any?> ?: emptyMap()
internal fun Any?.asList() = this as? List<Any?> ?: emptyList()
internal fun Any?.asInt(d: Int = 0) = (this as? Number)?.toInt() ?: d
