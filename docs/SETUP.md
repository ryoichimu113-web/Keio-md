# 公開と Slack 連携のしかた

## 1. Vercel で公開する

1. https://vercel.com に GitHub アカウントでサインイン
2. 「Add New…」→「Project」→ `keio-md` リポジトリの「Import」
3. そのまま「Deploy」を押す（設定は自動で Next.js になります）
4. 数分で `https://keio-md-xxxx.vercel.app` のような URL ができます。以後、GitHub に push するたびに自動で更新されます

この時点では Slack とはつながっていないので、部の予定（`data/schedule.ts`）と練習記録だけが使えます。

## 2. Slack アプリを作る

1. https://api.slack.com/apps →「Create New App」→「From an app manifest」→ ワークスペース「KeioMD」を選ぶ
2. `docs/slack-app-manifest.yml` の中身を貼り付ける（`<アプリのURL>` は 1. でできた URL のドメインに置き換える）
3. 「Install to Workspace」でインストール（ワークスペースの管理者の承認が必要な場合があります）
4. Slack で `#01_メニュー設定` と `#01_集合欠` に `/invite @中距離ブロック` と入力してアプリを招待する

## 3. Vercel に環境変数を設定する

Vercel のプロジェクト →「Settings」→「Environment Variables」に、`.env.example` の項目を入れます。

| 名前 | どこで見るか |
| --- | --- |
| `SLACK_BOT_TOKEN` | Slack アプリの「OAuth & Permissions」→ Bot User OAuth Token（`xoxb-` で始まる） |
| `SLACK_MENU_CHANNEL_ID` | `C01B6MF6TT6`（#01_メニュー設定） |
| `SLACK_ABSENCE_CHANNEL_ID` | `C01B0MWR10T`（#01_集合欠） |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | Slack アプリの「Basic Information」→ App Credentials |
| `SLACK_TEAM_ID` | ブラウザで Slack を開いたときの URL `app.slack.com/client/T……/` の `T……` |
| `SESSION_SECRET` | 32文字以上のランダムな文字列 |
| `SLACK_ADMIN_IDS` | 管理者の Slack ユーザーID（プロフィール →「︙」→「メンバーIDをコピー」）をカンマ区切り |
| `SLACK_EDITOR_IDS` | 予定を追加できる人のユーザーID |

保存したら「Deployments」から最新のものを「Redeploy」します。

`SLACK_CLIENT_ID` を入れると、Slack でサインインした部員だけがアプリを開けるようになります。
部員の実名や集合欠の理由（通院など）を外に出さないため、**Slack を連携するときはサインインも必ず設定してください**
（サインインなしでは、本番環境では部員の情報を返しません）。

## 部の予定を更新する

`data/schedule.ts` に予定を書き足して push すると、全員のアプリとカレンダー配信に反映されます。
GitHub の画面上で直接編集しても構いません。アプリの「予定を追加」で入れた予定は、その端末にだけ保存されます。

## Slack から読み込む内容

- **部員**：`SLACK_MEMBER_CHANNEL_ID` のチャンネルのメンバー。未設定なら、直近にメニューか集合欠を投稿した人
- **練習メニュー**：`#01_メニュー設定` の「10/25（日）【wttk】」のような日付の投稿と、そのスレッドへの各自の返信
- **集合欠**：`#01_集合欠` の投稿から日付（「10/24、10/25」「10/30, 31」「明日」など）を読み取る。取り消しは「取り消し」と書いた投稿で
- アプリの「Slackで連絡」から送った集合欠は、アプリが `#01_集合欠` に投稿します
