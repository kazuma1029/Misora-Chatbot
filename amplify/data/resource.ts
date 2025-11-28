import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // 会話履歴を管理するモデル
  Conversation: a.model({
    // 自動的に id, createdAt, updatedAt が追加されます
    messages: a.hasMany('Message', 'conversationId'), // Messageモデルと紐付け
  })
  .authorization(allow => [allow.publicApiKey()]), // 一旦誰でもアクセス可（開発用）

  // 個々のメッセージ
  Message: a.model({
    conversationId: a.id(),
    conversation: a.belongsTo('Conversation', 'conversationId'),
    role: a.string(),    // "user" or "assistant"
    content: a.string(), // メッセージ内容
    timestamp: a.float() // 時間
  })
  .authorization(allow => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});