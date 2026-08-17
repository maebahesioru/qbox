// 質問詳細(OGP/疑似画像対応)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuestion, getAnswersForQuestion } from "@/lib/data";
import { getUsers } from "@/lib/auth";
import { siteUrl } from "@/lib/xpost";
import { QuestionThread } from "@/components/question-thread";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q) return { title: "質問が見つかりません - QBOX" };

  const title = q.title ? `${q.title} | QBOX` : "QBOXの質問";
  const description = q.body.slice(0, 120);
  const url = siteUrl(`/q/${q.id}`);
  const image = q.image ? siteUrl(q.image) : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "QBOX",
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [q, answers, users] = await Promise.all([getQuestion(id), getAnswersForQuestion(id), getUsers()]);
  if (!q) notFound();

  const mask = (n: string) => (n ? `${n.slice(0, 2)}••${n.slice(-2)}` : "");
  // 表示名解決: アカウント紐付け→ニックネーム→匿名
  const resolveName = (account: string | null, name: string) => {
    if (account && users[account]) {
      return { display: users[account].displayName, masked: mask(account), anonymous: false };
    }
    if (name) return { display: name, masked: "", anonymous: false };
    return { display: "匿名", masked: "", anonymous: true };
  };

  const serialized = {
    question: {
      ...q,
      editToken: undefined,
      fromUser: resolveName(q.fromAccount, q.fromName),
      toDisplay: q.toUserIds.map((tid) => ({
        id: tid,
        name: users[tid]?.displayName || "不明",
      })),
    },
    answers: answers.map((a) => ({
      ...a,
      editToken: undefined,
      user: resolveName(a.fromAccount, a.fromName),
      isBest: q.bestAnswerId === a.id,
    })),
  };

  return (
    <div>
      <QuestionThread
        initial={serialized}
        questionUrl={siteUrl(`/q/${q.id}`)}
      />
    </div>
  );
}
