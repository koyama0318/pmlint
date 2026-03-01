# Rule Engine Specification

## 1. Rule Execution Model

実行順序（固定）:

1. Config ロード・バリデーション（`unsupported-schema-version`, `invalid-config`）
2. Markdown パース → `PromptIR` 生成（`parse-error`）
3. ドキュメント全体制約チェック（`doc-too-short`, `doc-too-long`）
4. Front matter 制約チェック（`line-too-long` in front matter context）
5. Markdown 構造チェック（`duplicate-heading`, `missing-heading`, `extra-heading`）
6. 各見出しコンテンツ制約チェック（継承解決後の制約を適用）

## 2. Constraint Inheritance Resolution

バリデーター呼び出し前に制約を解決する。

```
resolveConstraints(heading, config):
  base = config.constraints ?? {}
  levelConstraints = config.markdown.headings[level{{n}}].constraints ?? {}
  itemConstraints = items.find(title == heading.title).constraints ?? {}
  return deepMerge(base, levelConstraints, itemConstraints)
  // null または未指定のフィールドは上位の値を保持
```

## 3. Validation Rules

### Document Level

| ルール | 条件 | エラーコード |
|--------|------|-------------|
| doc-too-short | 総行数 < `constraints.length.min_lines` | `doc-too-short` |
| doc-too-long | 総行数 > `constraints.length.max_lines` | `doc-too-long` |

### Front Matter Level

| ルール | 条件 | エラーコード |
|--------|------|-------------|
| line-too-long | front matter の行長 > `front_matter.constraints.element.text.max_length_per_line` | `line-too-long` |

### Markdown Structure Level

| ルール | 条件 | エラーコード |
|--------|------|-------------|
| no-duplicate-headings | `no_duplicate_headings: true` で同タイトルが複数出現 | `duplicate-heading` |
| required-heading | `level{{n}}.required: true` かつそのレベルの見出しが0件 | `missing-heading` |
| required-item | `items[].required: true` かつそのタイトルが存在しない | `missing-heading` |
| no-extra-headings | `allow_additional_headings: false` かつ items に未定義のタイトル | `extra-heading` |

### Heading Content Level（継承解決後の制約を使用）

| ルール | 条件 | エラーコード |
|--------|------|-------------|
| section-too-short | 行数 < `length.min_lines` | `section-too-short` |
| section-too-long | 行数 > `length.max_lines` | `section-too-long` |
| no-empty-lines | `allow_empty_lines: false` かつ空行あり | `empty-line-not-allowed` |
| line-length | 行長 > `element.text.max_length_per_line` | `line-too-long` |
| no-empty-content | `element.text.allow_empty: false` かつ isEmpty | `empty-content` |
| list-required | `structure.require_list: true` かつリストなし | `list-required` |
| list-marker | `element.list.required_marker` と不一致のマーカーあり | `invalid-list-marker` |
| list-min | 合計リスト項目数 < `element.list.min_items` | `list-too-few` |
| list-max | 合計リスト項目数 > `element.list.max_items` | `list-too-many` |
| no-code-block | `element.code_block.allowed: false` かつコードブロックあり | `code-block-not-allowed` |
| no-emphasis | `element.emphasis.allowed: false` かつ強調あり | `emphasis-not-allowed` |
| no-subheadings | `structure.allow_subheadings: false` かつ children が存在 | `subheading-not-allowed` |

## 4. Severity Model

全エラーを `severity: "error"` として扱う。`warning` は未実装。

## 5. Extensibility

カスタムルールは将来の拡張とする。
