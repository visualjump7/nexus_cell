// Layered Escape handling: only the top-most open layer (modal, lightbox,
// sheet) responds to Esc, so a confirm opened over a form closes alone.
type Layer = { id: number; onEscape: () => void }

const stack: Layer[] = []
let nextId = 0
let listening = false

function onKey(e: KeyboardEvent) {
  if (e.key !== 'Escape' || stack.length === 0) return
  e.preventDefault()
  stack[stack.length - 1].onEscape()
}

/** Register a layer; returns an unregister function. */
export function pushEscapeLayer(onEscape: () => void): () => void {
  const layer = { id: ++nextId, onEscape }
  stack.push(layer)
  if (!listening && typeof window !== 'undefined') {
    window.addEventListener('keydown', onKey)
    listening = true
  }
  return () => {
    const i = stack.findIndex(l => l.id === layer.id)
    if (i >= 0) stack.splice(i, 1)
    if (stack.length === 0 && listening) {
      window.removeEventListener('keydown', onKey)
      listening = false
    }
  }
}

/** Number of open layers. */
export function escapeDepth(): number {
  return stack.length
}
