package app.fukidashi.core

import com.anthropic.client.AnthropicClient
import com.anthropic.client.okhttp.AnthropicOkHttpClient
import com.anthropic.core.JsonValue
import com.anthropic.errors.AnthropicIoException
import com.anthropic.errors.AnthropicServiceException
import com.anthropic.errors.PermissionDeniedException
import com.anthropic.errors.RateLimitException
import com.anthropic.errors.UnauthorizedException
import com.anthropic.models.beta.messages.BetaBase64ImageSource
import com.anthropic.models.beta.messages.BetaContentBlockParam
import com.anthropic.models.beta.messages.BetaImageBlockParam
import com.anthropic.models.beta.messages.BetaJsonOutputFormat
import com.anthropic.models.beta.messages.BetaOutputConfig
import com.anthropic.models.beta.messages.BetaStopReason
import com.anthropic.models.beta.messages.BetaTextBlockParam
import com.anthropic.models.beta.messages.BetaThinkingConfigAdaptive
import com.anthropic.models.beta.messages.MessageCreateParams
import com.fasterxml.jackson.databind.ObjectMapper
import java.util.Base64

/**
 * Claude で翻訳する。ページの画像と、OCR で見つけた吹き出しの一覧を一緒に渡すので、
 * 話者や場面を見て口調を決め、OCR の読み違いも絵から補える。
 */
class ClaudeTranslator(
    apiKey: String,
    private val model: String = DEFAULT_MODEL,
    private val client: AnthropicClient = AnthropicOkHttpClient.builder().apiKey(apiKey).build(),
) : Translator {
    override val needsImage get() = true

    override fun translate(page: PageInput): Map<Int, String> {
        if (page.balloons.isEmpty()) return emptyMap()
        val content = ArrayList<BetaContentBlockParam>()
        page.jpeg?.let { jpeg ->
            content += BetaContentBlockParam.ofImage(
                BetaImageBlockParam.builder()
                    .source(
                        BetaBase64ImageSource.builder()
                            .mediaType(BetaBase64ImageSource.MediaType.IMAGE_JPEG)
                            .data(Base64.getEncoder().encodeToString(jpeg))
                            .build()
                    )
                    .build()
            )
        }
        content += BetaContentBlockParam.ofText(BetaTextBlockParam.builder().text(userText(page)).build())

        val params = MessageCreateParams.builder()
            .model(model)
            .maxTokens(8000L)
            .system(SYSTEM_PROMPT)
            .addUserMessageOfBetaContentBlockParams(content)
            .thinking(BetaThinkingConfigAdaptive.builder().build())
            .outputConfig(
                BetaOutputConfig.builder()
                    // セリフの翻訳は深い推論より速さが大事
                    .effort(BetaOutputConfig.Effort.LOW)
                    .format(BetaJsonOutputFormat.builder().schema(schema()).build())
                    .build()
            )
            // 安全分類器に断られたとき、サーバー側で別モデルに切り替えて続けてもらう
            .addBeta(FALLBACK_BETA)
            .putAdditionalBodyProperty("fallbacks", JsonValue.from("default"))
            .build()

        val message = try {
            client.beta().messages().create(params)
        } catch (e: UnauthorizedException) {
            throw TranslationException("Claude の API キーが正しくありません。設定画面で確認してください。", e)
        } catch (e: PermissionDeniedException) {
            throw TranslationException("この API キーではモデル $model を使えません。", e)
        } catch (e: RateLimitException) {
            throw TranslationException("Claude の利用上限に達しました。少し待ってからもう一度試してください。", e)
        } catch (e: AnthropicServiceException) {
            throw TranslationException("Claude がエラーを返しました（${e.statusCode()}）。", e)
        } catch (e: AnthropicIoException) {
            throw TranslationException("Claude に接続できません。通信状態を確認してください。", e)
        }

        when (message.stopReason().orElse(null)) {
            BetaStopReason.REFUSAL -> throw TranslationException("このページは Claude が翻訳を断りました。")
            BetaStopReason.MAX_TOKENS -> throw TranslationException("訳文が長すぎて途中で切れました。")
            else -> {}
        }
        val json = message.content().flatMap { it.text().map { t -> listOf(t.text()) }.orElse(emptyList()) }.joinToString("")
        return parseResponse(json, page.balloons.map { it.id }.toSet())
    }

    companion object {
        const val DEFAULT_MODEL = "claude-opus-5"
        private const val FALLBACK_BETA = "server-side-fallback-2026-07-01"
        private val mapper = ObjectMapper()

        val SYSTEM_PROMPT = """
            あなたはアメリカン・コミックの日本語版を手がける翻訳者です。
            画像はコミックの 1 ページで、続けて OCR が見つけた吹き出し・キャプションの一覧を JSON で渡します。
            訳文はアプリが元の英文の上にそのまま重ねて表示するので、各 id について日本の翻訳コミックとして自然なセリフを返してください。

            - 画像で話者と場面を確かめ、キャラクターに合った口調にする（決め台詞、悪役の尊大さ、子どもの話し方など）。
            - 吹き出しは狭いので簡潔に。意味を落とさない範囲で短くし、説明的な言い足しはしない。
            - OCR は読み違えることがある。text と ocr が絵の文字と食い違うときは、絵の文字を正として訳す。
            - 全大文字の写植は強調ではなく慣習なので、叫びでない限り普通の口調で訳す。太字などの強調は必要なら言い回しで表す。
            - 擬音（SFX）はカタカナの擬音語にする（例: BOOM → ドカーン）。
            - 人名・地名はカタカナ。定着した日本語表記があればそれを使う。
            - ページ番号、作者名、出版社のクレジットなど訳す必要のないものは ja を空文字にする。
            - 一覧にあるすべての id を、一度ずつ返す。
        """.trimIndent()

        fun userText(page: PageInput): String {
            val items = page.balloons.map { b ->
                mapOf(
                    "id" to b.id,
                    "text" to b.text,
                    "ocr" to b.rawText,
                    "box" to listOf(b.box.left, b.box.top, b.box.right, b.box.bottom),
                )
            }
            val size = if (page.width > 0) "画面サイズ ${page.width}x${page.height}px。box は [左, 上, 右, 下] のピクセル座標。\n" else ""
            return size + "吹き出し一覧:\n" + mapper.writerWithDefaultPrettyPrinter().writeValueAsString(items)
        }

        private fun schema(): BetaJsonOutputFormat.Schema {
            val item = mapOf(
                "type" to "object",
                "properties" to mapOf(
                    "id" to mapOf("type" to "integer"),
                    "ja" to mapOf("type" to "string", "description" to "日本語のセリフ。訳さないものは空文字"),
                ),
                "required" to listOf("id", "ja"),
                "additionalProperties" to false,
            )
            return BetaJsonOutputFormat.Schema.builder()
                .putAdditionalProperty("type", JsonValue.from("object"))
                .putAdditionalProperty("properties", JsonValue.from(mapOf("translations" to mapOf("type" to "array", "items" to item))))
                .putAdditionalProperty("required", JsonValue.from(listOf("translations")))
                .putAdditionalProperty("additionalProperties", JsonValue.from(false))
                .build()
        }

        /** {"translations":[{"id":1,"ja":"..."}]} を読む。知らない id は捨てる */
        fun parseResponse(json: String, ids: Set<Int>): Map<Int, String> {
            val root = try { mapper.readTree(json) } catch (e: Exception) {
                throw TranslationException("Claude の応答を読み取れませんでした。", e)
            }
            val out = LinkedHashMap<Int, String>()
            for (t in root.path("translations")) {
                val id = t.path("id").asInt(-1)
                if (id in ids) out[id] = t.path("ja").asText("").trim()
            }
            return out
        }
    }
}
