import { PageHeader } from "@/components/PageHeader";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="サインイン" />
      <div className="space-y-4 p-4">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">部の Slack（KeioMD）のアカウントでサインインしてください。</p>
          {error && <p className="mt-2 text-sm font-bold text-keio-red">{error}</p>}
          <a
            href="/api/auth/slack"
            className="mt-4 block rounded-lg bg-keio-navy px-4 py-2.5 text-center text-sm font-bold text-white active:opacity-80"
          >
            Slackでサインイン
          </a>
        </section>
      </div>
    </>
  );
}
