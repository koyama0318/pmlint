# Error & Output Specification

## 1. Error Code List

| コード | 発生条件 | severity |
|--------|----------|----------|
| `missing-section` | `required` に定義されたセクションが存在しない | `error` |
| `duplicate-section` | 同名セクションが複数存在する | `error` |

## 2. Error Object Schema (JSON)

```typescript
interface LintError {
  file: string      // ファイルの絶対パス
  code: string      // エラーコード
  message: string   // 人間向けメッセージ
  severity: "error"
}
```

## 3. Exit Codes

- `0`: エラーなし（正常終了）
- `1`: 1件以上の `error` が存在する

## 4. Text Output Format

1行1エラー。フォーマット:

```
<severity>  <file>  <code>  <message>
```

例:

```
error  prompts/skill.md  missing-section  "Constraints" section is required
```
