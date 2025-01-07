const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI APIキーを環境変数から取得
const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

exports.handler = async (event) => {
    try {
        const { body, isBase64Encoded } = event;

        if (!body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'ファイルがアップロードされていません' }),
            };
        }

        // ファイルデータをバイナリ形式に変換
        const fileBuffer = Buffer.from(body, 'base64');

        // PDFからテキストを抽出
        const pdfData = await pdfParse(fileBuffer);
        const extractedText = pdfData.text;

        // OpenAI APIで要約
        const prompt = `以下の文章を簡潔に要約してください:\n\n${extractedText}`;
        const openaiResponse = await openai.createCompletion({
            model: 'gpt-3.5-turbo', // 使用するモデル
            prompt: prompt,
            max_tokens: 1000, // 最大トークン数
            temperature: 0.2, // ランダム性を低く設定
        });

        const summary = openaiResponse.data.choices[0].text.trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ summary }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `エラーが発生しました: ${error.message}` }),
        };
    }
};
