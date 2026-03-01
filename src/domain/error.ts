export interface LintError {
  file: string
  line?: number
  code: string
  message: string
  severity: 'error'
}
