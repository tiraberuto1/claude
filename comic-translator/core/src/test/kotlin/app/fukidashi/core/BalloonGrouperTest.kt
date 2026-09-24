package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals

class BalloonGrouperTest {
    private fun line(t: String, l: Int, top: Int, r: Int, h: Int = 30) = OcrLine(t, Box(l, top, r, top + h))

    @Test fun centeredLinesFormOneBalloonAndNeighboursStaySeparate() {
        val lines = listOf(
            // 左上の吹き出し（中央揃え 3 行）
            line("I CAN'T BELIEVE", 100, 100, 340),
            line("YOU CAME BACK", 110, 136, 330),
            line("FOR ME!", 160, 172, 280),
            // 右の吹き出し（同じ高さだが離れている）
            line("WE HAVE", 600, 110, 740),
            line("TO GO. NOW!", 580, 146, 760),
            // 下のキャプション
            line("MEANWHILE...", 120, 700, 360),
        )
        val bs = BalloonGrouper().group(lines)
        assertEquals(3, bs.size)
        assertEquals("I can't believe you came back for me!", bs[0].text)
        assertEquals("We have to go. Now!", bs[1].text)
        assertEquals("Meanwhile...", bs[2].text)
        assertEquals(Box(100, 100, 340, 202), bs[0].box)
    }

    @Test fun splitWordsOnTheSameRowAreJoined() {
        val lines = listOf(line("HOLD", 100, 100, 180), line("ON!", 196, 102, 250))
        assertEquals(1, BalloonGrouper().group(lines).size)
    }

    @Test fun pageNumbersAndSymbolsAreIgnored() {
        val lines = listOf(line("12", 10, 10, 40), line("~", 50, 50, 60), line("WHAT?!", 300, 300, 420))
        val bs = BalloonGrouper().group(lines)
        assertEquals(listOf("What?!"), bs.map { it.text })
    }

    @Test fun bigSoundEffectDoesNotMergeWithSmallDialogue() {
        val lines = listOf(line("KRAKOOM", 100, 100, 600, h = 120), line("LOOK OUT!", 250, 230, 420))
        assertEquals(2, BalloonGrouper().group(lines).size)
    }
}
