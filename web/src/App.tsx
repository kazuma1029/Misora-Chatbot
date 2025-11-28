import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

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

  const loadConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversation");
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
      }
    } catch (error) {
      console.error("会話の読み込みエラー:", error);
    }
  }, []);

  useEffect(() => {
    if (conversation?.messages.length) {
      scrollToBottom();
    }
  }, [conversation?.messages.length, scrollToBottom]);

  // 初回読み込み時に現在の会話を取得
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const clearConversation = async () => {
    try {
      const res = await fetch("/api/chat/conversation", {
        method: "DELETE",
      });
      if (res.ok) {
        setConversation({ id: "", messages: [] });
        await loadConversation();
      }
    } catch (error) {
      console.error("会話のクリアエラー:", error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const messageToSend = chatMessage;
    setChatMessage("");
    setIsLoading(true);

    // ユーザーメッセージを即座に追加
    const userMessage: ChatMessage = {
      id: Date.now().toString() + "_user",
      role: "user",
      content: messageToSend,
      timestamp: Date.now(),
    };

    // 現在の会話にユーザーメッセージを即座に追加
    setConversation((prev) => {
      if (!prev) {
        return {
          id: "new_conversation",
          messages: [userMessage],
        };
      }
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
      };
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (res.ok) {
        // 会話を再読み込みして最新の状態を取得（LLMの応答を含む）
        await loadConversation();
      } else {
        alert("エラーが発生しました");
        // エラーの場合はユーザーメッセージを削除
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.filter((msg) => msg.id !== userMessage.id),
          };
        });
      }
    } catch {
      alert("通信エラーが発生しました");
      // エラーの場合はユーザーメッセージを削除
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== userMessage.id),
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* ヘッダー */}
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

      {/* チャット履歴 */}
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

      {/* 入力エリア */}
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
