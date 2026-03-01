# Prompt IR Specification

## 1. Purpose

AST から生成される中間表現（IR）を定義する。IR はパーサーとルールエンジンの間のインターフェースである。

## 2. IR Structure

```typescript
interface PromptIR {
  filePath: string   // 解析対象ファイルの絶対パス
  sections: SectionIR[]
}

interface SectionIR {
  name: string    // セクション名（`##` 以降のテキストをトリムしたもの）
  order: number   // ファイル内での出現順（0-based）
  content: string // セクション本文（見出し行を含まない）
}
```

## 3. Normalization Rules

- セクション順序の保持方法: ファイル内の出現順を `order` フィールドに格納する。順序は変更しない
- 重複処理方法: 重複セクションは IR に含めない。パーサーが `duplicate-section` エラーを生成する

## 4. Determinism Requirements

- 同一入力は常に同一 IR を生成すること
- ファイル走査順の固定方法: ディレクトリ走査時はファイルパスの辞書順（ASC）で処理する
