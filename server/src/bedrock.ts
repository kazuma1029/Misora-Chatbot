import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { config } from "./config";
import type { ChatMessage } from "./database";

// ★変更1: クライアントを AgentRuntime (ナレッジベース用) に変更
export const bedrockClient = new BedrockAgentRuntimeClient({
  region: config.aws.region, // ※KBを作成したリージョンと一致させてください
});

export interface ChatResponse {
  response: string;
}

// ★変更2: ナレッジベースを利用した回答生成機能
export async function invokeChatModel(
  messages: ChatMessage[]
): Promise<ChatResponse> {
  
  // チャット履歴の中から「一番新しいユーザーの質問」を取得する
  // (ナレッジベースAPIは「今の質問」をテキストで受け取る仕様のため)
  const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user");
  const inputText = lastUserMessage ? lastUserMessage.content : "質問内容が見つかりません";

  // ナレッジベース検索＆回答生成コマンドの作成
  const command = new RetrieveAndGenerateCommand({
    input: {
    text: inputText,
    },
    retrieveAndGenerateConfiguration: {
    type: "KNOWLEDGE_BASE",
    knowledgeBaseConfiguration: {
      // 【修正】process.env ではなく config から読み込む
      knowledgeBaseId: config.aws.knowledgeBaseId,
      
      // config から読み込む (ここは元のままでOK)
      modelArn: config.aws.bedrockModelId, 
    },
    },
  });

  try {
    console.log("ナレッジベースに問い合わせ中...", inputText);
    
    // Bedrockへ送信
    const response = await bedrockClient.send(command);

    // 回答を取り出す
    return {
      response: response.output?.text || "ナレッジベースからの回答が得られませんでした。",
    };

  } catch (error) {
    console.error("Bedrock Agent Runtime Error:", error);
    // エラー時はそのまま投げるか、エラーメッセージを返す
    throw error;
  }
}

export default { bedrockClient, invokeChatModel };
