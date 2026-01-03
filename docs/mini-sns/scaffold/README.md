# Mini-SNS 共通基盤スカフォールド

## 目的

Mini-SNS プロジェクトの共通基盤として、4 つのマイクロサービス（user-service,
post-service, social-service, timeline-service）の並列開発を可能にするスカフォールド
を提供します。

## 適用範囲

- **対象プロジェクト**: mini-sns
- **サービス数**: 4（独立したマイクロサービス）
- **技術スタック**: TypeScript, Node.js 20, AWS Serverless
- **インフラ**: AWS Lambda, DynamoDB, API Gateway, EventBridge, ElastiCache Redis

## 採用技術

### フロントエンド（今回対象外）

- 将来的に React/Next.js を想定

### バックエンド

- **言語**: TypeScript 5.3+
- **ランタイム**: Node.js 20
- **フレームワーク**: AWS Lambda
- **API**: REST API (OpenAPI 3.0)
- **データベース**: DynamoDB
- **キャッシュ**: ElastiCache Redis
- **認証**: Amazon Cognito
- **イベントバス**: EventBridge
- **リアルタイム**: API Gateway WebSocket

### 開発ツール

- **パッケージマネージャー**: npm (workspaces)
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **コミット規約**: commitlint (Conventional Commits)
- **Git フック**: husky
- **テスト**: Jest
- **型定義**: OpenAPI から自動生成（openapi-typescript）
- **CI/CD**: GitHub Actions
- **依存関係更新**: Renovate
- **開発環境**: DevContainer
- **ローカル開発**: Docker Compose (DynamoDB Local, Redis, LocalStack)
- **IaC**: Terraform 1.5+

## ディレクトリ構成

```
mini-sns/
├── .devcontainer/           # DevContainer設定
│   ├── devcontainer.json
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CDワークフロー
├── docs/
│   └── mini-sns/
│       ├── design/          # 設計ドキュメント（既存）
│       ├── solutions/       # サービス別詳細設計（既存）
│       └── scaffold/        # スカフォールドドキュメント（本ディレクトリ）
├── infra/
│   └── terraform/
│       ├── envs/            # 環境別設定
│       │   ├── dev/
│       │   ├── stg/
│       │   └── prod/
│       └── modules/         # Terraformモジュール（今後追加）
├── scripts/                 # ユーティリティスクリプト
│   ├── validate-openapi.js
│   └── generate-openapi-types.js
├── services/                # マイクロサービス
│   ├── user-service/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   └── README.md
│   ├── post-service/
│   ├── social-service/
│   └── timeline-service/
├── .editorconfig            # エディタ設定
├── .gitattributes           # Git属性
├── .gitignore               # Git除外設定
├── .nvmrc                   # Node.jsバージョン指定
├── compose.yaml             # Docker Compose（開発環境）
├── .env.example             # 環境変数テンプレート
├── commitlint.config.js     # コミットメッセージ規約
├── eslint.config.js         # ESLint設定
├── prettier.config.js       # Prettier設定
├── renovate.json            # Renovate設定
├── package.json             # ルートpackage.json（workspaces）
├── tsconfig.base.json       # TypeScript共通設定
└── README.md
```

## セットアップ手順

### 1. 前提条件

- Node.js 20 以上
- npm 10 以上
- Docker Desktop
- Git

### 2. リポジトリクローン

```bash
git clone https://github.com/clutch-t-mitani/copilot-coding-20260102.git
cd copilot-coding-20260102
```

### 3. 依存関係インストール

```bash
# ルートと全サービスの依存関係をインストール
npm install

# Huskyのセットアップ
npm run prepare
```

### 4. ローカル開発環境起動

```bash
# DynamoDB Local, Redis, LocalStackを起動
docker compose up -d

# 環境変数設定
cp .env.example .env
# .envを編集して必要な値を設定

# サービス起動（例: user-service）
npm run dev:user-service
```

### 5. ビルド・テスト

```bash
# 全サービスビルド
npm run build

# 全サービステスト
npm run test

# 特定サービスのみ
npm run build:user-service
npm run test:user-service
```

### 6. リンティング・フォーマット

```bash
# リント
npm run lint

# 自動修正
npm run lint:fix

# フォーマット
npm run format

# フォーマットチェック（CI用）
npm run format:check
```

### 7. 型チェック

```bash
npm run typecheck
```

## 並列開発の進め方

各サービスは独立して開発可能です。詳細は
[parallel-development.md](./parallel-development.md) を参照してください。

## 参照ドキュメント

- [設計判断（ADR）](./decisions.md)
- [CI/CD 運用](./ci.md)
- [Docker Compose 運用](./compose.md)
- [Terraform 運用](./terraform.md)
- [並列開発手順](./parallel-development.md)

## 更新履歴

- 2026-01-03: 初版作成
