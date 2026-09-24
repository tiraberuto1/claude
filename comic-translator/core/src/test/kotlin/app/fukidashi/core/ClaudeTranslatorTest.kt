package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ClaudeTranslatorTest {
    @Test fun parsesStructuredOutputAndDropsUnknownIds() {
        val json = """{"translations":[{"id":1,"ja":" 戻ってきたのか！ "},{"id":2,"ja":""},{"id":9,"ja":"余計"}]}"""
        assertEquals(mapOf(1 to "戻ってきたのか！", 2 to ""), ClaudeTranslator.parseResponse(json, setOf(1, 2)))
    }

    @Test fun userTextCarriesNormalizedAndRawText() {
        val b = Balloon(1, listOf(OcrLine("YOU CAME", Box(0, 0, 10, 10)), OcrLine("BACK!", Box(0, 12, 10, 22))), Box(0, 0, 10, 22))
        val t = ClaudeTranslator.userText(PageInput(listOf(b), width = 1080, height = 2400))
        assertTrue("\"text\" : \"You came back!\"" in t, t)
        assertTrue("YOU CAME\\nBACK!" in t, t)
        assertTrue("1080x2400" in t)
    }
}
