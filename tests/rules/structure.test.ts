import { describe, expect, it } from 'bun:test'
import type { Config } from '../../src/domain/config'
import { parse } from '../../src/parser'
import { validate } from '../../src/rules'

const BASE_CONFIG: Config = {
  version: 1,
  schema: 'test',
  markdown: {
    constraints: {
      no_duplicate_headings: true,
      allow_additional_headings: false
    },
    headings: {
      level2: {
        required: true,
        items: [
          { title: 'Instructions', required: true },
          {
            title: 'Examples',
            required: true,
            constraints: { structure: { require_list: true } }
          }
        ]
      }
    }
  }
}

describe('duplicate-heading', () => {
  it('reports error when same-level heading appears twice', () => {
    const md = '## Instructions\n\nFirst.\n\n## Instructions\n\nDuplicate.\n\n## Examples\n\n- A\n'
    const { ir } = parse('f.md', md)
    const errors = validate(ir, BASE_CONFIG)
    expect(errors.some(e => e.code === 'duplicate-heading')).toBe(true)
  })

  it('no error for unique headings', () => {
    const md = '## Instructions\n\nDo X.\n\n## Examples\n\n- A\n'
    const { ir } = parse('f.md', md)
    const errors = validate(ir, BASE_CONFIG)
    expect(errors.some(e => e.code === 'duplicate-heading')).toBe(false)
  })

  it('no error when no_duplicate_headings is not set', () => {
    const md = '## A\n\n## A\n'
    const { ir } = parse('f.md', md)
    const config: Config = { version: 1, schema: 'test' }
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'duplicate-heading')).toBe(false)
  })
})

describe('missing-heading', () => {
  it('reports error for missing required item', () => {
    const md = '## Instructions\n\nDo X.\n'
    const { ir } = parse('f.md', md)
    const errors = validate(ir, BASE_CONFIG)
    expect(errors.some(e => e.code === 'missing-heading' && e.message.includes('Examples'))).toBe(
      true
    )
  })

  it('reports error when level has required:true but no headings of that level', () => {
    const config: Config = {
      version: 1,
      schema: 'test',
      markdown: { headings: { level2: { required: true } } }
    }
    const { ir } = parse('f.md', '# Only H1\n\nNo H2 here.\n')
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'missing-heading')).toBe(true)
  })

  it('no error when all required headings are present', () => {
    const md = '## Instructions\n\nDo X.\n\n## Examples\n\n- A\n'
    const { ir } = parse('f.md', md)
    const errors = validate(ir, BASE_CONFIG)
    expect(errors.some(e => e.code === 'missing-heading')).toBe(false)
  })
})

describe('extra-heading', () => {
  it('reports error for heading not in schema', () => {
    const md = '## Instructions\n\nDo X.\n\n## Examples\n\n- A\n\n## Notes\n\nExtra heading.\n'
    const { ir } = parse('f.md', md)
    const errors = validate(ir, BASE_CONFIG)
    expect(errors.some(e => e.code === 'extra-heading' && e.message.includes('Notes'))).toBe(true)
  })

  it('no error when allow_additional_headings is true', () => {
    const config: Config = {
      ...BASE_CONFIG,
      markdown: {
        ...BASE_CONFIG.markdown,
        constraints: { ...BASE_CONFIG.markdown?.constraints, allow_additional_headings: true }
      }
    }
    const md = '## Instructions\n\nDo X.\n\n## Examples\n\n- A\n\n## Notes\n\nExtra heading.\n'
    const { ir } = parse('f.md', md)
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'extra-heading')).toBe(false)
  })
})
