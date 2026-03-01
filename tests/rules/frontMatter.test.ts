import { describe, expect, it } from 'bun:test'
import type { Config } from '../../src/domain/config'
import { parse } from '../../src/parser'
import { validate } from '../../src/rules'

describe('front matter line-too-long', () => {
  const longLine = `description: ${'x'.repeat(70)}`

  it('reports line-too-long with line number when front matter line exceeds limit', () => {
    const md = `---\n${longLine}\n---\n\n## Instructions\n\nDo X.\n`
    const { ir } = parse('f.md', md)
    const config: Config = {
      version: 1,
      schema: 'test',
      front_matter: { constraints: { element: { text: { max_length_per_line: 80 } } } }
    }
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'line-too-long' && e.line != null)).toBe(true)
  })

  it('no error when front matter line is within limit', () => {
    const md = '---\ntype: skill\n---\n\n## Instructions\n\nDo X.\n'
    const { ir } = parse('f.md', md)
    const config: Config = {
      version: 1,
      schema: 'test',
      front_matter: { constraints: { element: { text: { max_length_per_line: 80 } } } }
    }
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'line-too-long')).toBe(false)
  })

  it('skips front matter validation when no front matter present', () => {
    const { ir } = parse('f.md', '## Instructions\n\nDo X.\n')
    const config: Config = {
      version: 1,
      schema: 'test',
      front_matter: { constraints: { element: { text: { max_length_per_line: 1 } } } }
    }
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'line-too-long')).toBe(false)
  })
})
