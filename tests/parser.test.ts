import { describe, expect, it } from 'bun:test'
import { parse } from '../src/parser'

describe('parse()', () => {
  describe('empty input', () => {
    it('returns empty headings for empty file', () => {
      const { ir, errors } = parse('f.md', '')
      expect(errors).toHaveLength(0)
      expect(ir.headings).toHaveLength(0)
      expect(ir.frontMatter).toBeNull()
      expect(ir.totalLineCount).toBe(1)
    })
  })

  describe('front matter', () => {
    it('parses front matter fields', () => {
      const { ir, errors } = parse('f.md', '---\ntype: skill\n---\n\n## Instructions\n\nDo X.\n')
      expect(errors).toHaveLength(0)
      expect(ir.frontMatter).not.toBeNull()
      expect(ir.frontMatter?.fields['type']).toBe('skill')
    })

    it('reports parse-error for invalid YAML front matter', () => {
      const { errors } = parse('f.md', '---\n: bad: yaml: :\n---\n')
      expect(errors.some(e => e.code === 'parse-error')).toBe(true)
    })

    it('returns null frontMatter when absent', () => {
      const { ir } = parse('f.md', '## Instructions\n\nDo X.\n')
      expect(ir.frontMatter).toBeNull()
    })
  })

  describe('heading tree', () => {
    it('parses H2-only file (no H1 parent)', () => {
      const { ir } = parse('f.md', '## Instructions\n\nDo X.\n\n## Examples\n\n- A\n')
      expect(ir.headings).toHaveLength(2)
      expect(ir.headings[0].title).toBe('Instructions')
      expect(ir.headings[1].title).toBe('Examples')
    })

    it('builds nested H2/H3 tree', () => {
      const md = '## Parent\n\nText.\n\n### Child\n\nInner.\n'
      const { ir } = parse('f.md', md)
      expect(ir.headings).toHaveLength(1)
      expect(ir.headings[0].children).toHaveLength(1)
      expect(ir.headings[0].children[0].title).toBe('Child')
    })

    it('assigns globalOrder in document order', () => {
      const { ir } = parse('f.md', '## A\n\n## B\n\n## C\n')
      expect(ir.headings.map(h => h.globalOrder)).toEqual([0, 1, 2])
    })

    it('assigns correct heading levels', () => {
      const { ir } = parse('f.md', '# H1\n\n## H2\n\n### H3\n')
      expect(ir.headings[0].level).toBe(1)
      expect(ir.headings[0].children[0].level).toBe(2)
      expect(ir.headings[0].children[0].children[0].level).toBe(3)
    })
  })

  describe('ContentIR', () => {
    it('counts content lines (excluding sub-headings and surrounding blank lines)', () => {
      const md = '## Parent\n\nLine1.\nLine2.\n\n### Child\n\nInner.\n'
      const { ir } = parse('f.md', md)
      // remark AST: paragraph "Line1.\nLine2." spans lines 3-4 (1-based)
      // ContentIR slices from first node start to last node end → 2 lines
      // Blank lines before the first node / after the last node are not included
      expect(ir.headings[0].content.lineCount).toBe(2)
    })

    it('detects hasEmptyLines', () => {
      const { ir } = parse('f.md', '## A\n\nLine1.\n\nLine2.\n')
      expect(ir.headings[0].content.hasEmptyLines).toBe(true)
    })

    it('detects isEmpty for blank-only content', () => {
      const { ir } = parse('f.md', '## A\n\n## B\n')
      // A has only the empty line between headings
      expect(ir.headings[0].content.isEmpty).toBe(true)
    })

    it('detects list with correct marker', () => {
      const { ir } = parse('f.md', '## A\n\n- item1\n- item2\n')
      expect(ir.headings[0].content.lists).toHaveLength(1)
      expect(ir.headings[0].content.lists[0].marker).toBe('-')
      expect(ir.headings[0].content.lists[0].itemCount).toBe(2)
    })

    it('detects * list marker', () => {
      const { ir } = parse('f.md', '## A\n\n* item1\n* item2\n')
      expect(ir.headings[0].content.lists[0].marker).toBe('*')
    })

    it('detects hasCodeBlock', () => {
      const { ir } = parse('f.md', '## A\n\n```\ncode\n```\n')
      expect(ir.headings[0].content.hasCodeBlock).toBe(true)
    })

    it('detects hasEmphasis (italic)', () => {
      const { ir } = parse('f.md', '## A\n\nSome *italic* text.\n')
      expect(ir.headings[0].content.hasEmphasis).toBe(true)
    })

    it('detects hasEmphasis (bold)', () => {
      const { ir } = parse('f.md', '## A\n\nSome **bold** text.\n')
      expect(ir.headings[0].content.hasEmphasis).toBe(true)
    })

    it('sets maxLineLength correctly', () => {
      const { ir } = parse('f.md', '## A\n\nshort\nthis is longer\n')
      expect(ir.headings[0].content.maxLineLength).toBe(14)
    })
  })

  describe('totalLineCount', () => {
    it('counts all lines including front matter', () => {
      const content = '---\ntype: skill\n---\n\n## Instructions\n\nDo X.\n'
      const { ir } = parse('f.md', content)
      expect(ir.totalLineCount).toBe(content.split('\n').length)
    })
  })
})
