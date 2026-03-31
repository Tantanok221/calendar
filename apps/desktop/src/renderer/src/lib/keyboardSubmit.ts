interface SubmitKeyDownInput {
  key: string
  tagName?: string | null
  defaultPrevented?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  isContentEditable?: boolean
}

export function shouldSubmitOnEnterKeyDown(input: SubmitKeyDownInput): boolean {
  if (input.key !== 'Enter') {
    return false
  }

  if (
    input.defaultPrevented ||
    input.altKey ||
    input.ctrlKey ||
    input.metaKey ||
    input.shiftKey ||
    input.isContentEditable
  ) {
    return false
  }

  const tagName = input.tagName?.toUpperCase()

  return tagName !== 'BUTTON' && tagName !== 'A' && tagName !== 'TEXTAREA'
}
