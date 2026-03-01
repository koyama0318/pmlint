# Test Cases (Executable Specification)

フィクスチャファイルは `tests/fixtures/inputs/` に連番で配置する。

共通設定ファイル（`tests/fixtures/configs/base.yml`）:

```yaml
version: 1
schema: test_schema

constraints:
  length:
    max_lines: 300
  element:
    text:
      max_length_per_line: 100
    code_block:
      allowed: true

front_matter:
  constraints:
    element:
      text:
        max_length_per_line: 80

markdown:
  constraints:
    no_duplicate_headings: true
    allow_additional_headings: false

  headings:
    level2:
      required: true
      items:
        - title: "Instructions"
          required: true
        - title: "Examples"
          required: true
          constraints:
            structure:
              require_list: true
        - title: "Requirements"
          required: false
          constraints:
            element:
              list:
                max_items: 5
```

---

## Valid Cases

| # | Fixture | 概要 | Exit code |
|---|---------|------|-----------|
| 01 | `01-valid.md` | 必須セクションがすべて揃っている | `0` |

**`01-valid.md`**:
```markdown
---
type: skill
---

## Instructions

Do X.

## Examples

- Example A
- Example B
```

---

## Heading Errors

| # | Fixture | Error code | Expected message | Exit code |
|---|---------|------------|-----------------|-----------|
| 02 | `02-missing-heading.md` | `missing-heading` | `"Examples" heading is required` | `1` |
| 03 | `03-extra-heading.md` | `extra-heading` | `"Notes" is not defined in the schema` | `1` |
| 04 | `04-duplicate-heading.md` | `duplicate-heading` | `"Instructions" appears more than once` | `1` |

**`02-missing-heading.md`**: `Examples` セクションを省略

**`03-extra-heading.md`**: `Instructions`, `Examples`, `Notes`（スキーマ未定義）を含む

**`04-duplicate-heading.md`**: `Instructions` を2回含む

---

## Content Constraint Errors

| # | Fixture | Error code | Expected message | Exit code |
|---|---------|------------|-----------------|-----------|
| 05 | `05-list-required.md` | `list-required` | `"Examples" section requires a list` | `1` |
| 06 | `06-list-too-many.md` | `list-too-many` | `"Requirements" section exceeds maximum list items (5)` | `1` |
| 07 | `07-front-matter-line-too-long.md` | `line-too-long` | `front matter line exceeds 80 characters` | `1` |

**`05-list-required.md`**: `Examples` セクションにリストではなく文章を含む

**`06-list-too-many.md`**: `Requirements` セクションにリストアイテムを6件含む（max: 5）

**`07-front-matter-line-too-long.md`**: front matter に80文字を超える行を含む

---

## Config / Boundary Errors

| # | Fixture | Error code | Expected message | Exit code |
|---|---------|------------|-----------------|-----------|
| 08 | `08-empty.md`（空ファイル） | — | no output | `0` |
| 09 | `09-no-front-matter.md` | — | front matter 制約をスキップ、他は通常適用 | `0` |
| 10 | `.pmlintrc.yml` なし | — | 検証をスキップ | `0` |
| 11 | config に `version: 99` | `unsupported-schema-version` | `schema version 99 is not supported` | `1` |
| 12 | config に `title: "Instructions"` が重複 | `invalid-config` | `duplicate title "Instructions" in level2.items` | `1` |

ケース 10〜12 は設定ファイル起因のため、入力 Markdown ではなく `.pmlintrc.yml` の内容が変数となる。
