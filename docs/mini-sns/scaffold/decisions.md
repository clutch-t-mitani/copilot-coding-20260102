# アーキテクチャ決定記録（ADR）

## ADR-001: TypeScript とNode.js 20 の採用

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- 設計ドキュメント（`docs/mini-sns/design/system-architecture.md`）でサーバーレス
  アーキテクチャが定義されている
- AWS Lambda を使用するため、Node.js ランタイムが最適
- 型安全性とメンテナンス性が求められる

**決定**:

- TypeScript 5.3+ を採用
- Node.js 20 LTS を使用
- strict モード有効化

**理由**:

1. AWS Lambda で Node.js 20 がサポートされている
2. TypeScript による型安全性で開発効率向上
3. OpenAPI から型定義を自動生成可能
4. チーム全員が TypeScript に習熟している

**影響**:

- すべてのサービスで TypeScript を使用
- ビルドステップが必要
- 型定義ファイルのメンテナンスが必要

**参照**:

- `docs/mini-sns/design/system-architecture.md`
- `docs/mini-sns/design/nonfunctional.md`

---

## ADR-002: npm workspaces によるモノレポ管理

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- 4 つの独立したマイクロサービスを管理
- サービス間で共通ライブラリや設定を共有したい
- CI/CD で効率的にビルド・テストしたい

**決定**:

- npm workspaces を採用
- ルート `package.json` で全サービスを管理
- 各サービスは `@mini-sns/<service-name>` の命名規則

**理由**:

1. npm 標準機能で追加ツール不要
2. 依存関係の重複解決が自動化
3. `npm run <script> --workspaces` で全サービス一括実行可能
4. シンプルで学習コスト低い

**代替案**:

- pnpm workspaces: より高速だが、チームに導入コストあり
- Lerna: オーバースペックで不要
- Nx: 大規模プロジェクト向けで本プロジェクトには過剰

**影響**:

- ルート `node_modules` に依存関係が集約
- CI で `npm ci` 1 回で全依存関係インストール可能
- サービス間の依存は推奨しない（疎結合維持）

**参照**:

- `package.json`
- `docs/mini-sns/design/system-architecture.md` (マイクロサービス設計)

---

## ADR-003: ESLint + Prettier + commitlint の導入

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- 非機能要件
  （`docs/mini-sns/design/nonfunctional.md`）でコード品質が定義されている
- コードレビュー実施率 100%、循環的複雑度 ≤ 10 が求められる
- チームでコードスタイルを統一したい

**決定**:

- ESLint 8+ (Flat Config)
- Prettier 3+
- commitlint (Conventional Commits)
- husky による Git フック

**理由**:

1. 非機能要件（MA-01, MA-04）を満たすため
2. 自動フォーマットで差分ノイズ削減
3. Conventional Commits で変更履歴が明確化
4. CI で自動チェック可能

**影響**:

- コミット前に自動リント・フォーマット
- CI でフォーマットチェック実行
- コミットメッセージ規約違反は CI で検出

**参照**:

- `docs/mini-sns/design/nonfunctional.md` (MA-01, MA-04)
- `eslint.config.js`
- `prettier.config.js`
- `commitlint.config.js`

---

## ADR-004: Docker Compose によるローカル開発環境

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- DynamoDB, Redis, EventBridge などの AWS サービスが必要
- ローカルでサービス間連携をテストしたい
- 開発環境セットアップを簡易化したい

**決定**:

- DynamoDB Local
- Redis (公式 Docker イメージ)
- LocalStack（AWS サービスエミュレーション）

**理由**:

1. ローカルで AWS サービスをエミュレート可能
2. 外部サービス依存なしで開発可能
3. CI でも同じ環境を再現可能
4. クラウドコスト削減

**影響**:

- Docker Desktop が必須
- LocalStack は完全な AWS 互換ではない（制限あり）
- 本番環境との差異に注意

**参照**:

- `compose.yaml`
- `.env.example`
- `docs/mini-sns/scaffold/compose.md`

---

## ADR-005: Terraform による IaC 管理

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- Terraform 設計（`docs/mini-sns/design/terraform.md`）が存在
- インフラを宣言的に管理したい
- 環境（dev/stg/prod）ごとに設定を分離したい

**決定**:

- Terraform 1.5+
- AWS プロバイダー 5.0+
- 環境別ディレクトリ構成（`infra/terraform/envs/{dev,stg,prod}`）
- モジュール化（`infra/terraform/modules/`）

**理由**:

1. 設計ドキュメントで Terraform が指定されている
2. AWS インフラの標準的な IaC ツール
3. 環境差分を明示的に管理可能
4. CI で plan/apply を自動化可能

**影響**:

- Terraform 学習が必要
- State 管理（S3 + DynamoDB）が必要
- モジュール開発は並列実装後に実施

**参照**:

- `docs/mini-sns/design/terraform.md`
- `infra/terraform/envs/dev/`

---

## ADR-006: GitHub Actions による CI/CD

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- GitHub でリポジトリ管理
- 自動ビルド・テスト・デプロイが必要
- サービスごとに並列実行したい

**決定**:

- GitHub Actions
- Matrix ビルド（4 サービス並列実行）
- Terraform fmt/validate の自動チェック
- commitlint によるコミットメッセージ検証

**理由**:

1. GitHub との統合が最もシンプル
2. Matrix ビルドで並列実行可能
3. Actions Marketplace で豊富なアクション利用可能
4. 無料枠で十分

**影響**:

- `.github/workflows/ci.yml` で CI 定義
- サービス追加時は Matrix に追加必要
- Secrets 管理が必要（AWS 認証情報など）

**参照**:

- `.github/workflows/ci.yml`
- `docs/mini-sns/scaffold/ci.md`

---

## ADR-007: Renovate による依存関係自動更新

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- 依存関係の脆弱性を早期検出したい
- 手動更新の負担を軽減したい
- セキュリティパッチを迅速に適用したい

**決定**:

- Renovate Bot
- グループ化（AWS SDK, ESLint, Jest など）
- 自動マージ（minor/patch のみ）
- 脆弱性アラートは即座に自動マージ

**理由**:

1. GitHub との統合が容易
2. 柔軟な設定が可能
3. 依存関係ダッシュボードで可視化
4. セキュリティ要件（SE-*）を満たすため

**影響**:

- PR が自動生成される
- major バージョンアップは手動レビュー必要
- 週次スケジュールで実行

**参照**:

- `renovate.json`
- `docs/mini-sns/design/nonfunctional.md` (セキュリティ要件)

---

## ADR-008: DevContainer による標準開発環境

**日付**: 2026-01-03

**ステータス**: 承認

**コンテキスト**:

- チームメンバー間で開発環境を統一したい
- セットアップ時間を短縮したい
- IDE 設定を標準化したい

**決定**:

- DevContainer (VS Code)
- Node.js 20, Terraform, AWS CLI, GitHub CLI を含む
- VS Code 拡張機能を自動インストール

**理由**:

1. 環境差分を排除
2. 新メンバーのオンボーディング時間短縮
3. VS Code との統合
4. Docker ベースで軽量

**影響**:

- Docker Desktop が必須
- VS Code 以外の IDE ユーザーは手動セットアップ
- コンテナビルド時間が初回のみ発生

**参照**:

- `.devcontainer/devcontainer.json`
- `.devcontainer/Dockerfile`

---

## まとめ

これらの決定により、以下を達成：

1. **並列開発可能**: 各サービスが独立してビルド・テスト可能
2. **高品質**: 自動リント・テスト・型チェック
3. **効率的**: CI/CD 自動化、依存関係自動更新
4. **標準化**: 統一された開発環境とコード規約
