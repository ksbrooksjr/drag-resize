import DraggableResizable from './component'

new EventSource('/esbuild').addEventListener('change', () => location.reload())

/** Register the custom Element. */
customElements.define('drag-resize', DraggableResizable)
