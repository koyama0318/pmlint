---
name: e2e-test
description: pmlint の E2E テストを追加・実行するときに使う。フィクスチャファイルの作成、テストコードの追加、テスト実行手順を案内する。
---

# E2E Test Strategy

## Instructions

pmlint のテストは **E2E テスト** として位置づける。CLI の入出力を通じて検証する。

### 基本方針

- テスト入力は `tests/fixtures/inputs/` 以下のファイル
- 期待値はテストコード内にインラインで記述する（スナップショットファイルは使わない）
- テストケース数は最小限に保つ。バリエーションより境界を重視する
- フィクスチャファイルは連番プレフィックスで命名する（`01-valid.md`, `02-missing-heading.md`）

### ディレクトリ構成

```
tests/
  fixtures/
    configs/
      base.yml          # テスト共通設定
    inputs/
      01-valid.md
      02-missing-heading.md
      ...
  parser.test.ts
  validator.test.ts
  reporter.test.ts
  config.test.ts
  cli.test.ts
```

### テスト分類

| レイヤー | ファイル | テスト対象関数 |
|---|---|---|
| 単体 | `parser.test.ts` | `parse()` |
| 単体 | `validator.test.ts` | `validate()` |
| 単体 | `reporter.test.ts` | `formatText()` |
| 単体 | `config.test.ts` | `parseConfig()` |
| 統合 | `cli.test.ts` | `run()` (exit code + stdout) |

### 期待値の書き方

```ts
// LintError の期待値はインラインで記述する
expect(errors).toEqual([{
  file: 'skill.md',
  code: 'missing-section',
  message: '"Examples" section is required',
  severity: 'error'
}])

// CLI 統合テストでは run() の戻り値と stdout を検証する
const { exitCode, stdout } = runCli(['tests/fixtures/inputs/02-missing-heading.md'])
expect(exitCode).toBe(1)
expect(stdout).toContain('missing-heading')
```

### テスト追加手順

1. `spec/07-test-cases.md` でテストケースを定義する
2. `tests/fixtures/inputs/NN-description.md` にフィクスチャファイルを作成する
3. 対応する `*.test.ts` にテストを追加する
4. `bun test` で全テストが通ることを確認する

## Examples

### フィクスチャファイルの例

```markdown
<!-- tests/fixtures/inputs/02-missing-heading.md -->
## Instructions

Do X.

<!-- Examples セクションを意図的に省略 -->
```

### テストコードの例

```ts
import { test, expect } from 'bun:test'
import { parse } from '../src/parser'

test('02: missing required section', async () => {
  const input = await Bun.file('tests/fixtures/inputs/02-missing-heading.md').text()
  const { errors } = parse('skill.md', input)
  expect(errors[0]?.code).toBe('missing-section')
})
```

## Requirements

- フィクスチャファイルは `tests/fixtures/inputs/NN-*.md` の命名規則に従う
- 1テストケース = 1フィクスチャファイルとする
- 期待値はインライン記述。スナップショットファイルは作らない
- テスト実行は `bun test`
