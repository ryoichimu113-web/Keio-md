/** Slack に投稿する（未接続ならサーバー側で何もしない） */
export function postToSlack(text: string) {
  fetch("/api/slack", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {});
}
