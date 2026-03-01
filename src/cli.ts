import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadConfig } from './config'
import { parse } from './parser'
import { formatText } from './reporter'
import type { LintError } from './types'
import { validate } from './validator'

function collectMarkdownFiles(target: string): string[] {
  const stat = fs.statSync(target)
  if (stat.isFile()) return [target]

  const files: string[] = []
  for (const entry of fs.readdirSync(target, { recursive: true })) {
    const full = path.join(target, entry as string)
    if (fs.statSync(full).isFile() && full.endsWith('.md')) {
      files.push(full)
    }
  }
  return files.sort()
}

export function run(argv: string[]): number {
  const targetArg = argv[2]
  if (!targetArg) {
    console.error('Usage: pmlint <path>')
    return 1
  }

  const target = path.resolve(targetArg)
  if (!fs.existsSync(target)) {
    console.error(`Path not found: ${target}`)
    return 1
  }

  const files = collectMarkdownFiles(target)
  const { config, errors: configErrors } = loadConfig(process.cwd())
  const allErrors: LintError[] = [...configErrors]

  if (configErrors.length > 0) {
    console.log(formatText(configErrors))
    return 1
  }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8')
    const { ir, errors: parseErrors } = parse(filePath, content)
    allErrors.push(...parseErrors)

    if (config) {
      allErrors.push(...validate(ir, config))
    }
  }

  if (allErrors.length > 0) {
    console.log(formatText(allErrors))
    return 1
  }

  return 0
}

process.exit(run(process.argv))
