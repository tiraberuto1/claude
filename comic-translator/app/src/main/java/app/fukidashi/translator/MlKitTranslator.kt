package app.fukidashi.translator

import app.fukidashi.core.PageInput
import app.fukidashi.core.TranslationException
import app.fukidashi.core.Translator
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import java.io.Closeable
import java.util.concurrent.ExecutionException

/** ML Kit の端末内翻訳（英→日）。初回だけ約 30MB の翻訳モデルをダウンロードする */
class MlKitTranslator : Translator, Closeable {
    private val client = Translation.getClient(
        TranslatorOptions.Builder()
            .setSourceLanguage(TranslateLanguage.ENGLISH)
            .setTargetLanguage(TranslateLanguage.JAPANESE)
            .build()
    )

    /** バックグラウンドスレッドから呼ぶ */
    fun ensureModel() {
        try {
            Tasks.await(client.downloadModelIfNeeded(DownloadConditions.Builder().build()))
        } catch (e: ExecutionException) {
            throw TranslationException("翻訳モデルをダウンロードできませんでした。通信状態を確認してください。", e)
        }
    }

    override fun translate(page: PageInput): Map<Int, String> {
        ensureModel()
        return page.balloons.associate { b ->
            b.id to try { Tasks.await(client.translate(b.text)) } catch (e: ExecutionException) {
                throw TranslationException("端末内翻訳に失敗しました。", e)
            }
        }
    }

    override fun close() = client.close()
}
