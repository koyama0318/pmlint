# pmlint Specification

このディレクトリは、pmlint の振る舞いを実装から独立して定義する仕様書群である。すべての実装は本仕様に従う。仕様に記載されていない挙動は未定義とする。
本仕様の目的は、pmlint の動作を決定的かつ再現可能に固定することである。

---

## 仕様構成

| No | Document                        | File                         | Purpose                                          |
|----|---------------------------------|------------------------------|--------------------------------------------------|
| 1  | Language Specification          | 01-language-spec.md          | Markdown 制約、frontmatter、import 構文を定義する     |
| 2  | Prompt IR Specification         | 02-prompt-ir-spec.md         | AST から生成される中間表現（IR）の構造と正規化規則を定義する |
| 3  | Type System Specification       | 03-type-system-spec.md       | type 宣言およびセクション検証ルールを定義する                  |
| 4  | Rule Engine Specification       | 05-rule-engine-spec.md       | ルール評価モデルと組み込みルールを定義する                      |
| 5  | Error & Output Specification    | 06-error-output-spec.md      | エラーコード、JSON 出力形式、終了コードを定義する              |
| 6  | CLI Specification               | 07-cli-spec.md               | CLI 構文、オプション、設定解決順を定義する                 |
| 7  | Test Cases                      | 08-test-cases.md             | 入力と期待出力を固定する実行可能仕様                 |

---

## 仕様の優先順位

1. Error & Output Specification
2. Type System Specification
4. その他仕様

矛盾が生じた場合は、上位の仕様を優先する。

---

## 変更ポリシー

* 仕様変更は必ず明示的な差分として記録する。
* 仕様変更前にテストケースを更新する。
* 仕様未記載の挙動を実装してはならない。
