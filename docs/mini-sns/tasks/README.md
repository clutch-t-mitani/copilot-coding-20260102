# Mini-SNS タスク一覧

このディレクトリには、Mini-SNSプロジェクトの機能実装タスクが含まれています。

## タスク生成日
2026-01-03

## タスク総数
**24タスク**（全て並列実行可能）

## サービス別タスク一覧

### User Service（ユーザー管理サービス）- 6タスク

| Task-ID | タスク名 | 説明 |
|---------|---------|------|
| USR-AUTH-001 | ユーザー登録機能 | メールアドレス・パスワードでのユーザー登録、Cognito連携 |
| USR-AUTH-002 | ログイン機能 | 認証とJWTトークン発行 |
| USR-AUTH-003 | ログアウト機能 | セッション終了とトークン無効化 |
| USR-PROF-001 | プロフィール取得機能 | ユーザープロフィール情報の取得 |
| USR-PROF-002 | プロフィール更新機能 | ユーザー名等のプロフィール更新 |
| USR-DDB-001 | DynamoDBテーブル設計 | User ServiceのDynamoDBテーブル構築 |

**主要機能**: 
- Amazon Cognito連携による認証
- JWTトークンベース認証
- プロフィール管理
- DynamoDB（email-index、username-index）

---

### Post Service（投稿管理サービス）- 6タスク

| Task-ID | タスク名 | 説明 |
|---------|---------|------|
| POST-CRE-001 | 投稿作成機能 | 280文字以内のテキスト投稿作成、XSS対策 |
| POST-GET-001 | 投稿詳細取得機能 | 投稿IDによる詳細情報取得 |
| POST-DEL-001 | 投稿削除機能 | 投稿者本人による削除、PostDeletedイベント発行 |
| POST-LIST-001 | ユーザー投稿一覧取得機能 | 特定ユーザーの投稿一覧をページネーション対応で取得 |
| POST-BATCH-001 | 投稿バッチ取得機能 | 複数投稿IDの一括取得（内部API） |
| POST-DDB-001 | DynamoDBテーブル設計 | Post ServiceのDynamoDBテーブル構築 |

**主要機能**:
- 投稿のCRUD操作
- 入力バリデーション（1-280文字、XSS対策）
- PostCreated/PostDeletedイベント発行
- DynamoDB（user-posts-index）
- 冪等性制御（Idempotency-Key）

---

### Social Service（ソーシャルグラフサービス）- 6タスク

| Task-ID | タスク名 | 説明 |
|---------|---------|------|
| SOC-FOL-001 | フォロー機能 | ユーザーフォロー、FollowCreatedイベント発行 |
| SOC-FOL-002 | アンフォロー機能 | フォロー解除、FollowDeletedイベント発行 |
| SOC-LIKE-001 | いいね付与機能 | 投稿へのいいね付与、LikeCreatedイベント発行 |
| SOC-LIKE-002 | いいね削除機能 | いいね削除、LikeDeletedイベント発行 |
| SOC-LIST-001 | フォロー・フォロワーリスト取得 | フォローリストとフォロワーリストの取得 |
| SOC-DDB-001 | DynamoDBテーブル設計 | Social ServiceのDynamoDBテーブル構築（Single Table Design） |

**主要機能**:
- フォロー/アンフォロー管理
- いいね管理
- 重複防止（UNIQUE制約相当）
- DynamoDB Single Table Design（reverse-index）
- イベント駆動アーキテクチャ

---

### Timeline Service（タイムラインサービス）- 6タスク

| Task-ID | タスク名 | 説明 |
|---------|---------|------|
| TL-GET-001 | タイムライン取得機能 | フォロー中ユーザーの投稿一覧取得、Redisキャッシング |
| TL-WS-001 | WebSocket接続機能 | WebSocket接続管理、認証、Ping/Pong |
| TL-RT-001 | リアルタイム配信機能 | 新規投稿のWebSocket経由リアルタイム配信 |
| TL-EVENT-001 | イベント購読処理 | PostCreated/FollowCreated/FollowDeletedイベント購読 |
| TL-DDB-001 | DynamoDBテーブル設計 | Timeline ServiceのDynamoDBテーブル構築（TTL=30日） |
| TL-REDIS-001 | Redisキャッシュ設計 | ElastiCache Redis構築、キャッシング戦略 |

**主要機能**:
- タイムライン生成・取得
- WebSocketによるリアルタイム更新（3秒以内）
- Redisキャッシング（TTL=60秒）
- EventBridge + SQS購読
- DynamoDB（TTL自動削除）
- WebSocket接続管理（Redis、TTL=10分）

---

## 並列実行可能性

### なぜ全タスクが並列実行可能か

1. **サービス境界の明確化**
   - 各タスクは独立したマイクロサービスに属する
   - サービス間の依存は公開APIまたはイベント経由のみ
   - 他サービスのコード変更を必要としない

2. **契約ファーストアプローチ**
   - 全タスクは事前定義された契約（docs/mini-sns/solutions/*/）に基づく
   - API仕様、イベントスキーマが明確に定義済み
   - モック・スタブを使用した統合テストが可能

3. **インフラとアプリの分離**
   - DynamoDBテーブル作成タスク（*-DDB-001）はアプリケーションコードと独立
   - Terraform定義のみで実行可能
   - アプリケーション実装時はローカルDynamoDBやモックで代替可能

4. **イベント駆動の疎結合**
   - EventBridgeによる非同期通信
   - 発行側と購読側が独立して実装可能
   - イベントスキーマが事前定義済み

5. **依存の排除設計**
   - フォロー機能実装にいいね機能の完了は不要
   - タイムライン取得実装に投稿作成の完了は不要（モックで代替）
   - 各タスクは単体で開始→完了可能

### タスク実行の推奨順序（並列実行時の効率化）

**Phase 1: インフラストラクチャ**（並列実行）
- USR-DDB-001, POST-DDB-001, SOC-DDB-001, TL-DDB-001, TL-REDIS-001

**Phase 2: コア機能**（並列実行）
- User Service: USR-AUTH-001, USR-AUTH-002, USR-PROF-001
- Post Service: POST-CRE-001, POST-GET-001, POST-DEL-001
- Social Service: SOC-FOL-001, SOC-LIKE-001
- Timeline Service: TL-WS-001, TL-EVENT-001

**Phase 3: 拡張機能**（並列実行）
- User Service: USR-AUTH-003, USR-PROF-002
- Post Service: POST-LIST-001, POST-BATCH-001
- Social Service: SOC-FOL-002, SOC-LIKE-002, SOC-LIST-001
- Timeline Service: TL-GET-001, TL-RT-001

※ただし、上記はあくまで推奨であり、**全フェーズを完全に並列実行することも可能**です。

---

## タスクフォーマット

全タスクは以下の統一フォーマットで記述されています：

### メタ情報
- **Task-ID**: 一意のタスクID（例: USR-AUTH-001）
- **Service**: 所属サービス名（user-service, post-service, social-service, timeline-service）
- **Category**: feature（全て実装タスク）
- **Labels**: implementation, autogen
- **Assignees**: 空（アサイン時に設定）
- **DesignRefs**: 参照設計ドキュメント

### 本文構成
1. **Purpose**: タスクの目的
2. **Scope**: 含まれる範囲・含まれない範囲
3. **Contracts**: 入力・出力・イベントの仕様
4. **Steps**: 実装ステップ（Scaffold→API&Data→Business Logic→UI→Tests）
5. **Acceptance Criteria**: Gherkin形式の受け入れ基準（3-5件）
6. **Risks**: リスクと対策
7. **DoD (Definition of Done)**: 完了条件

---

## 非機能要件（全タスク共通）

### パフォーマンス
- **API応答時間**: p95 ≤ 500ms（POST/PUT）、≤ 200ms（GET）
- **リアルタイム更新遅延**: ≤ 3秒
- **WebSocket配信遅延**: ≤ 3秒

### 品質
- **単体テストカバレッジ**: ≥ 80%
- **統合テスト**: 全てパス必須
- **コードレビュー**: 100%実施
- **セキュリティスキャン**: Critical/High脆弱性ゼロ

### セキュリティ
- **認証**: Cognito + JWTトークン
- **認可**: Lambda関数内でトークン検証
- **XSS対策**: HTMLエスケープ実施率100%
- **レート制限**: API Gateway設定必須

### 監視
- **CloudWatchアラーム**: エラー率、レイテンシ、DLQメッセージ数
- **分散トレーシング**: AWS X-Ray有効化
- **構造化ログ**: JSON形式、CloudWatch Logs

---

## 注意事項

### lockfile更新の禁止
- `package-lock.json`、`yarn.lock`、`pnpm-lock.yaml`の更新は行わない
- 依存関係の追加・更新が必要な場合は、別Issue/PRで個別に対応

### 変更範囲の最小化
- 各タスクは担当機能のみを実装
- 他サービスとのコンフリクトを避けるため、変更範囲を最小化
- 共有ライブラリ・共有モデルは使用しない

### 曖昧語の禁止
- 「高速」→「p95=200ms以下」のように具体的な数値で定義
- 「安定」→「稼働率99.9%以上」のように測定可能な指標で定義

---

## 参照ドキュメント

- [要件定義書](../requirements.md)
- [システムアーキテクチャ](../design/system-architecture.md)
- [User Service設計](../solutions/user-service/)
- [Post Service設計](../solutions/post-service/)
- [Social Service設計](../solutions/social-service/)
- [Timeline Service設計](../solutions/timeline-service/)

---

## 更新履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|-----------|---------|--------|
| 2026-01-03 | 1.0.0 | 初版作成（24タスク生成） | GitHub Copilot |

---

## まとめ

Mini-SNSプロジェクトの全機能を**24の独立したタスク**に分割しました。各タスクは：

✅ **完全に並列実行可能**（依存関係なし）  
✅ **明確な契約定義**（API仕様、イベントスキーマ）  
✅ **具体的な受け入れ基準**（Gherkin形式、3-5件）  
✅ **測定可能なDoD**（テストカバレッジ、応答時間、セキュリティ）  
✅ **日本語で記述**（要件どおり）

これらのタスクを複数の開発者が並列に実行することで、効率的にMini-SNSプロジェクトを実装できます。
