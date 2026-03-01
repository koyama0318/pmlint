# CLI Specification

## 1. Command Syntax

```
pmlint <path>
```

- `<path>`: ファイルパスまたはディレクトリパス（必須）

## 2. Type Resolution (MVP)

MVP では frontmatter を解析しないため、ファイル名（拡張子なし）を type 名として使用する。

例: `prompts/skill.md` → type `skill`

この方式は frontmatter 実装時に置き換える。

## 3. Config Resolution Order

設定ファイル（`.pmlintrc.yml`）の探索順:

1. カレントディレクトリの `.pmlintrc.yml`
2. 親ディレクトリへの再帰探索（ルートに達したら終了）

設定ファイルが見つからない場合はエラーなしで終了する（型検証がスキップされる）。

## 4. File Traversal Rules

- `<path>` がファイルの場合: そのファイルのみを対象とする
- `<path>` がディレクトリの場合: 配下の `.md` ファイルを再帰的に収集する
- ファイルの処理順: ファイルパスの辞書順（ASC）
- 対象拡張子: `.md` のみ
