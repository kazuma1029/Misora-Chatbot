import { useState, useEffect, useRef, useCallback } from "react";
// --- インポート ---
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify"; // ★追加
import outputs from "../../amplify_outputs.json"; // ★追加 (パスは環境に合わせて ../../ 等に)
import type { Schema } from "../../amplify/data/resource"; 
import "./App.css";

// --- ★ここで初期設定を実行する (generateClientより前) ---
Amplify.configure(outputs);

// --- クライアントを生成 ---
const client = generateClient<Schema>();

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  messages: ChatMessage[];
}

function App() {
  const [chatMessage, setChatMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ★修正: 会話データの読み込み (fetch -> client.models)
  const loadConversation = useCallback(async () => {
    try {
      // 1. 会話ルーム一覧を取得 (無ければ作る)
      const { data: convList } = await client.models.Conversation.list();
      
      let currentConvId;
      if (convList.length > 0) {
        currentConvId = convList[0].id;
      } else {
        // 新規作成
        const { data: newConv } = await client.models.Conversation.create({});
        if(newConv) currentConvId = newConv.id;
      }

      if (!currentConvId) return;

      // 2. その会話に紐づくメッセージを取得
      // (DynamoDBから取得し、timestamp順に並べる)
      const { data: messages } = await client.models.Message.list({
        filter: { conversationId: { eq: currentConvId } }
      });

      // 取得したデータをアプリの型に合わせて変換
      const formattedMessages: ChatMessage[] = messages
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        .map((msg) => ({
          id: msg.id,
          role: (msg.role as "user" | "assistant") || "user",
          content: msg.content || "",
          timestamp: msg.timestamp || Date.now(),
        }));

      setConversation({
        id: currentConvId,
        messages: formattedMessages,
      });

    } catch (error) {
      console.error("会話の読み込みエラー:", error);
    }
  }, []);

  useEffect(() => {
    if (conversation?.messages.length) {
      scrollToBottom();
    }
  }, [conversation?.messages.length, scrollToBottom]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // ★修正: 会話のクリア (fetch -> client.models)
  const clearConversation = async () => {
    if (!conversation?.id) return;
    try {
      // まずメッセージを全て削除
      const { data: messages } = await client.models.Message.list({
        filter: { conversationId: { eq: conversation.id } }
      });
      
      await Promise.all(
        messages.map(msg => client.models.Message.delete({ id: msg.id }))
      );

      // 画面もクリア
      setConversation({ id: conversation.id, messages: [] });
    } catch (error) {
      console.error("会話のクリアエラー:", error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !conversation?.id) return;

    const messageToSend = chatMessage;
    setChatMessage("");
    setIsLoading(true);

    // ★修正: ユーザーのメッセージをDBに保存 (fetch -> client.models)
    try {
      await client.models.Message.create({
        conversationId: conversation.id,
        role: "user",
        content: messageToSend,
        timestamp: Date.now(),
      });
      
      // 即座に画面更新するためにロード
      await loadConversation();


    const res = await fetch("https://ghtcldag8k.execute-api.ap-northeast-1.amazonaws.com/prod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const aiText = data.answer ?? "すみません、返答の取得に失敗しました。";

      // ② 返ってきた AI メッセージを Amplify 側の DB に保存
      await client.models.Message.create({
        conversationId: conversation.id,
        role: "assistant",
        content: aiText,
        timestamp: Date.now(),
      });

      // ③ もう一度会話を読み込み（AIの発言を反映）
      await loadConversation();
      // ---------------
      // 【重要】ここでAI (Bedrock) を呼び出す処理が入りますが、
      // まだバックエンド(Lambda)を作っていないため、一旦スキップします。
      // 次のステップでここを実装します。
      // ---------------

    } catch (err) {
      console.error(err);
      alert("送信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // ... (以下、handleKeyPress や return 部分は変更なし) ...
  // return文の中身はそのままでOKです
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-container">
        {/* ... (既存のJSXコードそのまま) ... */}
        {/* 省略していますが、returnの中身は元のコードと同じで構いません */}
        <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0, color: "#646cff" }}>美空市チャットボット</h1>
        <button
          type="button"
          onClick={clearConversation}
          style={{
            padding: "8px 16px",
            backgroundColor: "#333",
            color: "white",
            border: "1px solid #666",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          会話をクリア
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {conversation?.messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              flexDirection: message.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: message.role === "user" ? "#646cff" : "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {message.role === "user" ? "You" : "AI"}
            </div>
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "16px",
                backgroundColor: message.role === "user" ? "#646cff" : "#333",
                color: "white",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              <div>{message.content}</div>
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.7,
                  marginTop: "4px",
                }}
              >
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              AI
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "16px",
                backgroundColor: "#333",
                color: "white",
              }}
            >
              考えています...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #333",
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力してください (Enter: 送信, Shift+Enter: 改行)"
          rows={3}
          style={{
            flex: 1,
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #646cff",
            backgroundColor: "#2a2a2a",
            color: "rgba(255, 255, 255, 0.87)",
            resize: "none",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={sendChatMessage}
          disabled={isLoading || !chatMessage.trim()}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor:
              isLoading || !chatMessage.trim() ? "#666" : "#646cff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor:
              isLoading || !chatMessage.trim() ? "not-allowed" : "pointer",
            height: "fit-content",
          }}
        >
          {isLoading ? "送信中..." : "送信"}
        </button>
      </div>
    </div>
  );
}

export default App;