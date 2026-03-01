import yaml from 'js-yaml'
import type { Heading, List, Node, Root, RootContent } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import type { LintError } from './domain/error'
import type { ContentIR, FrontMatterIR, HeadingIR, ListIR, PromptIR } from './domain/ir'

function extractHeadingText(node: Heading): string {
  return node.children
    .map(c => ('value' in c ? (c.value as string) : ''))
    .join('')
    .trim()
}

function detectListMarker(node: List, allLines: string[]): '-' | '*' | '+' | null {
  const lineIndex = (node.position?.start.line ?? 1) - 1
  const line = allLines[lineIndex] ?? ''
  const trimmed = line.trimStart()
  if (trimmed.startsWith('- ')) return '-'
  if (trimmed.startsWith('* ')) return '*'
  if (trimmed.startsWith('+ ')) return '+'
  return null
}

function hasEmphasisInNodes(nodes: RootContent[]): boolean {
  let found = false
  const root: Root = { type: 'root', children: nodes }
  visit(root as Node, (node: Node) => {
    if (node.type === 'emphasis' || node.type === 'strong') found = true
  })
  return found
}

function buildContentIR(nodes: RootContent[], allLines: string[]): ContentIR {
  if (nodes.length === 0) {
    return {
      lineCount: 0,
      lines: [],
      hasEmptyLines: false,
      maxLineLength: 0,
      isEmpty: true,
      lists: [],
      hasCodeBlock: false,
      hasEmphasis: false
    }
  }

  const startLine = (nodes[0].position?.start.line ?? 1) - 1
  const endLine = (nodes[nodes.length - 1].position?.end.line ?? 1) - 1
  const lines = allLines.slice(startLine, endLine + 1)

  const lists: ListIR[] = []
  for (const node of nodes) {
    if (node.type === 'list' && !(node as List).ordered) {
      const marker = detectListMarker(node as List, allLines)
      if (marker) {
        lists.push({ marker, itemCount: (node as List).children.length })
      }
    }
  }

  return {
    lineCount: lines.length,
    lines,
    hasEmptyLines: lines.some(l => l.trim() === ''),
    maxLineLength: Math.max(0, ...lines.map(l => l.length)),
    isEmpty: lines.length === 0 || lines.every(l => l.trim() === ''),
    lists,
    hasCodeBlock: nodes.some(n => n.type === 'code'),
    hasEmphasis: hasEmphasisInNodes(nodes)
  }
}

// Stack-based tree builder: supports any root heading level (H1, H2, etc.)
function buildTree(nodes: RootContent[], counter: { n: number }, allLines: string[]): HeadingIR[] {
  const roots: HeadingIR[] = []
  const stack: Array<{ heading: HeadingIR; directNodes: RootContent[] }> = []

  const flushTop = () => {
    if (stack.length === 0) return
    const top = stack[stack.length - 1]
    top.heading.content = buildContentIR(top.directNodes, allLines)
  }

  for (const node of nodes) {
    if (node.type === 'heading') {
      const depth = (node as Heading).depth
      if (depth < 1 || depth > 4) continue

      // Pop entries whose level is >= current depth (they end here)
      while (stack.length > 0 && stack[stack.length - 1].heading.level >= depth) {
        flushTop()
        stack.pop()
      }

      const heading: HeadingIR = {
        level: depth as 1 | 2 | 3 | 4,
        title: extractHeadingText(node as Heading),
        globalOrder: counter.n++,
        content: buildContentIR([], allLines), // filled when popped
        children: []
      }

      if (stack.length === 0) {
        roots.push(heading)
      } else {
        stack[stack.length - 1].heading.children.push(heading)
      }

      stack.push({ heading, directNodes: [] })
    } else {
      // Non-heading: goes to direct content of current heading
      if (stack.length > 0) {
        stack[stack.length - 1].directNodes.push(node)
      }
    }
  }

  // Flush remaining stack
  while (stack.length > 0) {
    flushTop()
    stack.pop()
  }

  return roots
}

export function parse(filePath: string, content: string): { ir: PromptIR; errors: LintError[] } {
  const allLines = content.split('\n')
  const errors: LintError[] = []

  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])
  const ast = processor.parse(content) as Root

  // Extract front matter
  let frontMatter: FrontMatterIR | null = null
  type YamlNode = Node & { value: string; position?: { start: { line: number } } }
  const yamlNode = ast.children.find(n => n.type === 'yaml') as YamlNode | undefined

  if (yamlNode) {
    try {
      const fields = (yaml.load(yamlNode.value) as Record<string, unknown>) ?? {}
      const raw = yamlNode.value
      const startLine = (yamlNode.position?.start.line ?? 1) + 1
      frontMatter = { raw, lines: raw.split('\n'), fields, startLine }
    } catch {
      errors.push({
        file: filePath,
        line: yamlNode.position?.start.line,
        code: 'parse-error',
        message: 'failed to parse front matter YAML',
        severity: 'error'
      })
    }
  }

  const nonYamlNodes = ast.children.filter(n => n.type !== 'yaml')
  const counter = { n: 0 }
  const headings = buildTree(nonYamlNodes, counter, allLines)

  return {
    ir: { filePath, totalLineCount: allLines.length, frontMatter, headings },
    errors
  }
}
