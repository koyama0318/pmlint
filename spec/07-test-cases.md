# Test Cases (Executable Specification)

共通設定ファイル（`.pmlintrc.yml`）:

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

## 1. Valid Case

### Input

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

### Expected Output

```
(no output)
```

Exit code: `0`

---

## 2. Missing Required Heading

### Input

```markdown
## Instructions

Do X.
```

（`Examples` が欠落）

### Expected Output

```
error  prompts/skill.md  missing-heading  "Examples" heading is required
```

Exit code: `1`

---

## 3. Extra Heading

### Input

```markdown
## Instructions

Do X.

## Examples

- Example A

## Notes

Extra heading.
```

### Expected Output

```
error  prompts/skill.md  extra-heading  "Notes" is not defined in the schema
```

Exit code: `1`

---

## 4. Duplicate Heading

### Input

```markdown
## Instructions

First.

## Instructions

Duplicate.

## Examples

- Example A
```

### Expected Output

```
error  prompts/skill.md  duplicate-heading  "Instructions" appears more than once
```

Exit code: `1`

---

## 5. List Required Violation

### Input

```markdown
## Instructions

Do X.

## Examples

No list here, just text.
```

### Expected Output

```
error  prompts/skill.md  list-required  "Examples" section requires a list
```

Exit code: `1`

---

## 6. List Too Many Items

### Input

```markdown
## Instructions

Do X.

## Examples

- Example A

## Requirements

- A
- B
- C
- D
- E
- F
```

（`Requirements` の max_items: 5 に違反）

### Expected Output

```
error  prompts/skill.md  list-too-many  "Requirements" section exceeds maximum list items (5)
```

Exit code: `1`

---

## 7. Front Matter Line Too Long

### Input

```markdown
---
description: This is an extremely long description that exceeds the 80 character limit set for front matter content.
---

## Instructions

Do X.

## Examples

- Example A
```

### Expected Output

```
error  prompts/skill.md:2  line-too-long  front matter line exceeds 80 characters
```

Exit code: `1`

---

## 8. Boundary Cases

### 8-1. 空ファイル

Input: 空のファイル

Expected: エラーなし、exit 0

### 8-2. front matter なし

Input: front matter なしの Markdown

Expected: front matter 制約をスキップ、他の制約は通常通り適用

### 8-3. 設定ファイルなし

Input: `.pmlintrc.yml` が存在しない

Expected: 検証をスキップ、エラーなし、exit 0

### 8-4. 未対応バージョン

`.pmlintrc.yml` に `version: 99`

Expected:
```
error  .pmlintrc.yml  unsupported-schema-version  schema version 99 is not supported
```
Exit code: `1`

### 8-5. 同名 items

`.pmlintrc.yml` の同一 level に `title: "Instructions"` が2件

Expected:
```
error  .pmlintrc.yml  invalid-config  duplicate title "Instructions" in level2.items
```
Exit code: `1`
