// 質問/回答のデータモデルと操作
import { randomBytes } from "crypto";
import { readJson, writeJson } from "./store";
import { QuestionType, QuestionStatus, QUESTION_TYPE_LABEL } from "./const";

export type { QuestionType, QuestionStatus } from "./const";
export { QUESTION_TYPE_LABEL } from "./const";

export interface Question {
  id: string;
  type: QuestionType;       // direct=個別 / multi=複数人 / all=全体
  toUserIds: string[];      // direct/multi の対象ユーザー(16桁番号)
  fromAccount: string | null; // 質問者(ログイン済みなら番号・未ログイン=null)
  fromName: string;         // 質問者ニックネーム(任意・空=匿名)
  editToken: string;        // 質問管理トークン(ベストアンサー・操作に使用・ブラウザに保存)
  title: string;            // 質問タイトル(任意)
  body: string;             // 質問本文
  image: string | null;     // 添付画像URL(OGP疑似画像用)
  xUrl: string | null;      // 廃止予定(bot投稿しない)・従来データ互換用
  status: QuestionStatus;
  bestAnswerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  fromAccount: string | null; // 回答者(ログイン済みなら番号・未ログイン=null)
  fromName: string;         // 回答者ニックネーム(任意・空=匿名)
  editToken: string;        // 回答管理トークン
  body: string;
  image: string | null;
  xUrl: string | null;      // 廃止予定・従来データ互換用
  createdAt: string;
}

export function genId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export async function getQuestions(): Promise<Question[]> {
  return readJson<Question[]>("questions.json", []);
}

export async function saveQuestions(qs: Question[]): Promise<void> {
  await writeJson("questions.json", qs);
}

export async function getAnswers(): Promise<Answer[]> {
  return readJson<Answer[]>("answers.json", []);
}

export async function saveAnswers(as: Answer[]): Promise<void> {
  await writeJson("answers.json", as);
}

export async function getQuestion(id: string): Promise<Question | null> {
  const qs = await getQuestions();
  return qs.find((q) => q.id === id) || null;
}

export async function getAnswersForQuestion(questionId: string): Promise<Answer[]> {
  const as = await getAnswers();
  return as.filter((a) => a.questionId === questionId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
