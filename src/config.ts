import * as fs from 'node:fs'
import * as path from 'node:path'
import yaml from 'js-yaml'
import type { Config } from './types'

export function loadConfig(startDir: string): Config | null {
  let dir = path.resolve(startDir)

  while (true) {
    const candidate = path.join(dir, '.pmlintrc.yml')
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8')
      return parseConfig(raw)
    }
    const parent = path.dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

export function parseConfig(raw: string): Config {
  const doc = yaml.load(raw) as Record<string, unknown>
  const rawTypes = (doc?.types ?? {}) as Record<string, { required?: string[] }>

  const types: Config['types'] = {}
  for (const [name, def] of Object.entries(rawTypes)) {
    types[name] = { required: def.required ?? [] }
  }

  return { types }
}
