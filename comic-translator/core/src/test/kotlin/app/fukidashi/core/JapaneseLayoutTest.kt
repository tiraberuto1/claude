package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class JapaneseLayoutTest {
    /** 全角 1 字 = size、半角 = size/2 の等幅とみなす */
    private val mono = TextMeasurer { t, size -> t.sumOf { if (it.code < 0x2000) 0.5 else 1.0 }.toFloat() * size }

    @Test fun punctuationHangsInsteadOfStartingALine() {
        val lines = JapaneseLayout.wrap("まさか、戻ってくるなんて。", 5f, 1f, mono)
        assertTrue(lines.none { it.first() in "、。っ" }, lines.toString())
        // 幅 5 字に「まさか、戻」が入り、次の「っ」は行頭に置けないのでぶら下げる
        assertEquals(listOf("まさか、戻っ", "てくるなんて", "。").take(1), lines.take(1))
    }

    @Test fun openingBracketMovesToNextLine() {
        val lines = JapaneseLayout.wrap("行くぞ「今すぐだ」", 4f, 1f, mono)
        assertTrue(lines.none { it.last() == '「' }, lines.toString())
    }

    @Test fun latinWordsAreNotSplit() {
        val lines = JapaneseLayout.wrap("これはNEWYORKだ", 6f, 1f, mono)
        assertTrue(lines.any { "NEWYORK" in it }, lines.toString())
    }

    @Test fun fitFindsLargestSizeThatFits() {
        val l = JapaneseLayout.fit("逃げろ！ここはもうもたない！", 120f, 80f, mono, maxSize = 60f)
        assertTrue(l.height <= 80f)
        assertTrue(l.lines.all { mono.width(it, l.size) <= 120f * 1.04f })
        // 1 ポイント大きいと溢れる
        val bigger = JapaneseLayout.wrap("逃げろ！ここはもうもたない！", 120f, l.size + 1f, mono)
        assertTrue(bigger.size * (l.size + 1f) * JapaneseLayout.LINE_SPACING > 80f || bigger.any { mono.width(it, l.size + 1) > 120f * 1.04f })
    }
}
