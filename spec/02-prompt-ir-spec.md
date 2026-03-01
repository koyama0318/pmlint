# Prompt IR Specification

## 1. Purpose

AST から生成される中間表現を定義する。

## 2. IR Structure

TypeScript 型定義例:

interface PromptIR {
filePath: string
type: string
sections: SectionIR[]
}

interface SectionIR {
name: string
order: number
content: string
}

## 3. Normalization Rules

- セクション順序の保持方法
- 重複処理方法

## 4. Determinism Requirements

- 同一入力は常に同一 IR を生成すること
- ファイル走査順の固定方法
