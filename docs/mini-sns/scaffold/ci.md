# CI/CD 運用ガイド

## 概要

GitHub Actions を使用した継続的インテグレーション・デプロイメントの運用手順。

## CI ワークフロー構成

### トリガー条件

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
```

- `main`, `develop` へのプッシュ
- `main`, `develop` への PR
- 手動実行（`workflow_dispatch`）

### ジョブ構成

#### 1. Lint ジョブ

```bash
npm run lint
npm run format:check
```

**目的**: コードスタイルと品質チェック

**実行時間**: 約 1-2 分

#### 2. Type Check ジョブ

```bash
npm run typecheck
```

**目的**: TypeScript 型エラー検出

**実行時間**: 約 1-2 分

#### 3. Build ジョブ（Matrix）

```bash
npm run build:user-service
npm run build:post-service
npm run build:social-service
npm run build:timeline-service
```

**目的**: 各サービスのビルド検証

**並列実行**: 4 サービス同時

**実行時間**: 約 2-3 分（並列）

#### 4. Test ジョブ（Matrix）

```bash
npm run test:user-service
npm run test:post-service
npm run test:social-service
npm run test:timeline-service
```

**目的**: ユニットテスト実行とカバレッジ測定

**並列実行**: 4 サービス同時

**カバレッジ**: Codecov にアップロード

**実行時間**: 約 3-5 分（並列）

#### 5. OpenAPI ジョブ

```bash
npm run openapi:validate
npm run openapi:generate
```

**目的**: OpenAPI 仕様検証と型生成

**実行時間**: 約 1 分

#### 6. Terraform ジョブ

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

**目的**: Terraform 設定の検証

**条件**: PR のみ

**実行時間**: 約 1-2 分

#### 7. Commitlint ジョブ

```bash
npx commitlint --from <base> --to <head>
```

**目的**: コミットメッセージ規約チェック

**条件**: PR のみ

**実行時間**: 約 30 秒

## キャッシュ戦略

### npm キャッシュ

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
```

**効果**: 依存関係インストール時間を短縮（約 2-3 分 → 30 秒）

### Terraform キャッシュ

Terraform プロバイダーは自動キャッシュされる。

## エラー対応

### ビルドエラー

```bash
# ローカルで再現
npm run build:user-service

# ログ確認
cat services/user-service/dist/...
```

### テストエラー

```bash
# ローカルで再現
npm run test:user-service

# カバレッジ確認
npm run test:coverage
open services/user-service/coverage/index.html
```

### リントエラー

```bash
# 自動修正
npm run lint:fix

# 手動修正後
npm run lint
```

### Terraform エラー

```bash
cd infra/terraform/envs/dev
terraform fmt
terraform validate
```

## Matrix ビルドの追加

新しいサービスを追加する場合：

1. `services/<new-service>/` を作成
2. ルート `package.json` にスクリプト追加：

```json
{
  "scripts": {
    "dev:new-service": "npm run dev -w services/new-service",
    "build:new-service": "npm run build -w services/new-service",
    "test:new-service": "npm run test -w services/new-service"
  }
}
```

3. `.github/workflows/ci.yml` の Matrix に追加：

```yaml
strategy:
  matrix:
    service:
      - user-service
      - post-service
      - social-service
      - timeline-service
      - new-service # 追加
```

## Secrets 設定

GitHub リポジトリの Settings > Secrets で以下を設定：

### AWS デプロイ用（本番運用時）

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### Codecov（カバレッジレポート）

- `CODECOV_TOKEN`

## ステータスバッジ

README にステータスバッジを追加：

```markdown
![CI](https://github.com/clutch-t-mitani/copilot-coding-20260102/workflows/CI/badge.svg)
```

## トラブルシューティング

### CI が遅い

- キャッシュが効いているか確認
- Matrix 並列度を確認
- 不要なステップを削除

### ランダムテスト失敗

- テストの依存関係を確認
- タイムアウト設定を調整
- モックの状態をリセット

### Dependabot / Renovate との競合

- Renovate を優先（自動マージ設定あり）
- Dependabot は無効化推奨

## 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Codecov](https://codecov.io/)
