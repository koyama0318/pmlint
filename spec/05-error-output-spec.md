# Error & Output Specification

## 1. Error Code List

### Fatal Errors（処理中断）

| コード | 発生条件 |
|--------|----------|
| `unsupported-schema-version` | `version` フィールドが非対応の値 |
| `invalid-config` | 同一 level の `items[]` に同名 `title` が複数存在 |

### Lint Errors

| コード | 発生条件 | severity |
|--------|----------|----------|
| `parse-error` | front matter の YAML パースに失敗 | `error` |
| `doc-too-short` | ドキュメントの総行数 < `constraints.length.min_lines` | `error` |
| `doc-too-long` | ドキュメントの総行数 > `constraints.length.max_lines` | `error` |
| `duplicate-heading` | `no_duplicate_headings: true` で同タイトル見出しが複数出現 | `error` |
| `missing-heading` | `required: true` の見出しまたはタイトルが存在しない | `error` |
| `extra-heading` | `allow_additional_headings: false` で `items` 未定義のタイトルが存在 | `error` |
| `section-too-short` | セクション行数 < `length.min_lines` | `error` |
| `section-too-long` | セクション行数 > `length.max_lines` | `error` |
| `line-too-long` | 行長 > `element.text.max_length_per_line`（front matter・見出し本文どちらにも適用） | `error` |
| `empty-line-not-allowed` | `allow_empty_lines: false` で空行あり | `error` |
| `empty-content` | `element.text.allow_empty: false` で本文が空 | `error` |
| `list-required` | `structure.require_list: true` でリストなし | `error` |
| `invalid-list-marker` | `element.list.required_marker` と異なるマーカーを使用 | `error` |
| `list-too-few` | リスト項目の合計 < `element.list.min_items` | `error` |
| `list-too-many` | リスト項目の合計 > `element.list.max_items` | `error` |
| `code-block-not-allowed` | `element.code_block.allowed: false` でコードブロックあり | `error` |
| `emphasis-not-allowed` | `element.emphasis.allowed: false` で強調記法あり | `error` |
| `subheading-not-allowed` | `structure.allow_subheadings: false` で下位見出しあり | `error` |

## 2. Error Object Schema

```typescript
interface LintError {
  file: string      // ファイルの絶対パス
  line?: number     // エラー発生行（特定できる場合）
  code: string      // エラーコード
  message: string   // 人間向けメッセージ
  severity: 'error'
}
```

## 3. Exit Codes

- `0`: エラーなし（正常終了）
- `1`: 1件以上の lint error または fatal error が存在する

## 4. Text Output Format

1行1エラー。フォーマット:

```
<severity>  <file>:<line>  <code>  <message>
```

`line` が特定できない場合はファイルパスのみ:

```
<severity>  <file>  <code>  <message>
```

例:

```
error  prompts/skill.md:3   line-too-long          line exceeds 200 characters
error  prompts/skill.md     missing-heading        "Instructions" heading is required
error  prompts/skill.md:12  code-block-not-allowed  code blocks are not allowed in this section
```
