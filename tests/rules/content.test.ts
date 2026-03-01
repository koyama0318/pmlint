import { describe, expect, it } from 'bun:test'
import type { Config } from '../../src/domain/config'
import { parse } from '../../src/parser'
import { validate } from '../../src/rules'

function makeItemConfig(title: string, constraints: object): Config {
  return {
    version: 1,
    schema: 'test',
    markdown: {
      headings: {
        level2: { items: [{ title, constraints }] }
      }
    }
  }
}

describe('section-too-short / section-too-long', () => {
  it('section-too-short: error when content lines < min_lines', () => {
    const { ir } = parse('f.md', '## A\n\nOne line.\n')
    const config = makeItemConfig('A', { length: { min_lines: 5 } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'section-too-short')).toBe(true)
  })

  it('section-too-long: error when content lines > max_lines', () => {
    const content = `## A\n\n${Array(10).fill('line\n').join('')}`
    const { ir } = parse('f.md', content)
    const config = makeItemConfig('A', { length: { max_lines: 3 } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'section-too-long')).toBe(true)
  })
})

describe('empty-line-not-allowed', () => {
  it('reports error when content has empty lines and allow_empty_lines: false', () => {
    const { ir } = parse('f.md', '## A\n\nLine1.\n\nLine2.\n')
    const config = makeItemConfig('A', { length: { allow_empty_lines: false } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'empty-line-not-allowed')).toBe(true)
  })

  it('no error when allow_empty_lines is not set', () => {
    const { ir } = parse('f.md', '## A\n\nLine1.\n\nLine2.\n')
    const config = makeItemConfig('A', {})
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'empty-line-not-allowed')).toBe(false)
  })
})

describe('line-too-long', () => {
  it('reports error when a line exceeds max_length_per_line', () => {
    const { ir } = parse('f.md', `## A\n\n${'x'.repeat(101)}\n`)
    const config = makeItemConfig('A', { element: { text: { max_length_per_line: 100 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'line-too-long')).toBe(true)
  })

  it('no error when all lines are within limit', () => {
    const { ir } = parse('f.md', '## A\n\nShort line.\n')
    const config = makeItemConfig('A', { element: { text: { max_length_per_line: 100 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'line-too-long')).toBe(false)
  })
})

describe('empty-content', () => {
  it('reports error when content is empty and allow_empty: false', () => {
    const { ir } = parse('f.md', '## A\n\n## B\n')
    const config = makeItemConfig('A', { element: { text: { allow_empty: false } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'empty-content')).toBe(true)
  })
})

describe('list-required', () => {
  it('reports error when section has no list and require_list: true', () => {
    const { ir } = parse('f.md', '## Examples\n\nJust text, no list.\n')
    const config = makeItemConfig('Examples', { structure: { require_list: true } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-required')).toBe(true)
  })

  it('no error when list is present', () => {
    const { ir } = parse('f.md', '## Examples\n\n- item\n')
    const config = makeItemConfig('Examples', { structure: { require_list: true } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-required')).toBe(false)
  })
})

describe('invalid-list-marker', () => {
  it('reports error when list marker differs from required_marker', () => {
    const { ir } = parse('f.md', '## A\n\n* item\n')
    const config = makeItemConfig('A', { element: { list: { required_marker: '-' } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'invalid-list-marker')).toBe(true)
  })

  it('no error when list marker matches required_marker', () => {
    const { ir } = parse('f.md', '## A\n\n- item\n')
    const config = makeItemConfig('A', { element: { list: { required_marker: '-' } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'invalid-list-marker')).toBe(false)
  })
})

describe('list-too-few / list-too-many', () => {
  it('list-too-few: error when total items < min_items', () => {
    const { ir } = parse('f.md', '## A\n\n- item\n')
    const config = makeItemConfig('A', { element: { list: { min_items: 3 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-too-few')).toBe(true)
  })

  it('list-too-many: error when total items > max_items', () => {
    const { ir } = parse('f.md', '## A\n\n- a\n- b\n- c\n- d\n- e\n- f\n')
    const config = makeItemConfig('A', { element: { list: { max_items: 5 } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-too-many')).toBe(true)
  })
})

describe('code-block-not-allowed', () => {
  it('reports error when code block present and allowed: false', () => {
    const { ir } = parse('f.md', '## A\n\n```\ncode\n```\n')
    const config = makeItemConfig('A', { element: { code_block: { allowed: false } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'code-block-not-allowed')).toBe(true)
  })

  it('no error when code block present and allowed: true', () => {
    const { ir } = parse('f.md', '## A\n\n```\ncode\n```\n')
    const config = makeItemConfig('A', { element: { code_block: { allowed: true } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'code-block-not-allowed')).toBe(false)
  })
})

describe('emphasis-not-allowed', () => {
  it('reports error for italic when allowed: false', () => {
    const { ir } = parse('f.md', '## A\n\nSome *italic* text.\n')
    const config = makeItemConfig('A', { element: { emphasis: { allowed: false } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'emphasis-not-allowed')).toBe(true)
  })

  it('reports error for bold when allowed: false', () => {
    const { ir } = parse('f.md', '## A\n\nSome **bold** text.\n')
    const config = makeItemConfig('A', { element: { emphasis: { allowed: false } } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'emphasis-not-allowed')).toBe(true)
  })
})

describe('subheading-not-allowed', () => {
  it('reports error when sub-headings present and allow_subheadings: false', () => {
    const { ir } = parse('f.md', '## A\n\nText.\n\n### Child\n\nInner.\n')
    const config = makeItemConfig('A', { structure: { allow_subheadings: false } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'subheading-not-allowed')).toBe(true)
  })

  it('no error when no sub-headings', () => {
    const { ir } = parse('f.md', '## A\n\nText.\n')
    const config = makeItemConfig('A', { structure: { allow_subheadings: false } })
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'subheading-not-allowed')).toBe(false)
  })
})

describe('constraint inheritance (document → level → item)', () => {
  it('item constraint overrides level constraint', () => {
    const config: Config = {
      version: 1,
      schema: 'test',
      markdown: {
        headings: {
          level2: {
            constraints: { element: { list: { max_items: 10 } } },
            items: [{ title: 'A', constraints: { element: { list: { max_items: 2 } } } }]
          }
        }
      }
    }
    // 3 items → violates item-level max_items: 2, but not level max_items: 10
    const { ir } = parse('f.md', '## A\n\n- x\n- y\n- z\n')
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-too-many')).toBe(true)
  })

  it('level constraint applies when no item constraint', () => {
    const config: Config = {
      version: 1,
      schema: 'test',
      markdown: {
        headings: {
          level2: {
            constraints: { element: { list: { max_items: 2 } } },
            items: [{ title: 'A' }]
          }
        }
      }
    }
    const { ir } = parse('f.md', '## A\n\n- x\n- y\n- z\n')
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-too-many')).toBe(true)
  })

  it('document constraint applies when no level or item constraint', () => {
    const config: Config = {
      version: 1,
      schema: 'test',
      constraints: { element: { list: { max_items: 2 } } }
    }
    const { ir } = parse('f.md', '## A\n\n- x\n- y\n- z\n')
    const errors = validate(ir, config)
    expect(errors.some(e => e.code === 'list-too-many')).toBe(true)
  })
})
