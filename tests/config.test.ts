import { describe, expect, it } from 'bun:test'
import { parseConfig } from '../src/config'

const VALID_CONFIG = `
version: 1
schema: test_schema

constraints:
  length:
    max_lines: 300
  element:
    text:
      max_length_per_line: 100
    code_block:
      allowed: true

markdown:
  constraints:
    no_duplicate_headings: true
    allow_additional_headings: false
  headings:
    level2:
      required: true
      items:
        - title: "Instructions"
          required: true
        - title: "Examples"
          required: true
          constraints:
            structure:
              require_list: true
`

describe('parseConfig()', () => {
  it('parses a valid config without errors', () => {
    const { config, errors } = parseConfig(VALID_CONFIG, '.pmlintrc.yml')
    expect(errors).toHaveLength(0)
    expect(config).not.toBeNull()
    expect(config?.version).toBe(1)
  })

  it('returns constraints correctly', () => {
    const { config } = parseConfig(VALID_CONFIG, '.pmlintrc.yml')
    expect(config?.constraints?.length?.max_lines).toBe(300)
    expect(config?.constraints?.element?.text?.max_length_per_line).toBe(100)
  })

  it('returns level2 items correctly', () => {
    const { config } = parseConfig(VALID_CONFIG, '.pmlintrc.yml')
    const items = config?.markdown?.headings?.level2?.items
    expect(items).toHaveLength(2)
    expect(items?.[0].title).toBe('Instructions')
    expect(items?.[1].title).toBe('Examples')
    expect(items?.[1].constraints?.structure?.require_list).toBe(true)
  })

  it('returns unsupported-schema-version error for unknown version', () => {
    const raw = 'version: 99\nschema: test\n'
    const { config, errors } = parseConfig(raw, '.pmlintrc.yml')
    expect(config).toBeNull()
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('unsupported-schema-version')
    expect(errors[0].severity).toBe('error')
  })

  it('returns invalid-config for duplicate item titles in same level', () => {
    const raw = `
version: 1
schema: test
markdown:
  headings:
    level2:
      items:
        - title: "Instructions"
        - title: "Instructions"
`
    const { config, errors } = parseConfig(raw, '.pmlintrc.yml')
    expect(config).toBeNull()
    expect(errors.some(e => e.code === 'invalid-config')).toBe(true)
    expect(errors[0].message).toContain('Instructions')
    expect(errors[0].message).toContain('level2')
  })

  it('duplicate titles in different levels are allowed', () => {
    const raw = `
version: 1
schema: test
markdown:
  headings:
    level2:
      items:
        - title: "Notes"
    level3:
      items:
        - title: "Notes"
`
    const { config, errors } = parseConfig(raw, '.pmlintrc.yml')
    expect(errors).toHaveLength(0)
    expect(config).not.toBeNull()
  })
})
