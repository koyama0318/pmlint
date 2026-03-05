import type { Config, SectionConstraints } from '../domain/config'
import type { LintError } from '../domain/error'
import type { ContentIR, HeadingIR, PromptIR } from '../domain/ir'
import { resolveConstraints } from './resolver'
import type { Rule } from './types'

function checkContent(
  filePath: string,
  title: string,
  content: ContentIR,
  constraints: SectionConstraints
): LintError[] {
  const errors: LintError[] = []
  const { length, element, structure } = constraints

  if (length?.min_lines != null && content.lineCount < length.min_lines) {
    errors.push({
      file: filePath,
      code: 'section-too-short',
      message: `"${title}" has ${content.lineCount} lines, minimum is ${length.min_lines}`,
      severity: 'error'
    })
  }
  if (length?.max_lines != null && content.lineCount > length.max_lines) {
    errors.push({
      file: filePath,
      code: 'section-too-long',
      message: `"${title}" has ${content.lineCount} lines, maximum is ${length.max_lines}`,
      severity: 'error'
    })
  }
  if (length?.allow_empty_lines === false && content.hasEmptyLines) {
    errors.push({
      file: filePath,
      code: 'empty-line-not-allowed',
      message: `"${title}" contains empty lines`,
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
          message: `"${title}" line exceeds ${max} characters`,
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
      message: `"${title}" content must not be empty`,
      severity: 'error'
    })
  }

  if (structure?.require_list && content.lists.length === 0) {
    errors.push({
      file: filePath,
      code: 'list-required',
      message: `"${title}" section requires a list`,
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
          message: `"${title}" list must use "${requiredMarker}" marker`,
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
      message: `"${title}" has ${totalItems} list items, minimum is ${element.list.min_items}`,
      severity: 'error'
    })
  }
  if (element?.list?.max_items != null && totalItems > element.list.max_items) {
    errors.push({
      file: filePath,
      code: 'list-too-many',
      message: `"${title}" exceeds maximum list items (${element.list.max_items})`,
      severity: 'error'
    })
  }

  if (element?.code_block?.allowed === false && content.hasCodeBlock) {
    errors.push({
      file: filePath,
      code: 'code-block-not-allowed',
      message: `code blocks are not allowed in "${title}"`,
      severity: 'error'
    })
  }
  if (element?.emphasis?.allowed === false && content.hasEmphasis) {
    errors.push({
      file: filePath,
      code: 'emphasis-not-allowed',
      message: `emphasis markup is not allowed in "${title}"`,
      severity: 'error'
    })
  }

  return errors
}

function checkHeadings(headings: HeadingIR[], config: Config, filePath: string): LintError[] {
  return headings.flatMap(heading => {
    const constraints = resolveConstraints(heading, config)
    const errors = checkContent(filePath, heading.title, heading.content, constraints)

    if (constraints.structure?.allow_subheadings === false && heading.children.length > 0) {
      errors.push({
        file: filePath,
        code: 'subheading-not-allowed',
        message: `"${heading.title}" must not contain sub-headings`,
        severity: 'error'
      })
    }

    return [...errors, ...checkHeadings(heading.children, config, filePath)]
  })
}

export const contentRule: Rule = (ir: PromptIR, config: Config): LintError[] => {
  return checkHeadings(ir.headings, config, ir.filePath)
}
