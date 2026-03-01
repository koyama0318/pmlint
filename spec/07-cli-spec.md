# CLI Specification

## 1. Command Syntax

pmlint <path> [options]

## 2. Options

--format json
--config path

## 3. Config Resolution Order

1. 明示指定
2. カレントディレクトリ
3. 上位ディレクトリ探索

## 4. File Traversal Rules

- ディレクトリ再帰の有無
- ファイル拡張子フィルタ
- 並び順の決定方法
