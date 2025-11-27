import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// 環境変数を読み込み（.env.localを優先的に読み込む）
const envLocalPath = path.resolve(__dirname, "../.env.local");
if (existsSync(envLocalPath)) {
	dotenv.config({ path: envLocalPath });
}
// .env.localが存在しない場合に備えて.envも読み込む
dotenv.config();

export interface AppConfig {
	aws: {
		region: string;
		bedrockModelId: string;
		knowledgeBaseId: string;
	};
}

export const config: AppConfig = {
	aws: {
		region: process.env.AWS_REGION || "ap-northeast-1",
		bedrockModelId: process.env.BEDROCK_MODEL_ID || process.env.MODEL_ID ||"",
		knowledgeBaseId: process.env.KNOWLEDGE_BASE_ID || "",
	},
};

export default config;
