import type {
  Config,
  ContentIR,
  HeadingIR,
  LevelConfig,
  LintError,
  PromptIR,
  SectionConstraints
} from './types'

// --- Constraint resolution ---

function resolveConstraints(heading: HeadingIR, config: Config): SectionConstraints {
  const base = config.constraints ?? {}
  const levelKey = `level${heading.level}` as keyof NonNullable<Config['markdown']>['headings']
  const levelCfg: LevelConfig = config.markdown?.headings?.[levelKey] ?? {}
  const levelConstraints = levelCfg.constraints ?? {}
  const itemConstraints = levelCfg.items?.find(i => i.title === heading.title)?.constraints ?? {}

  const merge = <T>(b: T | undefined, l: T | undefined, it: T | undefined): T | undefined =>
    it ?? l ?? b

  return {
    length: {
      min_lines: merge(
        base.length?.min_lines,
        levelConstraints.length?.min_lines,
        itemConstraints.length?.min_lines
      ),
      max_lines: merge(
        base.length?.max_lines,
        levelConstraints.length?.max_lines,
        itemConstraints.length?.max_lines
      ),
      allow_empty_lines: merge(
        base.length?.allow_empty_lines,
        levelConstraints.length?.allow_empty_lines,
        itemConstraints.length?.allow_empty_lines
      )
    },
    element: {
      text: {
        max_length_per_line: merge(
          base.element?.text?.max_length_per_line,
          levelConstraints.element?.text?.max_length_per_line,
          itemConstraints.element?.text?.max_length_per_line
        ),
        allow_empty: merge(
          base.element?.text?.allow_empty,
          levelConstraints.element?.text?.allow_empty,
          itemConstraints.element?.text?.allow_empty
        )
      },
      list: {
        required_marker: merge(
          base.element?.list?.required_marker,
          levelConstraints.element?.list?.required_marker,
          itemConstraints.element?.list?.required_marker
        ),
        min_items: merge(
          base.element?.list?.min_items,
          levelConstraints.element?.list?.min_items,
          itemConstraints.element?.list?.min_items
        ),
        max_items: merge(
          base.element?.list?.max_items,
          levelConstraints.element?.list?.max_items,
          itemConstraints.element?.list?.max_items
        )
      },
      code_block: {
        allowed: merge(
          base.element?.code_block?.allowed,
          levelConstraints.element?.code_block?.allowed,
          itemConstraints.element?.code_block?.allowed
        )
      },
      emphasis: {
        allowed: merge(
          base.element?.emphasis?.allowed,
          levelConstraints.element?.emphasis?.allowed,
          itemConstraints.element?.emphasis?.allowed
        )
      }
    },
    structure: {
      require_list: merge(
        base.structure?.require_list,
        levelConstraints.structure?.require_list,
        itemConstraints.structure?.require_list
      ),
      allow_subheadings: merge(
        base.structure?.allow_subheadings,
        levelConstraints.structure?.allow_subheadings,
        itemConstraints.structure?.allow_subheadings
      )
    }
  }
}

// --- Helpers ---

function flattenHeadings(headings: HeadingIR[]): HeadingIR[] {
  const result: HeadingIR[] = []
  for (const h of headings) {
    result.push(h)
    result.push(...flattenHeadings(h.children))
  }
  return result
}

function headingsAtLevel(ir: PromptIR, level: number): HeadingIR[] {
  return flattenHeadings(ir.headings).filter(h => h.level === level)
}

// --- Document-level validators ---

function validateDocument(ir: PromptIR, config: Config, errors: LintError[]) {
  const len = config.constraints?.length
  if (!len) return

  if (len.min_lines != null && ir.totalLineCount < len.min_lines) {
    errors.push({
      file: ir.filePath,
      code: 'doc-too-short',
      message: `document has ${ir.totalLineCount} lines, minimum is ${len.min_lines}`,
      severity: 'error'
    })
  }
  if (len.max_lines != null && ir.totalLineCount > len.max_lines) {
    errors.push({
      file: ir.filePath,
      code: 'doc-too-long',
      message: `document has ${ir.totalLineCount} lines, maximum is ${len.max_lines}`,
      severity: 'error'
    })
  }
}

// --- Front matter validators ---

function validateFrontMatter(ir: PromptIR, config: Config, errors: LintError[]) {
  if (!ir.frontMatter) return
  const maxLen = config.front_matter?.constraints?.element?.text?.max_length_per_line
  if (maxLen == null) return

  ir.frontMatter.lines.forEach((line, idx) => {
    if (line.length > maxLen) {
      errors.push({
        file: ir.filePath,
        line: idx + 1,
        code: 'line-too-long',
        message: `front matter line exceeds ${maxLen} characters`,
        severity: 'error'
      })
    }
  })
}

// --- Markdown structure validators ---

function validateMarkdownStructure(ir: PromptIR, config: Config, errors: LintError[]) {
  const mdConstraints = config.markdown?.constraints
  const allFlat = flattenHeadings(ir.headings)

  // no_duplicate_headings
  if (mdConstraints?.no_duplicate_headings) {
    const seen = new Map<string, number>()
    for (const h of allFlat) {
      const key = `${h.level}:${h.title}`
      seen.set(key, (seen.get(key) ?? 0) + 1)
    }
    for (const [key, count] of seen) {
      if (count > 1) {
        const title = key.split(':').slice(1).join(':')
        errors.push({
          file: ir.filePath,
          code: 'duplicate-heading',
          message: `"${title}" appears more than once`,
          severity: 'error'
        })
      }
    }
  }

  // level.required and items[].required, extra-heading
  const levels = [1, 2, 3, 4] as const
  for (const level of levels) {
    const levelKey = `level${level}` as keyof NonNullable<Config['markdown']>['headings']
    const levelCfg: LevelConfig = config.markdown?.headings?.[levelKey] ?? {}
    const headingsOfLevel = headingsAtLevel(ir, level)
    const titlesFound = new Set(headingsOfLevel.map(h => h.title))

    // level.required: true → at least 1 heading of this level must exist
    if (levelCfg.required && headingsOfLevel.length === 0) {
      errors.push({
        file: ir.filePath,
        code: 'missing-heading',
        message: `at least one level-${level} heading is required`,
        severity: 'error'
      })
    }

    // items[].required
    for (const item of levelCfg.items ?? []) {
      if (item.required && !titlesFound.has(item.title)) {
        errors.push({
          file: ir.filePath,
          code: 'missing-heading',
          message: `"${item.title}" heading is required`,
          severity: 'error'
        })
      }
    }

    // allow_additional_headings: false → headings not in items are forbidden
    if (mdConstraints?.allow_additional_headings === false && levelCfg.items) {
      const allowedTitles = new Set(levelCfg.items.map(i => i.title))
      for (const h of headingsOfLevel) {
        if (!allowedTitles.has(h.title)) {
          errors.push({
            file: ir.filePath,
            code: 'extra-heading',
            message: `"${h.title}" is not defined in the schema`,
            severity: 'error'
          })
        }
      }
    }
  }
}

// --- Heading content validators ---

function validateContentConstraints(
  filePath: string,
  headingTitle: string,
  content: ContentIR,
  constraints: SectionConstraints,
  errors: LintError[]
) {
  const { length, element, structure } = constraints

  if (length?.min_lines != null && content.lineCount < length.min_lines) {
    errors.push({
      file: filePath,
      code: 'section-too-short',
      message: `"${headingTitle}" has ${content.lineCount} lines, minimum is ${length.min_lines}`,
      severity: 'error'
    })
  }
  if (length?.max_lines != null && content.lineCount > length.max_lines) {
    errors.push({
      file: filePath,
      code: 'section-too-long',
      message: `"${headingTitle}" has ${content.lineCount} lines, maximum is ${length.max_lines}`,
      severity: 'error'
    })
  }
  if (length?.allow_empty_lines === false && content.hasEmptyLines) {
    errors.push({
      file: filePath,
      code: 'empty-line-not-allowed',
      message: `"${headingTitle}" contains empty lines`,
      severity: 'error'
    })
  }

  if (element?.text?.max_length_per_line != null) {
    const max = element.text.max_length_per_line
    for (const line of content.lines) {
      if (line.length > max) {
        errors.push({
          file: filePath,
          code: 'line-too-long',
          message: `"${headingTitle}" line exceeds ${max} characters`,
          severity: 'error'
        })
        break // one error per section
      }
    }
  }
  if (element?.text?.allow_empty === false && content.isEmpty) {
    errors.push({
      file: filePath,
      code: 'empty-content',
      message: `"${headingTitle}" content must not be empty`,
      severity: 'error'
    })
  }

  if (structure?.require_list && content.lists.length === 0) {
    errors.push({
      file: filePath,
      code: 'list-required',
      message: `"${headingTitle}" section requires a list`,
      severity: 'error'
    })
  }

  const requiredMarker = element?.list?.required_marker
  if (requiredMarker) {
    for (const list of content.lists) {
      if (list.marker !== requiredMarker) {
        errors.push({
          file: filePath,
          code: 'invalid-list-marker',
          message: `"${headingTitle}" list must use "${requiredMarker}" marker`,
          severity: 'error'
        })
        break
      }
    }
  }

  const totalItems = content.lists.reduce((sum, l) => sum + l.itemCount, 0)
  if (element?.list?.min_items != null && totalItems < element.list.min_items) {
    errors.push({
      file: filePath,
      code: 'list-too-few',
      message: `"${headingTitle}" has ${totalItems} list items, minimum is ${element.list.min_items}`,
      severity: 'error'
    })
  }
  if (element?.list?.max_items != null && totalItems > element.list.max_items) {
    errors.push({
      file: filePath,
      code: 'list-too-many',
      message: `"${headingTitle}" exceeds maximum list items (${element.list.max_items})`,
      severity: 'error'
    })
  }

  if (element?.code_block?.allowed === false && content.hasCodeBlock) {
    errors.push({
      file: filePath,
      code: 'code-block-not-allowed',
      message: `code blocks are not allowed in "${headingTitle}"`,
      severity: 'error'
    })
  }
  if (element?.emphasis?.allowed === false && content.hasEmphasis) {
    errors.push({
      file: filePath,
      code: 'emphasis-not-allowed',
      message: `emphasis markup is not allowed in "${headingTitle}"`,
      severity: 'error'
    })
  }

  if (structure?.allow_subheadings === false && content.lists.length === 0) {
    // subheadings are tracked via children, not content — checked separately
  }
}

function validateHeadings(
  headings: HeadingIR[],
  config: Config,
  errors: LintError[],
  filePath: string
) {
  for (const heading of headings) {
    const constraints = resolveConstraints(heading, config)
    validateContentConstraints(filePath, heading.title, heading.content, constraints, errors)

    if (constraints.structure?.allow_subheadings === false && heading.children.length > 0) {
      errors.push({
        file: filePath,
        code: 'subheading-not-allowed',
        message: `"${heading.title}" must not contain sub-headings`,
        severity: 'error'
      })
    }

    validateHeadings(heading.children, config, errors, filePath)
  }
}

// --- Entry point ---

export function validate(ir: PromptIR, config: Config): LintError[] {
  const errors: LintError[] = []
  validateDocument(ir, config, errors)
  validateFrontMatter(ir, config, errors)
  validateMarkdownStructure(ir, config, errors)
  validateHeadings(ir.headings, config, errors, ir.filePath)
  return errors
}
