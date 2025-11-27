import express from "express";
import { invokeChatModel } from "../bedrock";
import { database } from "../database";

const router = express.Router();

// 接続テスト用に挨拶を返すエンドポイント
router.get("/hello", (_req, res) => {
  const user = database.getUser();
  res.send(`Hello ${user.userName}`);
});

// 現在の会話を取得
router.get("/conversation", (_req, res) => {
  try {
    const conversation = database.getCurrentConversation();
    res.json({
      conversation: {
        id: conversation?.id,
        messages: conversation?.messages || [],
        createdAt: conversation?.createdAt,
        updatedAt: conversation?.updatedAt,
      },
    });
  } catch (error) {
    console.error("会話取得エラー:", error);
    res.status(500).json({ error: "会話の取得に失敗しました" });
  }
});

// 新しい会話を開始
router.post("/conversation/new", (_req, res) => {
  try {
    const conversation = database.createConversation();
    res.json({
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("新規会話作成エラー:", error);
    res.status(500).json({ error: "新しい会話の作成に失敗しました" });
  }
});

// 会話をクリア
router.delete("/conversation", (_req, res) => {
  try {
    const currentConversation = database.getCurrentConversation();
    if (currentConversation) {
      database.clearConversation(currentConversation.id);
    }
    res.json({ message: "会話をクリアしました" });
  } catch (error) {
    console.error("会話クリアエラー:", error);
    res.status(500).json({ error: "会話のクリアに失敗しました" });
  }
});

// LLMチャット用のエンドポイント（会話履歴対応）
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "メッセージが必要です" });
    }

    // 現在の会話を取得または作成
    const conversation = database.getCurrentConversation();
    if (!conversation) {
      return res.status(500).json({ error: "会話の取得に失敗しました" });
    }

    // ユーザーのメッセージを保存
    const userMessage = database.addMessage(conversation.id, "user", message);

    // 会話履歴を含めてLLMに送信
    const messages = database.getMessages(conversation.id);
    const chatResponse = await invokeChatModel(messages);

    // AIの回答を保存
    const assistantMessage = database.addMessage(
      conversation.id,
      "assistant",
      chatResponse.response
    );

    res.json({
      conversation: {
        id: conversation.id,
        messages: [userMessage, assistantMessage],
      },
      response: chatResponse.response,
    });
  } catch (error) {
    console.error("Bedrock呼び出しエラー:", error);
    res.status(500).json({ error: "LLMからのレスポンスの取得に失敗しました" });
  }
});

export default router;
