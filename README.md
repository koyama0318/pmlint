# pmlint

**pmlint** は、Markdown で書かれたプロンプトを静的にチェックする CLI ツールです。

プロンプトをただの自由なテキストとして扱うのではなく、あらかじめ決められた構造を持つ「設計されたドキュメント」として扱います。
セクションの不足や順序のズレ、許可されていない見出しなどを機械的に検出します。

pmlint は意味の良し悪しを評価しません。
あくまで「構造が正しいかどうか」だけを検証します。

## ルール

[rules.md](./docs/rules.md)

## 設定ファイル

[setting.md](./docs/setting.md)

## インストール

```bash
brew install pmlint
```

## 使い方

### 単一ファイルの検証

```bash
pmlint path/to/prompt.md
```

### ディレクトリ全体の検証

```bash
pmlint prompts/
```
