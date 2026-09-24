package app.fukidashi.translator

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.os.Handler
import android.os.HandlerThread

/**
 * MediaProjection で画面を仮想ディスプレイに映し、最新フレームを 1 枚だけ保持する。
 * 画面が変わらないとフレームは届かないので、最後に届いたものを取っておく。
 */
class ScreenCapturer(private val projection: MediaProjection) {
    private val thread = HandlerThread("capture").apply { start() }
    private val handler = Handler(thread.looper)
    private var reader: ImageReader? = null
    private var display: VirtualDisplay? = null
    private val lock = Any()
    private var latest: Image? = null
    @Volatile var frameTimeNanos = 0L; private set
    var width = 0; private set
    var height = 0; private set

    @SuppressLint("WrongConstant")
    fun start(w: Int, h: Int, dpi: Int) {
        if (w == width && h == height && display != null) return
        width = w; height = h
        val r = ImageReader.newInstance(w, h, PixelFormat.RGBA_8888, 3)
        r.setOnImageAvailableListener({ ir ->
            val img = runCatching { ir.acquireLatestImage() }.getOrNull() ?: return@setOnImageAvailableListener
            synchronized(lock) { latest?.close(); latest = img; frameTimeNanos = System.nanoTime() }
        }, handler)
        val old = display
        if (old == null) {
            display = projection.createVirtualDisplay("fukidashi", w, h, dpi, DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, r.surface, null, handler)
        } else {
            old.resize(w, h, dpi); old.surface = r.surface
        }
        synchronized(lock) { latest?.close(); latest = null }
        reader?.close()
        reader = r
    }

    /** 最新フレームを Bitmap にする（まだ 1 枚も届いていなければ null） */
    fun snapshot(): Bitmap? = synchronized(lock) {
        val img = latest ?: return null
        val plane = img.planes[0]
        val pixelStride = plane.pixelStride
        val rowPadding = plane.rowStride - pixelStride * img.width
        val padded = Bitmap.createBitmap(img.width + rowPadding / pixelStride, img.height, Bitmap.Config.ARGB_8888)
        plane.buffer.rewind()
        padded.copyPixelsFromBuffer(plane.buffer)
        if (rowPadding == 0) padded else Bitmap.createBitmap(padded, 0, 0, img.width, img.height).also { padded.recycle() }
    }

    fun stop() {
        display?.release(); display = null
        synchronized(lock) { latest?.close(); latest = null }
        reader?.close(); reader = null
        thread.quitSafely()
    }
}
