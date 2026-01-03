# 並列開発手順

## 概要

4 つのマイクロサービス（user-service, post-service, social-service,
timeline-service）を並列開発するための手順。

## サービス分割と責務

### User Service

**責務**: ユーザー認証・プロフィール管理

**API エンドポイント**:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /users/{userId}`
- `PUT /users/{userId}`

**依存**: なし（他サービスを呼び出さない）

**データストア**: `mini-sns-dev-user-ddb`

**発行イベント**: `UserRegistered`, `UserProfileUpdated`

### Post Service

**責務**: 投稿の作成・削除・取得

**API エンドポイント**:

- `POST /posts`
- `GET /posts/{postId}`
- `DELETE /posts/{postId}`
- `GET /users/{userId}/posts`

**依存**: なし

**データストア**: `mini-sns-dev-post-ddb`

**発行イベント**: `PostCreated`, `PostDeleted`

### Social Service

**責務**: フォロー・いいね管理

**API エンドポイント**:

- `POST /users/{userId}/follow`
- `DELETE /users/{userId}/follow`
- `POST /posts/{postId}/likes`
- `DELETE /posts/{postId}/likes`

**依存**:

- User Service (ユーザー存在確認)
- Post Service (投稿存在確認)

**データストア**: `mini-sns-dev-social-ddb`

**発行イベント**: `FollowCreated`, `FollowDeleted`, `LikeCreated`, `LikeDeleted`

**購読イベント**: `PostDeleted`

### Timeline Service

**責務**: タイムライン生成・リアルタイム更新

**API エンドポイント**:

- `GET /timeline`
- WebSocket `/ws`

**依存**:

- Post Service (投稿詳細取得)
- User Service (ユーザー情報取得)
- Social Service (フォロー関係取得)

**データストア**: `mini-sns-dev-timeline-ddb`, Redis

**購読イベント**: `PostCreated`, `FollowCreated`, `FollowDeleted`

## 並列開発の進め方

### フェーズ 1: 独立サービス（同時開始可能）

#### User Service と Post Service

この 2 つは他サービスに依存しないため、最初に並列開発可能。

**User Service チーム**:

```bash
cd services/user-service
npm install
npm run dev
```

**Post Service チーム**:

```bash
cd services/post-service
npm install
npm run dev
```

**開発内容**:

- Cognito 連携（User Service）
- DynamoDB CRUD 実装
- 入力バリデーション（Zod）
- ユニットテスト作成
- API エンドポイント実装

**完了条件**:

- 全 API エンドポイントが動作
- ユニットテストカバレッジ 80%以上
- CI が通る

### フェーズ 2: 依存サービス

#### Social Service

User Service と Post Service が完成後に開始。

**依存解決方法**:

1. **モック使用（推奨）**: 開発初期は User/Post Service をモック化
2. **Contract Testing**: OpenAPI 仕様に基づくコントラクトテスト
3. **統合テスト**: User/Post Service の実環境で統合テスト

**開発手順**:

```bash
cd services/social-service
npm install

# モックで開発
npm run dev

# 統合テスト時
docker compose up -d
# User Service と Post Service を起動
npm run test:integration
```

### フェーズ 3: 統合サービス

#### Timeline Service

全サービスが完成後に開始。

**依存解決**:

- User Service: ユーザー情報取得
- Post Service: 投稿詳細取得
- Social Service: フォロー関係取得（間接的）

**イベント駆動開発**:

1. EventBridge イベントをサブスクライブ
2. モックイベントでテスト
3. 実サービスと統合

## コンフリクト回避戦略

### 1. ファイル分離

各サービスは完全に独立したディレクトリ：

```
services/
├── user-service/     # チーム A
├── post-service/     # チーム B
├── social-service/   # チーム C
└── timeline-service/ # チーム D
```

**ルール**: 自サービス以外のファイルを変更しない

### 2. API Contract First

OpenAPI 仕様を先に合意：

```bash
# OpenAPI 仕様を変更する場合
1. docs/mini-sns/design/openapi.yaml を更新
2. PR 作成してレビュー
3. 承認後にマージ
4. 各サービスが最新仕様に追従
```

### 3. ルート package.json の変更

**ルール**:

- サービス追加時のみ変更
- Matrix ビルド設定を更新
- PR で事前調整

**例**:

```json
{
  "scripts": {
    "dev:new-service": "npm run dev -w services/new-service"
  }
}
```

### 4. 共通設定の変更

**対象ファイル**:

- `eslint.config.js`
- `prettier.config.js`
- `tsconfig.base.json`
- `.github/workflows/ci.yml`

**ルール**:

- 変更は全チームに通知
- PR で合意形成
- 緊急でない限り、フェーズ完了後に実施

## CI/CD での並列実行

### Matrix ビルド

```yaml
strategy:
  matrix:
    service:
      - user-service
      - post-service
      - social-service
      - timeline-service
```

**効果**:

- 4 サービスが同時にビルド・テスト
- 1 サービスのエラーが他に影響しない
- 高速フィードバック

### キャッシュ共有

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**効果**:

- 全サービスで `node_modules` キャッシュ共有
- インストール時間短縮

## ローカル開発環境

### Docker Compose

```bash
# 共有インフラ起動
docker compose up -d

# 各サービスは別ターミナルで起動
# ターミナル 1
npm run dev:user-service

# ターミナル 2
npm run dev:post-service

# ターミナル 3
npm run dev:social-service

# ターミナル 4
npm run dev:timeline-service
```

### ポート割り当て

- User Service: `3001`
- Post Service: `3002`
- Social Service: `3003`
- Timeline Service: `3004`
- DynamoDB Local: `8000`
- Redis: `6379`
- LocalStack: `4566`

## コミュニケーション

### 1. API 変更の通知

OpenAPI 仕様を変更する場合：

1. GitHub Issue 作成
2. 影響を受けるサービスをメンション
3. PR レビュー依頼
4. 承認後マージ

### 2. イベント定義の追加

EventBridge イベントを追加する場合：

1. イベントスキーマを `docs/mini-sns/design/event-catalog.md` に追加
2. 関連サービスに通知
3. サブスクライバー側の実装確認

### 3. 依存関係の調整

新しいサービス間通信が必要な場合：

1. Service Interface 仕様に追加
2. モック実装を先に作成
3. 実装完了後に統合テスト

## トラブルシューティング

### マージコンフリクト

**原因**: 同じファイルを複数チームが変更

**対策**:

- `git pull --rebase` で頻繁に同期
- 共通ファイルの変更は調整

### ビルドエラー

**原因**: 依存関係の不整合

**対策**:

```bash
# 依存関係再インストール
npm ci

# キャッシュクリア
rm -rf node_modules
npm install
```

### テスト失敗

**原因**: モックの不整合

**対策**:

- OpenAPI 仕様と実装を照合
- Contract Testing で検証

## ベストプラクティス

### 1. 小さな PR

- 1 機能につき 1 PR
- 大きな変更は分割

### 2. 頻繁なマージ

- 完成を待たずに小さな単位でマージ
- フィーチャーフラグで未完成機能を隠す

### 3. モック活用

- 依存サービスは最初からモック化
- 統合テストは後回し

### 4. ドキュメント更新

- API 変更時は必ず OpenAPI 更新
- README も同時更新

## チェックリスト

### サービス開発完了条件

- [ ] 全 API エンドポイントが実装済み
- [ ] ユニットテストカバレッジ 80%以上
- [ ] OpenAPI 仕様と一致
- [ ] CI が全パス
- [ ] README が最新
- [ ] 環境変数が `.env.example` に記載
- [ ] イベント発行・購読が動作

### 統合テスト完了条件

- [ ] サービス間通信が正常
- [ ] イベント配信が正常
- [ ] エラーハンドリングが適切
- [ ] タイムアウト・リトライが動作
- [ ] ログが構造化されている

## 参考資料

- [OpenAPI 仕様](../../design/openapi.yaml)
- [サービス間インタフェース](../../design/service-interfaces.md)
- [イベントカタログ](../../design/event-catalog.md)
- [CI/CD 運用](./ci.md)
