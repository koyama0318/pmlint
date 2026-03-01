# 設定ファイル

## ファイル

`.pmlintrc.yml`

## 例

```yml
types:
  skill:
    required:
      - Overview
      - Constraints
      - Output
    strictOrder: true
    noExtraSections: true

rules:
  maxSectionLength:
    enabled: true
    value: 800
```
