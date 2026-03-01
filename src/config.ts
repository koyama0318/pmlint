import * as fs from 'node:fs'
import * as path from 'node:path'
import yaml from 'js-yaml'
import type { Config, LintError } from './types'

const SUPPORTED_VERSIONS = [1]
const LEVEL_KEYS = ['level1', 'level2', 'level3', 'level4'] as const

export function loadConfig(startDir: string): { config: Config | null; errors: LintError[] } {
  let dir = path.resolve(startDir)

  while (true) {
    const candidate = path.join(dir, '.pmlintrc.yml')
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8')
      return parseConfig(raw, candidate)
    }
    const parent = path.dirname(dir)
    if (parent === dir) return { config: null, errors: [] }
    dir = parent
  }
}

export function parseConfig(
  raw: string,
  filePath: string
): { config: Config | null; errors: LintError[] } {
  const errors: LintError[] = []
  const doc = yaml.load(raw) as Config

  if (!SUPPORTED_VERSIONS.includes(doc?.version)) {
    errors.push({
      file: filePath,
      code: 'unsupported-schema-version',
      message: `schema version ${doc?.version} is not supported`,
      severity: 'error'
    })
    return { config: null, errors }
  }

  for (const levelKey of LEVEL_KEYS) {
    const items = doc.markdown?.headings?.[levelKey]?.items
    if (!items) continue
    const seen = new Set<string>()
    for (const item of items) {
      if (seen.has(item.title)) {
        errors.push({
          file: filePath,
          code: 'invalid-config',
          message: `duplicate title "${item.title}" in ${levelKey}.items`,
          severity: 'error'
        })
      }
      seen.add(item.title)
    }
  }

  if (errors.length > 0) return { config: null, errors }
  return { config: doc, errors: [] }
}
