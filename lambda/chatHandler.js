import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const region = "ap-northeast-1";
const tableName = "MisoraChatbotQuestions"; // DynamoDB テーブル名（後で作る）

// Bedrock クライアント
const bedrockClient = new BedrockRuntimeClient({ region });

// DynamoDB クライアント
const dynamoClient = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(dynamoClient);

// Lambda handler
export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const userQuestion = body.message;

    // 1️⃣ Bedrock にユーザーの質問を送る
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: userQuestion
          }
        ],
        max_tokens: 300
      })
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const answer = responseBody.content[0].text;

    // 2️⃣ DynamoDB に質問履歴を保存
    const item = {
      id: uuidv4(),
      question: userQuestion,
      answer: answer,
      createdAt: new Date().toISOString()
    };

    await ddb.send(new PutCommand({
      TableName: tableName,
      Item: item
    }));

    // 3️⃣ 成功レスポンス
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({
        answer
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
