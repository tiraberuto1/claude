package app.fukidashi.translator

import android.graphics.Bitmap
import android.graphics.Color
import app.fukidashi.core.Balloon
import app.fukidashi.core.BalloonGrouper
import app.fukidashi.core.Box
import app.fukidashi.core.OcrLine
import app.fukidashi.core.PageInput
import app.fukidashi.core.Translator
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import kotlin.math.max

/** 吹き出し 1 つ分の描画内容（画面座標） */
data class Patch(val box: Box, val background: Int, val ink: Int, val text: String, val letterHeight: Int)

/** 画面 → OCR → 吹き出しの組み分け → 翻訳 → 貼り紙 */
class TranslationPipeline {
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    private val grouper = BalloonGrouper()

    suspend fun run(bitmap: Bitmap, translator: Translator): List<Patch> {
        val balloons = grouper.group(ocr(bitmap))
        if (balloons.isEmpty()) return emptyList()
        val jpeg = if (translator.needsImage) withContext(Dispatchers.Default) { jpegFor(bitmap) } else null
        val ja = withContext(Dispatchers.IO) { translator.translate(PageInput(balloons, jpeg, bitmap.width, bitmap.height)) }
        return withContext(Dispatchers.Default) {
            balloons.mapNotNull { b ->
                val text = ja[b.id]?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                patchFor(bitmap, b, text)
            }
        }
    }

    private suspend fun ocr(bitmap: Bitmap): List<OcrLine> {
        val result = recognizer.process(InputImage.fromBitmap(bitmap, 0)).await()
        return result.textBlocks.flatMap { block ->
            block.lines.mapNotNull { line ->
                val r = line.boundingBox ?: return@mapNotNull null
                OcrLine(line.text, Box(r.left, r.top, r.right, r.bottom))
            }
        }
    }

    private fun patchFor(bmp: Bitmap, b: Balloon, text: String): Patch {
        val lh = b.lineHeight
        // 英文を確実に覆いつつ、吹き出しの輪郭線にはかからない程度に広げる
        val box = b.box.inflate(max(4, (lh * 0.35f).toInt()), max(3, (lh * 0.25f).toInt())).clampTo(bmp.width, bmp.height)
        val bg = dominantColor(bmp, box)
        val ink = if (luminance(bg) > 0.5f) Color.rgb(20, 20, 24) else Color.WHITE
        return Patch(box, bg, ink, text, lh)
    }

    /** 領域内でいちばん多い明るさの色を地色とみなす（文字の線は少数派） */
    private fun dominantColor(bmp: Bitmap, box: Box): Int {
        val w = box.width; val h = box.height
        if (w <= 0 || h <= 0) return Color.WHITE
        val px = IntArray(w * h)
        bmp.getPixels(px, 0, w, box.left, box.top, w, h)
        val bins = 16
        val count = IntArray(bins); val r = LongArray(bins); val g = LongArray(bins); val bl = LongArray(bins)
        val step = max(1, px.size / 6000)
        for (i in px.indices step step) {
            val p = px[i]
            val k = (luminance(p) * (bins - 1)).toInt()
            count[k]++; r[k] += Color.red(p).toLong(); g[k] += Color.green(p).toLong(); bl[k] += Color.blue(p).toLong()
        }
        val k = count.indices.maxBy { count[it] }
        val n = count[k].coerceAtLeast(1)
        return Color.rgb((r[k] / n).toInt(), (g[k] / n).toInt(), (bl[k] / n).toInt())
    }

    private fun luminance(c: Int) = (0.299f * Color.red(c) + 0.587f * Color.green(c) + 0.114f * Color.blue(c)) / 255f

    /** Claude に送る画像。長辺 2000px に縮めて JPEG にする（通信量と料金を抑える） */
    private fun jpegFor(bmp: Bitmap): ByteArray {
        val scale = minOf(1f, 2000f / max(bmp.width, bmp.height))
        val src = if (scale < 1f) Bitmap.createScaledBitmap(bmp, (bmp.width * scale).toInt(), (bmp.height * scale).toInt(), true) else bmp
        return ByteArrayOutputStream().use { out ->
            src.compress(Bitmap.CompressFormat.JPEG, 85, out)
            if (src !== bmp) src.recycle()
            out.toByteArray()
        }
    }

    fun close() = recognizer.close()
}
