# Prompt IR Specification

## 1. Purpose

remark によって生成された AST から変換される中間表現（IR）を定義する。
IR はパーサーとルールエンジンの間のインターフェースであり、型定義を変更することで実装を置き換え可能にする。

## 2. IR Structure

```typescript
interface PromptIR {
  filePath: string
  frontMatter: FrontMatterIR | null
  headings: HeadingIR[]          // トップレベル（H1）の一覧
}

interface FrontMatterIR {
  raw: string                    // 元の YAML 文字列
  fields: Record<string, unknown> // パース済みのキーバリュー
}

interface HeadingIR {
  level: 1 | 2 | 3 | 4
  title: string                  // 見出しテキスト（前後トリム済み）
  globalOrder: number            // ドキュメント全体での出現順（0-based）
  content: ContentIR
  children: HeadingIR[]         // 直属の下位見出し
}

interface ContentIR {
  lineCount: number              // 本文の行数（下位見出しを除く）
  lines: string[]                // 本文の各行（下位見出しを除く）
  hasEmptyLines: boolean
  maxLineLength: number          // 最長行の文字数
  isEmpty: boolean               // 行数が 0、またはすべて空行
  lists: ListIR[]                // 検出されたリストの一覧
  hasCodeBlock: boolean
  hasEmphasis: boolean
}

interface ListIR {
  marker: '-' | '*' | '+'
  itemCount: number
}
```

## 3. Normalization Rules

- `HeadingIR.title` は前後の空白をトリムする
- `HeadingIR.children` には直属の下位レベル見出しのみを含む（孫以下は再帰的にネスト）
- `ContentIR.lines` には下位見出し行およびその本文を含めない
- `ContentIR.isEmpty` は `lineCount === 0` または全行が空白のみの場合 `true`

## 4. Determinism Requirements

- 同一入力は常に同一 IR を生成すること
- ディレクトリ走査時のファイル処理順: ファイルパスの辞書順（ASC）
