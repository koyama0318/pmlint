import { describe, expect, it } from 'bun:test'
import type { Config } from '../../src/domain/config'
import { parse } from '../../src/parser'
import { validate } from '../../src/rules'

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    version: 1,
    schema: 'test',
    ...overrides
  }
}

describe('document length rules', () => {
  it('doc-too-short: error when totalLineCount < min_lines', () => {
    const content = 'line1\nline2\n'
    const { ir } = parse('f.md', content)
    const config = makeConfig({ constraints: { length: { min_lines: 100 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'doc-too-short')).toBe(true)
  })

  it('doc-too-short: no error when totalLineCount >= min_lines', () => {
    const content = 'line1\nline2\nline3\n'
    const { ir } = parse('f.md', content)
    const config = makeConfig({ constraints: { length: { min_lines: 3 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'doc-too-short')).toBe(false)
  })

  it('doc-too-long: error when totalLineCount > max_lines', () => {
    const content = Array(10).fill('line\n').join('')
    const { ir } = parse('f.md', content)
    const config = makeConfig({ constraints: { length: { max_lines: 3 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'doc-too-long')).toBe(true)
  })

  it('doc-too-long: no error when totalLineCount <= max_lines', () => {
    const content = 'line1\nline2\n'
    const { ir } = parse('f.md', content)
    const config = makeConfig({ constraints: { length: { max_lines: 300 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'doc-too-long')).toBe(false)
  })
})
