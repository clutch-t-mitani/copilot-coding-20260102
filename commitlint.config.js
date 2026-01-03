/**
 * @see https://commitlint.js.org/
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新機能
        'fix',      // バグ修正
        'docs',     // ドキュメントのみの変更
        'style',    // コードの意味に影響を与えない変更（空白、フォーマット等）
        'refactor', // リファクタリング
        'perf',     // パフォーマンス改善
        'test',     // テストの追加・修正
        'build',    // ビルドシステムや外部依存関係の変更
        'ci',       // CI設定ファイルやスクリプトの変更
        'chore',    // その他の変更
        'revert',   // コミットの取り消し
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'user-service',
        'post-service',
        'social-service',
        'timeline-service',
        'infra',
        'ci',
        'docs',
        'deps',
        'root',
      ],
    ],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 150],
  },
};
