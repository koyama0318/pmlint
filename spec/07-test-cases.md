# Test Cases (Executable Specification)

設定ファイル（共通）:

```yaml
types:
  skill:
    required:
      - Overview
      - Constraints
      - Output
```

---

## 1. Valid Case

### Input

```markdown
## Overview

This skill does X.

## Constraints

- Must not do Y.

## Output

Returns Z.
```

### Expected Output

```
(no output)
```

Exit code: `0`

---

## 2. Missing Section Case

### Input

```markdown
## Overview

This skill does X.

## Output

Returns Z.
```

### Expected Output (text)

```
error  prompts/skill.md  missing-section  "Constraints" section is required
```

Exit code: `1`

---

## 3. Boundary Cases

### 3-1. 空ファイル

Input: 空のファイル

Expected: エラーなし、exit 0

### 3-2. 重複セクション

Input: `## Overview` が2回出現

Expected:
```
error  prompts/skill.md  duplicate-section  "Overview" section appears more than once
```
Exit code: `1`
