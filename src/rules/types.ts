import type { Config } from '../domain/config'
import type { LintError } from '../domain/error'
import type { PromptIR } from '../domain/ir'

export type Rule = (ir: PromptIR, config: Config) => LintError[]
