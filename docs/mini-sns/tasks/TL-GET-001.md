# [Implement] タイムライン取得機能

Task-ID: TL-GET-001  
Service: timeline-service  
Category: feature  
Labels: implementation, autogen  
Assignees:   
DesignRefs: docs/mini-sns/requirements.md, docs/mini-sns/solutions/timeline-service/**/*.md

## Purpose

ログイン済みユーザーがフォローしているユーザーの投稿一覧（タイムライン）を取得する機能を実装する。

## Scope

### 含まれる範囲
- GET /timeline エンドポイントの実装
- DynamoDBからのタイムラインエントリ取得
- Redisキャッシング（TTL=60秒）
- Post Service API呼び出し（投稿詳細取得）
- User Service API呼び出し（著者情報取得）
- ページネーション対応（limit, offset）
- 認証必須の実装

### 含まれない範囲（Non-Scope）
- リアルタイム配信（TL-RT-001で実装）
- タイムライン生成（TL-EVENT-001で実装）
- DynamoDBテーブル作成（TL-DDB-001で実装）

## Contracts

### 入力
- **HTTPリクエスト**: GET /timeline?limit=20&offset=0
- **ヘッダー**: Authorization: Bearer {token}
- **クエリパラメータ**:
  - limit: 取得件数（デフォルト20、最大100）
  - offset: オフセット（デフォルト0）

### 出力
- **成功時（200 OK）**:
```json
{
  "posts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "content": "投稿内容",
      "author": {
        "id": "uuid",
        "username": "testuser"
      },
      "likes_count": 5,
      "is_liked": false,
      "created_at": "2026-01-03T00:00:00Z"
    }
  ],
  "total": 100
}
```

## Steps

### 1. Scaffold
- [ ] Lambda関数ディレクトリ構成の作成
- [ ] 必要な依存関係の定義（Redis SDK）

### 2. API & Data
- [ ] API Gatewayルート定義
- [ ] Lambda関数エントリーポイントの作成
- [ ] DynamoDBクライアント初期化
- [ ] Redisクライアント初期化

### 3. Business Logic
- [ ] タイムライン取得ビジネスロジック実装
  - JWTトークンからユーザーID抽出
  - Redisキャッシュ確認（キー: `timeline:{userId}:{offset}:{limit}`）
  - キャッシュミス時: DynamoDBクエリ（PK: USER#{userId}, SK: POST#{createdAt}#{postId}）
  - 投稿IDリスト抽出
  - Post Service API呼び出し（POST /posts/batch）
  - User Service API呼び出し（著者情報、並列処理）
  - レスポンス組み立て
  - Redisキャッシュ保存（TTL=60秒）
- [ ] エラーハンドリング
  - Post/User Service障害時のフォールバック
  - Redis障害時のDynamoDBダイレクト取得
- [ ] ページネーション処理

### 4. UI
- [ ] 該当なし

### 5. Tests
- [ ] 単体テスト
  - 正常系: タイムライン取得成功
  - 正常系: Redisキャッシュヒット確認
  - 境界値: フォローユーザーが0件の場合
  - 異常系: Post Service障害時のフォールバック
- [ ] 統合テスト
  - E2E: タイムライン取得から全データ返却まで
  - E2E: Post/User Service統合確認

## Acceptance Criteria

### AC-1: 正常系 - タイムライン取得
```gherkin
Given ユーザーAがユーザーBとCをフォローしている
And ユーザーBとCが投稿を作成済みである
When ユーザーAがタイムラインを取得する
Then HTTPステータス200が返される
And ユーザーBとCの投稿が時系列順に返される
And 応答時間がp95で500ミリ秒以内である
```

### AC-2: 境界値 - フォローが0件
```gherkin
Given ユーザーAが誰もフォローしていない
When タイムラインを取得する
Then HTTPステータス200が返される
And 空の配列が返される
```

### AC-3: パフォーマンス - Redisキャッシュ
```gherkin
Given 同じタイムラインが60秒以内に2回取得される
When 2回目の取得を行う
Then Redisキャッシュからデータが返される
And 応答時間が100ミリ秒以内である
And Post/User Service APIは呼び出されない
```

### AC-4: 異常系 - Post Service障害
```gherkin
Given Post Serviceがダウンしている
When タイムラインを取得しようとする
Then HTTPステータス503が返される
Or フォールバック応答が返される（投稿IDのみ）
```

### AC-5: ページネーション
```gherkin
Given タイムラインに100件の投稿が存在する
When limit=20&offset=20で取得する
Then 21-40件目の投稿が返される
```

## Risks

- **R-1**: Post/User Service障害時のタイムライン取得失敗
  - 対策: タイムアウト3秒、リトライ3回、サーキットブレーカー
- **R-2**: Redis障害時のパフォーマンス劣化
  - 対策: フォールバック（DynamoDBダイレクト取得）、アラート設定
- **R-3**: 大量フォロー時のクエリ遅延
  - 対策: limit上限100件、キャッシング

## DoD (Definition of Done)

- [ ] コードがリポジトリにプッシュされている
- [ ] 単体テストカバレッジが80%以上
- [ ] 統合テストが全てパスしている
- [ ] API応答時間がp95で500ミリ秒以内
- [ ] Redisキャッシュヒット率が70%以上（本番運用後）
- [ ] コードレビュー完了
- [ ] セキュリティスキャン（CodeQL）でCritical/High脆弱性がゼロ
- [ ] CloudWatchアラーム設定が完了している（エラー率 > 1%）
