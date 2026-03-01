export interface FrontMatterIR {
  raw: string
  lines: string[]
  fields: Record<string, unknown>
  startLine: number // 1-based document line of the first YAML content line
}

export interface ListIR {
  marker: '-' | '*' | '+'
  itemCount: number
}

export interface ContentIR {
  lineCount: number
  lines: string[]
  hasEmptyLines: boolean
  maxLineLength: number
  isEmpty: boolean
  lists: ListIR[]
  hasCodeBlock: boolean
  hasEmphasis: boolean
}

export interface HeadingIR {
  level: 1 | 2 | 3 | 4
  title: string
  globalOrder: number
  content: ContentIR
  children: HeadingIR[]
}

export interface PromptIR {
  filePath: string
  totalLineCount: number
  frontMatter: FrontMatterIR | null
  headings: HeadingIR[]
}
