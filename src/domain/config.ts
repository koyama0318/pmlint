import { z } from 'zod'

// ── Constraint schemas ────────────────────────────────────────────

const LengthConstraintsSchema = z
  .object({
    min_lines: z.number().int().nonnegative().optional(),
    max_lines: z.number().int().positive().optional(),
    allow_empty_lines: z.boolean().optional()
  })
  .strict()

const ElementConstraintsSchema = z
  .object({
    text: z
      .object({
        max_length_per_line: z.number().int().positive().optional(),
        allow_empty: z.boolean().optional()
      })
      .strict()
      .optional(),
    list: z
      .object({
        required_marker: z.enum(['-', '*', '+']).optional(),
        min_items: z.number().int().nonnegative().optional(),
        max_items: z.number().int().positive().optional()
      })
      .strict()
      .optional(),
    code_block: z.object({ allowed: z.boolean().optional() }).strict().optional(),
    emphasis: z.object({ allowed: z.boolean().optional() }).strict().optional()
  })
  .strict()

const SectionConstraintsSchema = z
  .object({
    length: LengthConstraintsSchema.optional(),
    element: ElementConstraintsSchema.optional(),
    structure: z
      .object({
        require_list: z.boolean().optional(),
        allow_subheadings: z.boolean().optional()
      })
      .strict()
      .optional()
  })
  .strict()

// ── Level config ──────────────────────────────────────────────────

const HeadingItemSchema = z
  .object({
    title: z.string(),
    required: z.boolean().optional(),
    constraints: SectionConstraintsSchema.optional()
  })
  .strict()

const LevelConfigSchema = z
  .object({
    required: z.boolean().optional(),
    constraints: SectionConstraintsSchema.optional(),
    items: z.array(HeadingItemSchema).optional()
  })
  .strict()

// ── Root config schema ────────────────────────────────────────────

export const ConfigSchema = z
  .object({
    version: z.number().int(),
    schema: z.string(),
    constraints: SectionConstraintsSchema.optional(),
    front_matter: z
      .object({
        constraints: z
          .object({
            element: z
              .object({
                text: z
                  .object({ max_length_per_line: z.number().int().positive().optional() })
                  .strict()
                  .optional()
              })
              .strict()
              .optional()
          })
          .strict()
          .optional()
      })
      .strict()
      .optional(),
    markdown: z
      .object({
        constraints: z
          .object({
            no_duplicate_headings: z.boolean().optional(),
            allow_additional_headings: z.boolean().optional()
          })
          .strict()
          .optional(),
        headings: z
          .object({
            level1: LevelConfigSchema.optional(),
            level2: LevelConfigSchema.optional(),
            level3: LevelConfigSchema.optional(),
            level4: LevelConfigSchema.optional()
          })
          .strict()
          .optional()
      })
      .strict()
      .optional()
  })
  .strict()

// ── Exported types (inferred from schema) ────────────────────────

export type Config = z.infer<typeof ConfigSchema>
export type SectionConstraints = z.infer<typeof SectionConstraintsSchema>
export type LevelConfig = z.infer<typeof LevelConfigSchema>
export type HeadingItem = z.infer<typeof HeadingItemSchema>
