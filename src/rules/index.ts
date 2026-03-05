import type { Config } from '../domain/config'
import type { LintError } from '../domain/error'
import type { PromptIR } from '../domain/ir'
import { contentRule } from './content'
import { documentRule } from './document'
import { frontMatterRule } from './frontMatter'
import { structureRule } from './structure'
import type { Rule } from './types'

const rules: Rule[] = [documentRule, frontMatterRule, structureRule, contentRule]

export function validate(ir: PromptIR, config: Config): LintError[] {
  return rules.flatMap(rule => rule(ir, config))
}
