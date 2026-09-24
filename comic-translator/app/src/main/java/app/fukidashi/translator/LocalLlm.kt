package app.fukidashi.translator

import android.content.Context
import android.util.Log
import app.fukidashi.core.LlmEngine
import app.fukidashi.core.TranslationException
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import java.io.Closeable
import java.io.File

/**
 * MediaPipe LLM Inference で端末内のモデルを動かす。通信も課金もない。
 * GPU で開けなければ CPU で開き直す。依頼ごとに新しいセッションを作り、前の依頼の内容を持ち越さない
 * （文脈はプロンプトに明示的に入れる）。
 */
class LocalLlm(context: Context, modelPath: String, private val wrapGemma: Boolean) : LlmEngine, Closeable {
    private val llm: LlmInference

    init {
        if (!File(modelPath).exists()) throw TranslationException("LLM のモデルファイルが見つかりません。設定画面でモデルを取り込んでください。")
        llm = open(context, modelPath, LlmInference.Backend.GPU) ?: open(context, modelPath, LlmInference.Backend.CPU)
            ?: throw TranslationException("LLM のモデルを開けませんでした。対応する .task ファイルか、端末のメモリが足りているか確認してください。")
    }

    private fun open(context: Context, path: String, backend: LlmInference.Backend): LlmInference? = try {
        LlmInference.createFromOptions(
            context,
            LlmInference.LlmInferenceOptions.builder()
                .setModelPath(path)
                .setMaxTokens(4096)
                .setMaxTopK(40)
                .setPreferredBackend(backend)
                .build(),
        )
    } catch (e: Exception) {
        Log.w("LocalLlm", "open with $backend failed", e)
        null
    }

    @Synchronized
    override fun generate(prompt: String): String {
        val session = LlmInferenceSession.createFromOptions(
            llm,
            LlmInferenceSession.LlmInferenceSessionOptions.builder()
                // 翻訳は揺れが少ないほうがよい
                .setTemperature(0.3f)
                .setTopK(20)
                .build(),
        )
        try {
            session.addQueryChunk(if (wrapGemma) "<start_of_turn>user\n$prompt<end_of_turn>\n<start_of_turn>model\n" else prompt)
            return session.generateResponse()
        } catch (e: Exception) {
            throw TranslationException("端末内 LLM の実行に失敗しました（${e.message}）", e)
        } finally {
            session.close()
        }
    }

    override fun close() = llm.close()
}
