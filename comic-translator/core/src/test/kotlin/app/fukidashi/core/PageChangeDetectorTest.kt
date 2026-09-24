package app.fukidashi.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PageChangeDetectorTest {
    private val w = 360; private val h = 640
    private fun page(seed: Int, overlay: Box? = null): Thumbnail {
        val px = IntArray(w * h) { i ->
            val x = i % w; val y = i / w
            if (overlay != null && x in overlay.left until overlay.right && y in overlay.top until overlay.bottom) return@IntArray -1
            val v = ((x / 40 * 37 + y / 50 * 91 + seed * 53) % 200) + 30
            (0xff shl 24) or (v shl 16) or (v shl 8) or v
        }
        return Thumbnail.fromArgb(px, w, h)
    }

    @Test fun ownOverlayDoesNotCountAsPageTurn() {
        val d = PageChangeDetector()
        val mask = listOf(Box(40, 60, 200, 160))
        d.markShown(page(1), mask)
        assertEquals(PageChangeDetector.Event.NONE, d.feed(page(1, overlay = mask[0])))
    }

    @Test fun turnThenSettle() {
        val d = PageChangeDetector()
        d.markShown(page(1), emptyList())
        assertEquals(PageChangeDetector.Event.PAGE_TURNING, d.feed(page(2)))
        assertEquals(PageChangeDetector.Event.NONE, d.feed(page(3)))
        assertEquals(PageChangeDetector.Event.NONE, d.feed(page(3)))
        assertEquals(PageChangeDetector.Event.PAGE_SETTLED, d.feed(page(3)))
    }

    @Test fun blackCaptureIsDetected() {
        assertTrue(Thumbnail.fromArgb(IntArray(w * h) { 0xff000000.toInt() }, w, h).looksBlank)
    }
}
