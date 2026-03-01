# Type System Specification

## 1. Config File Format

設定ファイルは `.pmlintrc.yml`。スキーマ v2 形式を定義する。

```yaml
version: 1
schema: <string>

constraints:
  length:
    min_lines: <number|null>
    max_lines: <number|null>
    allow_empty_lines: <boolean|null>
  element:
    text:
      max_length_per_line: <number|null>
      allow_empty: <boolean|null>
    list:
      required_marker: <'-'|'*'|'+'|null>
      min_items: <number|null>
      max_items: <number|null>
    code_block:
      allowed: <boolean|null>
    emphasis:
      allowed: <boolean|null>

front_matter:
  constraints:
    element:
      text:
        max_length_per_line: <number|null>

markdown:
  constraints:
    no_duplicate_headings: <boolean|null>
    allow_additional_headings: <boolean|null>

  headings:
    level1:
      required: <boolean|null>
      constraints:
        length:
          min_lines: <number|null>
          max_lines: <number|null>
        structure:
          require_list: <boolean|null>
          allow_subheadings: <boolean|null>
        element:
          text:
            max_length_per_line: <number|null>
      items:
        - title: <string>
          required: <boolean|null>
          constraints:
            length:
              min_lines: <number|null>
              max_lines: <number|null>
            structure:
              require_list: <boolean|null>
              allow_subheadings: <boolean|null>
            element:
              text:
                max_length_per_line: <number|null>
              list:
                max_items: <number|null>
    level2: <same structure as level1>
    level3: <same structure as level1>
    level4: <same structure as level1>
```

## 2. Fields

### ルートフィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `version` | number | ✓ | スキーマバージョン。現在 `1` のみサポート |
| `schema` | string | ✓ | スキーマ識別子（任意の文字列。pmlint は検証しない） |
| `constraints` | object | 任意 | ドキュメント全体の基底制約 |
| `front_matter` | object | 任意 | front matter 専用制約 |
| `markdown` | object | 任意 | Markdown 構造定義 |

### `items[]` フィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | ✓ | 対象見出しタイトル（大文字小文字を区別） |
| `required` | boolean | 任意 | そのタイトルの存在要否 |
| `constraints` | object | 任意 | 個別 override 制約 |

## 3. Config Validation Rules

設定ファイルロード時に以下を検証する。違反は lint エラーではなく fatal エラーとして報告し、処理を中断する。

- `version` が `1` 以外 → `unsupported-schema-version`
- 同一 level の `items[]` に同名 `title` が複数存在 → `invalid-config`

## 4. Constraint Inheritance Model

制約は以下の優先順で解決する（高 → 低）。`null` または未指定は上位から継承する。

```
items[title 一致].constraints
  ↑ level{{n}}.constraints
      ↑ document.constraints（constraints ルートフィールド）
```

`front_matter.constraints` はドキュメント全体制約から独立して適用する（継承はしない）。

### 継承解決アルゴリズム

1. `document.constraints` を基底として使用する
2. 対象見出しの `level{{n}}.constraints` で `null` 以外のフィールドを上書きする
3. 対象見出しの `items[title 一致].constraints` で `null` 以外のフィールドを上書きする
4. 解決済み制約をバリデーターに渡す

## 5. 設定例

```yaml
version: 1
schema: skill_markdown_schema

constraints:
  length:
    min_lines: 1
    max_lines: 300
  element:
    text:
      max_length_per_line: 200
    code_block:
      allowed: true

front_matter:
  constraints:
    element:
      text:
        max_length_per_line: 120

markdown:
  constraints:
    no_duplicate_headings: true
    allow_additional_headings: false

  headings:
    level2:
      required: false
      items:
        - title: "Instructions"
          required: true
        - title: "Examples"
          required: true
          constraints:
            length:
              max_lines: 150
        - title: "Requirements"
          required: false
          constraints:
            structure:
              require_list: true
            element:
              list:
                max_items: 10
```
