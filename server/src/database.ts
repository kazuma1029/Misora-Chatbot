// removed unused import

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationData {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface UserData {
  userName: string;
  currentConversationId?: string;
}

export interface Database {
  getUser(): UserData;
  updateUser(userData: Partial<UserData>): UserData;

  // 会話関連の操作
  createConversation(): ConversationData;
  getConversation(conversationId: string): ConversationData | null;
  getCurrentConversation(): ConversationData | null;
  addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): ChatMessage;
  getMessages(conversationId: string): ChatMessage[];
  clearConversation(conversationId: string): void;
  deleteConversation(conversationId: string): void;
}

// 現在のシンプルなメモリベースのデータベース実装
class SimpleDatabase implements Database {
  private data: UserData;
  private conversations: Map<string, ConversationData> = new Map();

  constructor() {
    this.data = {
      userName: process.env.DEFAULT_USER_NAME || "Default User",
    };
  }

  getUser(): UserData {
    return { ...this.data };
  }

  updateUser(userData: Partial<UserData>): UserData {
    this.data = { ...this.data, ...userData };
    return { ...this.data };
  }

  createConversation(): ConversationData {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation: ConversationData = {
      id,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.conversations.set(id, conversation);
    this.data.currentConversationId = id;
    return { ...conversation };
  }

  getConversation(conversationId: string): ConversationData | null {
    const conversation = this.conversations.get(conversationId);
    return conversation
      ? { ...conversation, messages: [...conversation.messages] }
      : null;
  }

  getCurrentConversation(): ConversationData | null {
    if (!this.data.currentConversationId) {
      return this.createConversation();
    }
    return this.getConversation(this.data.currentConversationId);
  }

  addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): ChatMessage {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`会話が見つかりません: ${conversationId}`);
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();

    return { ...message };
  }

  getMessages(conversationId: string): ChatMessage[] {
    const conversation = this.conversations.get(conversationId);
    return conversation ? [...conversation.messages] : [];
  }

  clearConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages = [];
      conversation.updatedAt = Date.now();
    }
  }

  deleteConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
    if (this.data.currentConversationId === conversationId) {
      this.data.currentConversationId = undefined;
    }
  }
}

export const database = new SimpleDatabase();

export default database;
