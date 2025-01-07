const pdfParse = require('pdf-parse');
const OpenAI = require('openai');

// OpenAI APIキーを設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 環境変数からAPIキーを取得
});

exports.handler = async (event) => {
  try {
    console.log("イベント情報:", event);

    const { body } = event;

    if (!body) {
      console.error("エラー: ファイルがアップロードされていません");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ファイルがアップロードされていません' }),
      };
    }

    const fileBuffer = Buffer.from(body, 'base64');

    const pdfData = await pdfParse(fileBuffer);
    const extractedText = pdfData.text;

    console.log("PDFテキスト:", extractedText);

    if (!extractedText || extractedText.trim() === '') {
      console.error("エラー: PDFからテキストを抽出できませんでした");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'PDFからテキストを抽出できませんでした' }),
      };
    }

    const prompt = `以下の文章を簡潔に要約してください:\n\n${extractedText}`;
    console.log("プロンプト:", prompt);

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // または 'gpt-4'
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.2,
    });

    console.log("OpenAIレスポンス:", openaiResponse);

    const summary = openaiResponse.choices[0]?.message?.content?.trim();

    if (!summary) {
      console.error("エラー: 要約結果が生成されませんでした");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '要約結果が生成されませんでした' }),
      };
    }

    console.log("要約結果:", summary);

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (error) {
    console.error("エラー発生:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `エラーが発生しました: ${error.message}` }),
    };
  }
};
