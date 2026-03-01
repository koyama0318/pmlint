# Error & Output Specification

## 1. Error Code List

- missing-section
- invalid-order
- unknown-section

## 2. Error Object Schema (JSON)

{
file: string,
line?: number,
column?: number,
code: string,
message: string,
severity: "error" | "warning"
}

## 3. Exit Codes

- 0: 成功
- 1: error 存在時

## 4. Text Output Format

例:

error  missing-section  Constraints section is required
