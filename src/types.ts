export interface FrontMatterIR {
  raw: string
  lines: string[]
  fields: Record<string, unknown>
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

// --- Config types ---

export interface LengthConstraints {
  min_lines?: number
  max_lines?: number
  allow_empty_lines?: boolean
}

export interface ElementConstraints {
  text?: { max_length_per_line?: number; allow_empty?: boolean }
  list?: { required_marker?: '-' | '*' | '+'; min_items?: number; max_items?: number }
  code_block?: { allowed?: boolean }
  emphasis?: { allowed?: boolean }
}

export interface SectionConstraints {
  length?: LengthConstraints
  element?: ElementConstraints
  structure?: { require_list?: boolean; allow_subheadings?: boolean }
}

export interface HeadingItem {
  title: string
  required?: boolean
  constraints?: SectionConstraints
}

export interface LevelConfig {
  required?: boolean
  constraints?: SectionConstraints
  items?: HeadingItem[]
}

export interface Config {
  version: number
  schema: string
  constraints?: SectionConstraints
  front_matter?: { constraints?: { element?: Pick<ElementConstraints, 'text'> } }
  markdown?: {
    constraints?: {
      no_duplicate_headings?: boolean
      allow_additional_headings?: boolean
    }
    headings?: {
      level1?: LevelConfig
      level2?: LevelConfig
      level3?: LevelConfig
      level4?: LevelConfig
    }
  }
}

export interface LintError {
  file: string
  line?: number
  code: string
  message: string
  severity: 'error'
}
