// クライアント/サーバー共通の型・定数(fs等のNode APIに依存しない)
export type QuestionType = "direct" | "multi" | "all";
export type QuestionStatus = "open" | "closed";

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  direct: "個別質問",
  multi: "複数人質問",
  all: "全体質問",
};
