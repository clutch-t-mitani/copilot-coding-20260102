# Mini-SNS 要件定義書

## 1. 背景・目的

現代において、ソーシャルメディアは人々のコミュニケーション手段として欠かせない存在となっている。本プロジェクトでは、ユーザーが投稿を共有し、他のユーザーをフォローし、投稿に対して「いいね」を付与できる簡易的なSNS(ソーシャルネットワーキングサービス)のWebアプリケーションを構築する。リアルタイム性を重視し、タイムラインの更新が即座に反映されることで、ユーザー間のスムーズな情報共有と交流を実現する。これにより、小規模なコミュニティやチームでの情報共有基盤として活用可能なプラットフォームを提供することを目的とする。

## 2. スコープ / 非スコープ

### スコープ(実装対象)
- ユーザー登録・ログイン機能
- 投稿(ポスト)の作成、表示、削除機能
- 他ユーザーのフォロー/アンフォロー機能
- 投稿への「いいね」/「いいね解除」機能
- タイムライン(フォローユーザーの投稿一覧)のリアルタイム更新
- ユーザープロフィール表示(投稿一覧、フォロワー数、フォロー数)
- 基本的なレスポンシブデザイン(スマートフォン対応)

### 非スコープ(実装対象外)
- ダイレクトメッセージ(DM)機能
- グループチャット・ルーム機能
- 動画・画像のアップロード機能(テキスト投稿のみ)
- 広告配信システム
- コメント・リプライ機能(本バージョンでは除外)
- 通知機能(プッシュ通知、メール通知)
- 詳細な権限管理(管理者/一般ユーザーの区別なし)
- 多言語対応(日本語のみ)

## 3. ステークホルダー & 主要ユースケース

### ステークホルダー
- **エンドユーザー**: SNSを利用して情報発信・情報収集を行う一般ユーザー
- **開発チーム**: システムの設計・開発・運用を担当
- **プロダクトオーナー**: 機能要件の優先順位決定と成功指標の管理を担当

### 主要ユースケース
1. **新規ユーザー登録**: ユーザーがアカウントを作成し、サービスを利用開始する
2. **投稿作成**: ユーザーが短文テキストを投稿し、フォロワーに共有する
3. **他ユーザーフォロー**: 興味のあるユーザーをフォローし、その投稿をタイムラインで閲覧する
4. **いいね操作**: 気に入った投稿に「いいね」を付けて反応を示す
5. **タイムライン閲覧**: フォローしているユーザーの最新投稿をリアルタイムで確認する

## 4. 機能要件(EARS形式)

### Ubiquitous(常時動作)
1. **FR-U01**: システムは、ユーザーがログイン状態である限り、タイムラインを3秒以内に更新し続けなければならない
2. **FR-U02**: システムは、すべてのHTTPSリクエストに対して500ミリ秒以内(p95)に初期レスポンスを返さなければならない
3. **FR-U03**: システムは、すべてのユーザー入力に対してXSS攻撃を防ぐためのサニタイゼーション処理を実行しなければならない

### State-driven(状態駆動)
4. **FR-S01**: ユーザーが未ログイン状態である場合、システムはログイン画面を表示し、タイムライン画面へのアクセスをブロックしなければならない
5. **FR-S02**: ユーザーが投稿に「いいね」を付与している状態である場合、システムは「いいね」ボタンを押下済み表示(ハイライト)に変更しなければならない
6. **FR-S03**: ユーザーが他ユーザーをフォロー中である場合、システムはそのユーザーの投稿をタイムラインに表示しなければならない

### Event-driven(イベント駆動)
7. **FR-E01**: ユーザーが投稿ボタンをクリックした時、システムは投稿内容を検証し(1文字以上280文字以内)、検証成功時には投稿を保存し、失敗時にはエラーメッセージを表示しなければならない
8. **FR-E02**: 他のユーザーが新規投稿を作成した時、システムは当該ユーザーをフォローしている全ユーザーのタイムラインに対し、3秒以内に新規投稿を配信しなければならない
9. **FR-E03**: ユーザーがフォローボタンをクリックした時、システムはフォロー関係を即座にデータベースに保存し、1秒以内にUIを更新しなければならない
10. **FR-E04**: データベース接続エラーが発生した時、システムはユーザーに対してエラーメッセージを表示し、操作を3回まで自動リトライしなければならない

## 5. ユーザーストーリー(INVEST)

### US-01: ユーザー登録機能(Must Have)
**As a** 新規ユーザー  
**I want to** メールアドレスとパスワードでアカウント登録  
**So that** サービスを利用開始できる

### US-02: ログイン・ログアウト機能(Must Have)
**As a** 登録済みユーザー  
**I want to** メールアドレスとパスワードでログイン/ログアウト  
**So that** 自分のアカウントで安全にサービスを利用できる

### US-03: 投稿作成機能(Must Have)
**As a** ログイン済みユーザー  
**I want to** 280文字以内のテキストを投稿  
**So that** 自分の考えや情報をフォロワーに共有できる

### US-04: タイムライン表示機能(Must Have)
**As a** ログイン済みユーザー  
**I want to** フォローしているユーザーの投稿一覧をリアルタイムで閲覧  
**So that** 最新の情報をタイムリーに入手できる

### US-05: フォロー・アンフォロー機能(Must Have)
**As a** ログイン済みユーザー  
**I want to** 他のユーザーをフォロー/アンフォロー  
**So that** 興味のあるユーザーの投稿だけをタイムラインに表示できる

### US-06: いいね機能(Should Have)
**As a** ログイン済みユーザー  
**I want to** 投稿に「いいね」を付与/削除  
**So that** 共感や好意を表現できる

### US-07: プロフィール表示機能(Should Have)
**As a** ログイン済みユーザー  
**I want to** 自分および他ユーザーのプロフィール(投稿一覧、フォロワー数、フォロー数)を閲覧  
**So that** ユーザーの活動状況や人気度を把握できる

### US-08: 投稿削除機能(Could Have)
**As a** ログイン済みユーザー  
**I want to** 自分の投稿を削除  
**So that** 誤投稿や不要な投稿を取り除ける

### US-09: レスポンシブデザイン(Should Have)
**As a** スマートフォンユーザー  
**I want to** モバイルデバイスでも快適に閲覧・操作  
**So that** いつでもどこでもサービスを利用できる

### US-10: エラーハンドリング(Must Have)
**As a** システムユーザー  
**I want to** エラー発生時に明確なメッセージとリカバリー手段  
**So that** 問題を理解し、適切に対処できる

## 6. 受け入れ基準(Gherkin形式)

### US-01: ユーザー登録機能
**AC-01-01: 正常系 - 有効な情報での登録**
```gherkin
Given ユーザーが未登録である
When メールアドレス "user@example.com"、パスワード "SecurePass123!"、ユーザー名 "testuser" を入力して登録ボタンをクリックする
Then アカウントが作成され、ホーム画面にリダイレクトされる
And 登録完了メッセージが表示される
```

**AC-01-02: 異常系 - 重複メールアドレス**
```gherkin
Given メールアドレス "existing@example.com" が既に登録されている
When 同じメールアドレスで新規登録を試みる
Then エラーメッセージ "このメールアドレスは既に使用されています" が表示される
And アカウントは作成されない
```

**AC-01-03: 異常系 - 不正なパスワード**
```gherkin
Given ユーザーが登録フォームにアクセスしている
When パスワードに "123" (8文字未満)を入力する
Then エラーメッセージ "パスワードは8文字以上で入力してください" が表示される
And 登録ボタンが非活性化される
```

**AC-01-04: 境界値 - パスワード長の検証**
```gherkin
Given ユーザーが登録フォームにアクセスしている
When パスワードに正確に8文字の文字列を入力する
Then 登録ボタンが活性化される
And 登録処理が正常に実行される
```

**AC-01-05: セキュリティ - パスワードハッシュ化**
```gherkin
Given ユーザーが登録を完了した
When データベースのユーザーレコードを確認する
Then パスワードがBcryptでハッシュ化されて保存されている
And 平文パスワードは保存されていない
```

### US-02: ログイン・ログアウト機能
**AC-02-01: 正常系 - 有効な認証情報でログイン**
```gherkin
Given ユーザー "user@example.com" が登録済みである
When メールアドレス "user@example.com" とパスワード "correctPassword" を入力してログインする
Then ホーム画面が表示される
And セッションが確立される
```

**AC-02-02: 異常系 - 誤ったパスワード**
```gherkin
Given ユーザー "user@example.com" が登録済みである
When メールアドレス "user@example.com" と誤ったパスワード "wrongPassword" を入力する
Then エラーメッセージ "メールアドレスまたはパスワードが正しくありません" が表示される
And ログインが拒否される
```

**AC-02-03: 正常系 - ログアウト**
```gherkin
Given ユーザーがログイン済みである
When ログアウトボタンをクリックする
Then セッションが破棄される
And ログイン画面にリダイレクトされる
```

**AC-02-04: セキュリティ - セッションタイムアウト**
```gherkin
Given ユーザーがログイン済みである
When 24時間以上操作がない
Then セッションが自動的に無効化される
And 次回アクセス時にログイン画面が表示される
```

### US-03: 投稿作成機能
**AC-03-01: 正常系 - 有効な投稿の作成**
```gherkin
Given ユーザーがログイン済みである
When "これはテスト投稿です" というテキストを入力して投稿ボタンをクリックする
Then 投稿が正常に作成される
And タイムラインの最上部に新規投稿が表示される
And 投稿フォームがクリアされる
```

**AC-03-02: 異常系 - 空の投稿**
```gherkin
Given ユーザーが投稿フォームにアクセスしている
When 何も入力せずに投稿ボタンをクリックする
Then エラーメッセージ "投稿内容を入力してください" が表示される
And 投稿は作成されない
```

**AC-03-03: 異常系 - 文字数超過**
```gherkin
Given ユーザーが投稿フォームにアクセスしている
When 281文字以上のテキストを入力する
Then 文字数カウンターが赤色で表示される
And エラーメッセージ "280文字以内で入力してください" が表示される
And 投稿ボタンが非活性化される
```

**AC-03-04: セキュリティ - XSS対策**
```gherkin
Given ユーザーが投稿フォームにアクセスしている
When "<script>alert('XSS')</script>" を含むテキストを投稿する
Then スクリプトがエスケープされて保存される
And タイムライン表示時にスクリプトが実行されない
```

### US-04: タイムライン表示機能
**AC-04-01: 正常系 - フォローユーザーの投稿表示**
```gherkin
Given ユーザーAがユーザーBとユーザーCをフォローしている
When ユーザーAがタイムラインを開く
Then ユーザーBとユーザーCの投稿が時系列順(新しい順)に表示される
And フォローしていないユーザーDの投稿は表示されない
```

**AC-04-02: 正常系 - リアルタイム更新**
```gherkin
Given ユーザーAがタイムラインを開いている
When フォロー中のユーザーBが新規投稿を作成する
Then 3秒以内にユーザーAのタイムラインに新規投稿が自動的に表示される
And ページリロードは不要である
```

**AC-04-03: 境界値 - 投稿が0件の場合**
```gherkin
Given ユーザーが誰もフォローしていない
When タイムラインを開く
Then "フォローしているユーザーの投稿がありません" というメッセージが表示される
And 空のリストが表示される
```

**AC-04-04: パフォーマンス - 大量投稿の表示**
```gherkin
Given タイムラインに100件以上の投稿が存在する
When タイムラインを開く
Then 初回表示で最新20件が表示される
And スクロールにより追加で20件ずつ遅延読み込みされる
And 初回表示は500ミリ秒以内(p95)に完了する
```

### US-05: フォロー・アンフォロー機能
**AC-05-01: 正常系 - ユーザーのフォロー**
```gherkin
Given ユーザーAがログイン済みである
And ユーザーBをフォローしていない
When ユーザーBのプロフィール画面で「フォロー」ボタンをクリックする
Then フォロー関係が確立される
And ボタン表示が「フォロー中」に変わる
And 1秒以内にUIが更新される
```

**AC-05-02: 正常系 - ユーザーのアンフォロー**
```gherkin
Given ユーザーAがユーザーBをフォロー中である
When ユーザーBのプロフィール画面で「フォロー中」ボタンをクリックする
Then フォロー関係が解除される
And ボタン表示が「フォロー」に戻る
And ユーザーBの投稿がタイムラインから削除される
```

**AC-05-03: 異常系 - 自分自身のフォロー**
```gherkin
Given ユーザーAがログイン済みである
When 自分のプロフィール画面にアクセスする
Then フォローボタンが表示されない
And 自分自身をフォローできない
```

**AC-05-04: 異常系 - ネットワークエラー時のリトライ**
```gherkin
Given ユーザーAがフォローボタンをクリックする
When ネットワークエラーが発生する
Then システムは自動的に3回までリトライする
And リトライ失敗時はエラーメッセージを表示する
```

### US-06: いいね機能
**AC-06-01: 正常系 - いいねの付与**
```gherkin
Given ユーザーAがタイムラインを閲覧している
And 投稿Xに「いいね」を付けていない
When 投稿Xの「いいね」ボタンをクリックする
Then 「いいね」が付与される
And いいねボタンがハイライト表示される
And いいね数が1増加する
```

**AC-06-02: 正常系 - いいねの削除**
```gherkin
Given ユーザーAが投稿Xに「いいね」を付けている
When 投稿Xの「いいね」ボタンを再度クリックする
Then 「いいね」が削除される
And いいねボタンのハイライトが解除される
And いいね数が1減少する
```

**AC-06-03: 境界値 - 同一投稿への重複いいね防止**
```gherkin
Given ユーザーAが投稿Xに「いいね」を付けている
When 同じ投稿Xに対して再度「いいね」APIを呼び出す
Then 重複していいねが作成されない
And いいね数は変わらない
```

### US-07: プロフィール表示機能
**AC-07-01: 正常系 - 自分のプロフィール表示**
```gherkin
Given ユーザーAがログイン済みである
When 自分のプロフィールページを開く
Then ユーザー名、投稿数、フォロワー数、フォロー数が表示される
And 自分の投稿一覧が時系列順に表示される
```

**AC-07-02: 正常系 - 他ユーザーのプロフィール表示**
```gherkin
Given ユーザーAがログイン済みである
When ユーザーBのプロフィールページを開く
Then ユーザーBのユーザー名、投稿数、フォロワー数、フォロー数が表示される
And ユーザーBの投稿一覧が時系列順に表示される
And フォローボタンまたは「フォロー中」ボタンが表示される
```

**AC-07-03: パフォーマンス - プロフィール読み込み時間**
```gherkin
Given ユーザーがプロフィールページにアクセスする
When ページが読み込まれる
Then 初回表示が300ミリ秒以内(p95)に完了する
And すべてのデータが正しく表示される
```

### US-08: 投稿削除機能
**AC-08-01: 正常系 - 自分の投稿を削除**
```gherkin
Given ユーザーAが投稿Xを作成済みである
When 投稿Xの削除ボタンをクリックして確認する
Then 投稿Xが削除される
And タイムラインから投稿Xが消える
And データベースから投稿Xが削除される
```

**AC-08-02: 異常系 - 他人の投稿削除の防止**
```gherkin
Given ユーザーBが投稿Yを作成している
When ユーザーAが投稿Yの削除を試みる
Then アクセスが拒否される
And エラーメッセージ "この操作は許可されていません" が表示される
And 投稿Yは削除されない
```

**AC-08-03: 正常系 - 削除確認ダイアログ**
```gherkin
Given ユーザーが自分の投稿の削除ボタンをクリックする
When 確認ダイアログが表示される
Then "本当に削除しますか？" というメッセージが表示される
And 「削除」と「キャンセル」ボタンが表示される
```

### US-09: レスポンシブデザイン
**AC-09-01: 正常系 - モバイル表示**
```gherkin
Given スマートフォン(画面幅375px)でアクセスする
When タイムラインを表示する
Then レイアウトがモバイル用に最適化される
And すべてのボタンがタップ可能なサイズ(最小44x44px)で表示される
And 横スクロールが発生しない
```

**AC-09-02: 正常系 - タブレット表示**
```gherkin
Given タブレット(画面幅768px)でアクセスする
When タイムラインを表示する
Then レイアウトが2カラムで表示される
And タッチ操作が快適に動作する
```

**AC-09-03: 正常系 - デスクトップ表示**
```gherkin
Given デスクトップ(画面幅1920px)でアクセスする
When タイムラインを表示する
Then レイアウトが3カラムで表示される
And 最大コンテンツ幅が1200pxに制限される
```

### US-10: エラーハンドリング
**AC-10-01: 正常系 - ネットワークエラーのリトライ**
```gherkin
Given ユーザーが投稿を作成しようとしている
When ネットワークエラーが発生する
Then システムは自動的に3回リトライする
And リトライ中は「送信中...」インジケーターが表示される
And 3回失敗後はエラーメッセージが表示される
```

**AC-10-02: 正常系 - サーバーエラー表示**
```gherkin
Given システムがメンテナンス中である
When ユーザーがページにアクセスする
Then "現在メンテナンス中です。しばらくお待ちください" というメッセージが表示される
And HTTPステータスコード503が返される
```

**AC-10-03: 異常系 - データベース接続エラー**
```gherkin
Given データベース接続が切断されている
When ユーザーがタイムラインを読み込もうとする
Then エラーメッセージ "データの読み込みに失敗しました" が表示される
And リトライボタンが表示される
And エラーがログに記録される
```

## 7. 非機能要件(ISO/IEC 25010)

### 7.1 Performance Efficiency(性能効率性)
- **PE-01**: API応答時間(p95)≦ 200ミリ秒(GETリクエスト)
- **PE-02**: API応答時間(p95)≦ 500ミリ秒(POSTリクエスト)
- **PE-03**: ページ初回表示時間(Time to Interactive)≦ 2秒(3G回線環境)
- **PE-04**: WebSocket経由のリアルタイム更新遅延 ≦ 3秒
- **PE-05**: 同時接続ユーザー数 ≧ 1,000人(ピーク時)
- **PE-06**: データベースクエリ実行時間(p95)≦ 100ミリ秒
- **PE-07**: フロントエンドバンドルサイズ ≦ 500KB(gzip圧縮後)

### 7.2 Reliability(信頼性)
- **RE-01**: システム稼働率 ≧ 99.5%(月間)
- **RE-02**: 平均故障間隔(MTBF)≧ 720時間(30日)
- **RE-03**: 平均復旧時間(MTTR)≦ 1時間
- **RE-04**: データ損失率 = 0%(バックアップ体制確立)
- **RE-05**: エラー率 ≦ 0.1%(全リクエスト対比)

### 7.3 Security(セキュリティ)
- **SE-01**: すべての通信にTLS 1.2以上を使用
- **SE-02**: パスワードはBcryptでハッシュ化(コストファクター10以上)
- **SE-03**: SQLインジェクション対策：プリペアドステートメント使用率 = 100%
- **SE-04**: XSS対策：すべてのユーザー入力をサニタイズ(実施率100%)
- **SE-05**: CSRF対策：トークン検証実施率 = 100%
- **SE-06**: セッションタイムアウト = 24時間(無操作時)
- **SE-07**: パスワード要件：最小8文字、英数字記号混在

### 7.4 Usability(使用性)
- **US-01**: 新規ユーザーのアカウント登録完了率 ≧ 80%
- **US-02**: タスク完了時間：投稿作成 ≦ 30秒(平均)
- **US-03**: エラーメッセージの理解度 ≧ 90%(ユーザーテスト)
- **US-04**: モバイルでのタップ可能領域 ≧ 44x44px(iOS HIG準拠)
- **US-05**: キーボードナビゲーション対応率 = 100%(主要機能)

### 7.5 Maintainability(保守性)
- **MA-01**: コードカバレッジ(単体テスト)≧ 80%
- **MA-02**: コードの循環的複雑度(Cyclomatic Complexity)≦ 10(関数平均)
- **MA-03**: 技術的負債比率 ≦ 5%(SonarQube測定)
- **MA-04**: ドキュメント更新遅延 ≦ 1週間(コード変更後)
- **MA-05**: コードレビュー実施率 = 100%(全プルリクエスト)

### 7.6 Portability(移植性)
- **PO-01**: ブラウザ対応：Chrome(最新版)、Firefox(最新版)、Safari(最新版)、Edge(最新版)
- **PO-02**: モバイルブラウザ対応：iOS Safari(最新2バージョン)、Android Chrome(最新2バージョン)
- **PO-03**: 画面サイズ対応範囲：320px(最小)～ 1920px(最大)
- **PO-04**: データベース移行可能性：PostgreSQL、MySQL、SQLite対応

### 7.7 Compatibility(互換性)
- **CO-01**: REST API仕様のバージョン管理(セマンティックバージョニング)
- **CO-02**: 後方互換性維持期間 ≧ 6ヶ月(APIバージョンアップ時)
- **CO-03**: Webアクセシビリティ：WCAG 2.1 レベルAA準拠率 ≧ 90%

## 8. データ & APIドラフト

### 8.1 主要エンティティ一覧

#### User(ユーザー)
| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | ユーザーID |
| email | String(255) | UNIQUE, NOT NULL | メールアドレス |
| username | String(50) | UNIQUE, NOT NULL | ユーザー名 |
| password_hash | String(255) | NOT NULL | ハッシュ化パスワード |
| created_at | Timestamp | NOT NULL | 作成日時 |
| updated_at | Timestamp | NOT NULL | 更新日時 |

#### Post(投稿)
| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | 投稿ID |
| user_id | UUID | FK(User), NOT NULL | 投稿者ID |
| content | Text(280) | NOT NULL | 投稿内容 |
| created_at | Timestamp | NOT NULL | 作成日時 |
| updated_at | Timestamp | NOT NULL | 更新日時 |

#### Follow(フォロー関係)
| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | フォローID |
| follower_id | UUID | FK(User), NOT NULL | フォローする側のユーザーID |
| followee_id | UUID | FK(User), NOT NULL | フォローされる側のユーザーID |
| created_at | Timestamp | NOT NULL | 作成日時 |
| UNIQUE(follower_id, followee_id) | - | UNIQUE制約 | 重複フォロー防止 |

#### Like(いいね)
| フィールド | 型 | 制約 | 説明 |
|-----------|-----|------|------|
| id | UUID | PK, NOT NULL | いいねID |
| user_id | UUID | FK(User), NOT NULL | いいねしたユーザーID |
| post_id | UUID | FK(Post), NOT NULL | いいね対象の投稿ID |
| created_at | Timestamp | NOT NULL | 作成日時 |
| UNIQUE(user_id, post_id) | - | UNIQUE制約 | 重複いいね防止 |

### 8.2 ER図(テキスト表現)
```
User 1 --- * Post (1人のユーザーは複数の投稿を持つ)
User * --- * User via Follow (ユーザーは複数のユーザーをフォロー/フォローされる)
User * --- * Post via Like (ユーザーは複数の投稿にいいね/投稿は複数のいいねを受ける)
```

### 8.3 OpenAPIスケルトン(YAML形式)

```yaml
openapi: 3.0.3
info:
  title: Mini-SNS API
  version: 1.0.0
  description: 簡易SNSのREST API仕様
servers:
  - url: https://api.mini-sns.example.com/v1
paths:
  /auth/register:
    post:
      summary: ユーザー登録
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, username, password]
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                username:
                  type: string
                  minLength: 3
                  maxLength: 50
                  example: testuser
                password:
                  type: string
                  minLength: 8
                  example: SecurePass123!
      responses:
        '201':
          description: 登録成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: バリデーションエラー
        '409':
          description: メールアドレス重複

  /auth/login:
    post:
      summary: ログイン
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: ログイン成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: JWTトークン
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: 認証失敗

  /auth/logout:
    post:
      summary: ログアウト
      tags: [Authentication]
      security:
        - bearerAuth: []
      responses:
        '204':
          description: ログアウト成功
        '401':
          description: 未認証

  /posts:
    get:
      summary: タイムライン取得(フォロー中のユーザーの投稿)
      tags: [Posts]
      security:
        - bearerAuth: []
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
            minimum: 0
      responses:
        '200':
          description: 取得成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  posts:
                    type: array
                    items:
                      $ref: '#/components/schemas/PostWithAuthor'
                  total:
                    type: integer
        '401':
          description: 未認証

    post:
      summary: 投稿作成
      tags: [Posts]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [content]
              properties:
                content:
                  type: string
                  minLength: 1
                  maxLength: 280
                  example: これはテスト投稿です
      responses:
        '201':
          description: 作成成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '400':
          description: バリデーションエラー
        '401':
          description: 未認証

  /posts/{postId}:
    delete:
      summary: 投稿削除
      tags: [Posts]
      security:
        - bearerAuth: []
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: 削除成功
        '401':
          description: 未認証
        '403':
          description: 権限なし
        '404':
          description: 投稿が存在しない

  /posts/{postId}/likes:
    post:
      summary: いいね付与
      tags: [Likes]
      security:
        - bearerAuth: []
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '201':
          description: いいね成功
        '401':
          description: 未認証
        '409':
          description: 既にいいね済み

    delete:
      summary: いいね削除
      tags: [Likes]
      security:
        - bearerAuth: []
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: いいね削除成功
        '401':
          description: 未認証
        '404':
          description: いいねが存在しない

  /users/{userId}/follow:
    post:
      summary: ユーザーをフォロー
      tags: [Follow]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '201':
          description: フォロー成功
        '400':
          description: 自分自身はフォロー不可
        '401':
          description: 未認証
        '409':
          description: 既にフォロー済み

    delete:
      summary: ユーザーをアンフォロー
      tags: [Follow]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: アンフォロー成功
        '401':
          description: 未認証
        '404':
          description: フォロー関係が存在しない

  /users/{userId}:
    get:
      summary: ユーザープロフィール取得
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 取得成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'
        '401':
          description: 未認証
        '404':
          description: ユーザーが存在しない

  /users/{userId}/posts:
    get:
      summary: 特定ユーザーの投稿一覧取得
      tags: [Users]
      security:
        - bearerAuth: []
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: 取得成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  posts:
                    type: array
                    items:
                      $ref: '#/components/schemas/Post'
                  total:
                    type: integer
        '401':
          description: 未認証

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        username:
          type: string
        created_at:
          type: string
          format: date-time
      required: [id, email, username, created_at]

    Post:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        content:
          type: string
        likes_count:
          type: integer
        created_at:
          type: string
          format: date-time
      required: [id, user_id, content, likes_count, created_at]

    PostWithAuthor:
      allOf:
        - $ref: '#/components/schemas/Post'
        - type: object
          properties:
            author:
              $ref: '#/components/schemas/User'
            is_liked:
              type: boolean
              description: ログインユーザーがいいね済みかどうか

    UserProfile:
      allOf:
        - $ref: '#/components/schemas/User'
        - type: object
          properties:
            posts_count:
              type: integer
            followers_count:
              type: integer
            following_count:
              type: integer
            is_following:
              type: boolean
              description: ログインユーザーがフォロー中かどうか

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## 9. リスク / 依存関係 / 制約

### 9.1 リスク
| ID | リスク内容 | 影響度 | 発生確率 | 対策 |
|----|-----------|--------|---------|------|
| R-01 | リアルタイム更新の負荷によるサーバー過負荷 | 高 | 中 | WebSocket接続数の監視、自動スケーリング設定、接続数制限(1,000同時接続) |
| R-02 | スパム投稿・不適切コンテンツの投稿 | 中 | 高 | レート制限(1ユーザーあたり1分に10投稿まで)、通報機能の将来追加 |
| R-03 | データベースのスケーラビリティ問題 | 中 | 中 | インデックス最適化、Read Replica導入、キャッシュ戦略(Redis) |
| R-04 | セキュリティ脆弱性(XSS、SQLインジェクション等) | 高 | 低 | コードレビュー徹底、セキュリティスキャン自動化、脆弱性診断実施 |
| R-05 | ブラウザ間の互換性問題 | 低 | 中 | クロスブラウザテスト自動化、Polyfill導入 |

### 9.2 依存関係
- **外部サービス依存**: なし(初期バージョンでは外部API利用なし)
- **技術スタック依存**:
  - フロントエンド: React 18以上、WebSocket対応ブラウザ
  - バックエンド: Node.js 18以上、または Python 3.9以上、または Go 1.20以上
  - データベース: PostgreSQL 14以上、またはMySQL 8.0以上
  - リアルタイム通信: WebSocket (Socket.io、またはネイティブWebSocket)
- **人的リソース依存**: フルスタック開発者2名、UI/UXデザイナー1名(最低構成)

### 9.3 制約
- **予算制約**: 開発期間3ヶ月、運用コスト月額$100以内(クラウドホスティング費用)
- **技術制約**: サーバーレスアーキテクチャまたは小規模VPS(2GB RAM、2vCPU)での動作を想定
- **法的制約**: 個人情報保護法準拠、Cookie利用時の同意取得
- **時間制約**: 初期リリースまで3ヶ月、MVP機能のみ実装
- **リソース制約**: 開発チーム最大3名、週40時間稼働

## 10. Assumptions / Open Questions

### 10.1 仮定(Assumptions)
1. **A-01**: ユーザーは基本的なWeb操作スキルを持つ(ブラウザ操作、テキスト入力)
2. **A-02**: インターネット接続は安定している(3G以上の通信速度)
3. **A-03**: ユーザーのブラウザはJavaScriptおよびWebSocketをサポートしている
4. **A-04**: 初期ユーザー数は100名以下、将来的に1,000名まで拡大を想定
5. **A-05**: 投稿内容は主に日本語テキストであり、画像・動画は含まない
6. **A-06**: 開発環境としてGit、Docker、CI/CDツールが利用可能
7. **A-07**: クラウドインフラ(AWS、GCP、Azure、またはVercel等)が利用可能
8. **A-08**: データベースバックアップは日次で自動実行される

### 10.2 要確認事項(Open Questions)
1. **Q-01**: プロフィール画像(アバター)機能は初期バージョンに含めるか？ → **回答待ち**(優先度: 低)
2. **Q-02**: ハッシュタグ機能は必要か？ → **回答待ち**(優先度: 中)
3. **Q-03**: 投稿の検索機能は初期リリースに含めるか？ → **回答待ち**(優先度: 中)
4. **Q-04**: ユーザー名の変更機能は必要か？ → **回答待ち**(優先度: 低)
5. **Q-05**: 投稿の編集機能は必要か？(現在は削除のみ) → **回答待ち**(優先度: 低)
6. **Q-06**: 管理者アカウントによるユーザー管理機能は必要か？ → **回答待ち**(優先度: 低)
7. **Q-07**: プライベートアカウント(フォロー承認制)機能は必要か？ → **回答待ち**(優先度: 低)
8. **Q-08**: 本番環境のホスティング先は決定済みか？(AWS、GCP、Vercel等) → **回答待ち**(優先度: 高)
9. **Q-09**: ドメイン名は取得済みか？ → **回答待ち**(優先度: 中)
10. **Q-10**: GDPR等のデータプライバシー規制への対応範囲は？(日本国内のみ想定) → **回答待ち**(優先度: 中)

## 11. 成功指標(SMART)と計測方法

### 11.1 ユーザー獲得・エンゲージメント指標

| 指標ID | 指標名 | 目標値 | 期間 | 計測方法 |
|--------|-------|--------|------|----------|
| KPI-01 | 新規ユーザー登録数 | 100名 | リリース後1ヶ月 | データベースUserテーブルのレコード数(created_atフィルタ) |
| KPI-02 | 日次アクティブユーザー数(DAU) | 50名 | リリース後1ヶ月時点 | 日次ログイン数(ユニークユーザー)をGoogle Analyticsで計測 |
| KPI-03 | 週次アクティブユーザー数(WAU) | 80名 | リリース後1ヶ月時点 | 週次ログイン数(ユニークユーザー)をGoogle Analyticsで計測 |
| KPI-04 | ユーザー継続率(7日後) | 60% | リリース後1ヶ月 | (7日後に再訪したユーザー数 / 新規登録ユーザー数) × 100 |
| KPI-05 | 1ユーザーあたりの平均投稿数 | 5件/週 | リリース後1ヶ月 | 総投稿数 / アクティブユーザー数(週次集計) |
| KPI-06 | 1ユーザーあたりの平均フォロー数 | 3名 | リリース後1ヶ月 | Followテーブルのレコード数 / 総ユーザー数 |
| KPI-07 | 投稿あたりの平均いいね数 | 2件 | リリース後1ヶ月 | 総いいね数 / 総投稿数 |

### 11.2 技術パフォーマンス指標

| 指標ID | 指標名 | 目標値 | 期間 | 計測方法 |
|--------|-------|--------|------|----------|
| KPI-08 | API応答時間(p95) | ≦ 200ms | 常時 | APMツール(New Relic、Datadog等)でモニタリング |
| KPI-09 | ページ読み込み時間(Time to Interactive) | ≦ 2秒 | 常時 | Lighthouse CI、または Google PageSpeed Insights |
| KPI-10 | WebSocketリアルタイム更新遅延 | ≦ 3秒 | 常時 | カスタムメトリクス(投稿作成時刻 vs 他ユーザー受信時刻の差分) |
| KPI-11 | エラー率 | ≦ 0.1% | 常時 | エラーレスポンス数 / 総リクエスト数(Sentryでトラッキング) |
| KPI-12 | システム稼働率 | ≧ 99.5% | 月次 | アップタイム監視ツール(UptimeRobot、Pingdom等) |

### 11.3 ビジネス・満足度指標

| 指標ID | 指標名 | 目標値 | 期間 | 計測方法 |
|--------|-------|--------|------|----------|
| KPI-13 | Net Promoter Score (NPS) | ≧ 40 | リリース後3ヶ月 | ユーザーアンケート(0-10点評価)による算出 |
| KPI-14 | 機能満足度スコア | ≧ 4.0 / 5.0 | リリース後3ヶ月 | ユーザーアンケート(5段階評価) |
| KPI-15 | バグ報告数 | ≦ 5件/週 | リリース後1ヶ月 | GitHubイシュー数(bug labelフィルタ) |
| KPI-16 | ユーザーサポート問い合わせ数 | ≦ 10件/週 | リリース後1ヶ月 | メール・問い合わせフォーム受信数 |

### 11.4 計測ツール・実装方法

#### フロントエンド計測
- **Google Analytics 4**: ページビュー、ユーザー行動、セッション時間
- **Lighthouse CI**: パフォーマンススコア、アクセシビリティスコア
- **Sentry**: JavaScriptエラートラッキング

#### バックエンド計測
- **APMツール(New Relic / Datadog)**: API応答時間、データベースクエリ時間、エラー率
- **Prometheus + Grafana**: カスタムメトリクス(WebSocket接続数、リアルタイム更新遅延)
- **Uptime監視(UptimeRobot)**: サービス稼働率、ダウンタイム検知

#### データベース計測
- **PostgreSQL / MySQLのログ分析**: スロークエリ検出、インデックス効率
- **定期的なSQLパフォーマンスレビュー**: EXPLAINコマンドによるクエリ最適化

#### ユーザーフィードバック
- **アンケートツール(Typeform / Google Forms)**: NPS、満足度調査
- **フィードバックフォーム(アプリ内埋め込み)**: 機能改善要望収集

---

## 備考
- 本要件定義書は初期バージョン(v1.0)を対象としており、将来的な機能追加(DM、通知、グループ機能等)は別途検討する。
- 数値目標は市場調査・競合分析に基づき設定しているが、実際の運用データに基づき四半期ごとに見直しを行う。
- セキュリティ要件については、定期的な脆弱性診断(3ヶ月ごと)を実施し、最新の脅威に対応する。
