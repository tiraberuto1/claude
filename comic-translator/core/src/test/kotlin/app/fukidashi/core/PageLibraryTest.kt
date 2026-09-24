package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class PageLibraryTest {
    private fun thumb(seed: Int) = Thumbnail(36, 64, 1080, 2400, FloatArray(36 * 64) { ((it * 7 + seed * 131) % 97) / 97f })

    @Test fun findsStoredPageAfterJsonRoundTrip() {
        val lib = PageLibrary()
        lib.add(thumb(1), listOf(Patch(Box(10, 20, 300, 120), -1, -16777216, "行くぞ！\n「今だ」", 32)))
        lib.add(thumb(2), emptyList())
        val back = PageLibrary.fromJson(lib.toJson())
        val hit = assertNotNull(back.find(thumb(1)))
        assertEquals("行くぞ！\n「今だ」", hit.patches.single().text)
        assertEquals(-16777216, hit.patches.single().ink)
        assertNull(back.find(thumb(3)))
    }

    @Test fun reAddingSamePageReplacesIt() {
        val lib = PageLibrary()
        lib.add(thumb(1), emptyList()); lib.add(thumb(1), emptyList())
        assertEquals(1, lib.size)
    }

    @Test fun miniJsonEscapes() {
        val s = MiniJson.stringify(mapOf("a" to "改行\n\"引用\"", "n" to listOf(1, 2.5, null, true)))
        assertEquals(mapOf("a" to "改行\n\"引用\"", "n" to listOf(1.0, 2.5, null, true)), MiniJson.parse(s))
    }
}
