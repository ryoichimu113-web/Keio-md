import { addDays, todayKey } from "@/lib/date";
import { buildIcs } from "@/lib/icsExport";
import { allEvents, allOverrides } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/**
 * 部の予定を Apple／Google／Outlook カレンダーで購読するための配信。
 * CALENDAR_FEED_TOKEN を設定すると ?token= が必要になる。
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = process.env.CALENDAR_FEED_TOKEN;
  if (token && params.get("token") !== token) return new Response("Not found", { status: 404 });

  const today = todayKey();
  const ics = buildIcs(allEvents(), allOverrides(), {
    withDailyMeet: params.get("meet") === "1",
    from: addDays(today, -60),
    to: addDays(today, 120),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="keio-md.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
