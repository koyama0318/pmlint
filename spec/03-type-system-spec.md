# Type System Specification

## 1. Type Definition Structure (.pmlintrc.yml)

```yml
types:
  <type-name>:
    required:
      - <section-name>
      - ...
```

- `required`: 必須セクション名のリスト。省略時は空リストとして扱う

## 2. Validation Rules

### Required Section Rule

判定条件: `PromptIR.sections` の `name` 一覧に、`required` の各要素が含まれているかを確認する。
含まれていないセクションごとに `missing-section` エラーを生成する。
