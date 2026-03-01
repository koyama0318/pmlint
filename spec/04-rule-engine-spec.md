# Rule Engine Specification

## 1. Rule Execution Model

実行順序（固定）:

1. パーサー実行 → `PromptIR` 生成（`duplicate-section` はここで生成）
2. 型検証ルール実行（`missing-section`）

## 2. Built-in Rules

### maxSectionLength

> MVP スコープ外（未実装）

## 3. Severity Model

MVP では全エラーを `severity: "error"` として扱う。`warning` は未実装。

## 4. Extensibility

MVP スコープ外。カスタムルールは将来の拡張とする。
