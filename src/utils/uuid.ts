/** Wrapper around the browser's native crypto.randomUUID(). */
export function v4(): string {
  return crypto.randomUUID()
}
