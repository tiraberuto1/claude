package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals

class ComicTextTest {
    @Test fun joinsHyphenatedWordsAndFixesCase() {
        assertEquals("That was won-derful... I mean, wonderful!",
            ComicText.normalize(listOf("THAT WAS WON-DERFUL...", "I MEAN, WON-", "DERFUL!")))
    }

    @Test fun doubleDashBecomesEmDash() {
        assertEquals("Wait—I'm not done!", ComicText.normalize(listOf("WAIT--", "I'M NOT DONE!")))
    }

    @Test fun mixedCaseIsKept() {
        assertEquals("Hello, Peter.", ComicText.normalize(listOf("Hello,", "Peter .")))
    }

    @Test fun pronounIStaysUppercase() {
        assertEquals("If I go, I'll be back. I've got this.", ComicText.sentenceCase("IF I GO, I'LL BE BACK. I'VE GOT THIS."))
    }
}
