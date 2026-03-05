import type { Config, LevelConfig, SectionConstraints } from '../domain/config'
import type { HeadingIR } from '../domain/ir'

/**
 * Resolves the effective constraints for a heading via three-level inheritance:
 *   document.constraints → level{{n}}.constraints → items[title match].constraints
 * Deeper settings win; undefined fields fall through to the parent level.
 */
export function resolveConstraints(heading: HeadingIR, config: Config): SectionConstraints {
  const base = config.constraints ?? {}
  const levelKey = `level${heading.level}` as keyof NonNullable<Config['markdown']>['headings']
  const levelCfg: LevelConfig = config.markdown?.headings?.[levelKey] ?? {}
  const levelConstraints = levelCfg.constraints ?? {}
  const itemConstraints = levelCfg.items?.find(i => i.title === heading.title)?.constraints ?? {}

  const pick = <T>(b: T | undefined, l: T | undefined, it: T | undefined): T | undefined =>
    it ?? l ?? b

  return {
    length: {
      min_lines: pick(
        base.length?.min_lines,
        levelConstraints.length?.min_lines,
        itemConstraints.length?.min_lines
      ),
      max_lines: pick(
        base.length?.max_lines,
        levelConstraints.length?.max_lines,
        itemConstraints.length?.max_lines
      ),
      allow_empty_lines: pick(
        base.length?.allow_empty_lines,
        levelConstraints.length?.allow_empty_lines,
        itemConstraints.length?.allow_empty_lines
      )
    },
    element: {
      text: {
        max_length_per_line: pick(
          base.element?.text?.max_length_per_line,
          levelConstraints.element?.text?.max_length_per_line,
          itemConstraints.element?.text?.max_length_per_line
        ),
        allow_empty: pick(
          base.element?.text?.allow_empty,
          levelConstraints.element?.text?.allow_empty,
          itemConstraints.element?.text?.allow_empty
        )
      },
      list: {
        required_marker: pick(
          base.element?.list?.required_marker,
          levelConstraints.element?.list?.required_marker,
          itemConstraints.element?.list?.required_marker
        ),
        min_items: pick(
          base.element?.list?.min_items,
          levelConstraints.element?.list?.min_items,
          itemConstraints.element?.list?.min_items
        ),
        max_items: pick(
          base.element?.list?.max_items,
          levelConstraints.element?.list?.max_items,
          itemConstraints.element?.list?.max_items
        )
      },
      code_block: {
        allowed: pick(
          base.element?.code_block?.allowed,
          levelConstraints.element?.code_block?.allowed,
          itemConstraints.element?.code_block?.allowed
        )
      },
      emphasis: {
        allowed: pick(
          base.element?.emphasis?.allowed,
          levelConstraints.element?.emphasis?.allowed,
          itemConstraints.element?.emphasis?.allowed
        )
      }
    },
    structure: {
      require_list: pick(
        base.structure?.require_list,
        levelConstraints.structure?.require_list,
        itemConstraints.structure?.require_list
      ),
      allow_subheadings: pick(
        base.structure?.allow_subheadings,
        levelConstraints.structure?.allow_subheadings,
        itemConstraints.structure?.allow_subheadings
      )
    }
  }
}
