/** Tiny crypto-random UUID generator (no external dependency). */
export function v4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0]! & 0x0f) >> (c === 'x' ? 0 : 1)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
