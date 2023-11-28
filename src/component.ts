export default class DraggableResizable extends HTMLElement {
  /** These are the element's html attributes.  */
  static observedAttributes = [
    'minwidth',
    'minheight',
    'maxheight',
    'maxwidth',
    'isDraggable',
    'isResizable',
  ]

  /** Whether or not the component can be resized. */
  #RESIZABLE = true
  /** Whether or not the component can be dragged. */
  #DRAGGABLE = true
  /** The minimum width of the element. Resizing beyond this value is disallowed. */
  #MIN_WIDTH = 100
  /** The minimum height of the element. Resizing beyond this value is disallowed. */
  #MIN_HEIGHT = 100
  /** The minimum width of the element. Resizing beyond this value is disallowed. */
  #MAX_WIDTH = 2000
  /** The minimum height of the element. Resizing beyond this value is disallowed. */
  #MAX_HEIGHT = 2000

  /**
   * The constructor does a few things:
   * 1. Creates a wrapper div which will contain the slot that holds the element's children (all of the styling gets applied to this wrapper div).
   * 2. Creates a style object to style the wrapper.
   * 3. Creates a shadow root and attaches the wrapper div and style element to the shadow root.
   */
  constructor() {
    super()

    const wrapper = document.createElement('div')
    wrapper.setAttribute('id', 'wrapper')
    wrapper.setAttribute('part', 'wrapper')
    wrapper.appendChild(document.createElement('slot'))

    const style = document.createElement('style')
    style.textContent = `
        div#wrapper {
          position: absolute;
          width: 200px;
          height: 200px;
          margin: 5px;
          margin: 0px;
          top: 50px;
          left: 50px;
          border: 1px solid black;
          background: white;
        }
      `
    const shadowRoot = this.attachShadow({ mode: 'open' })
    shadowRoot.appendChild(style)
    shadowRoot.appendChild(wrapper)
  }

  /** Sets up the event listeners. */
  #setupListeners = () => {
    const wrapper = this.shadowRoot!.getElementById('wrapper')
    if (!wrapper) return console.error('The wrapper element is missing.')
    /**
     * Dragging and resizing should only occur if the mouse is down,
     * so if the mouseup event fires,
     * then set the canResize and mouseDown properties to false,
     * then set the cursor back to the default icon.
     */
    document.addEventListener('mouseup', () => {
      this.#state.canResize = this.#state.mouseDown = false
      wrapper.style.cursor = 'default'
    })

    /**
     * Sets the mouseDown property to true (dragging is allowed as long as the mouse is currently down).
     * Also checks whether the user can currently resize the element.
     */
    wrapper.addEventListener('mousedown', (e) => {
      if (!this.#DRAGGABLE && !this.#RESIZABLE) return
      this.#state.mouseDown = true
      if (this.#canResize(e, wrapper)) this.#state.canResize = true
    })

    /** Calls the methods that handle the mouse move event. */
    document.addEventListener('mousemove', (e) => {
      this.#setupMouseMove(wrapper, this.#state, e)
      this.#handleMouseMove(wrapper, this.#state, e)
    })
  }

  /** Gets called by the browser when the custom element is connected. */
  private connectedCallback() {
    const isResizable = this.getAttribute('isResizable')
    const isDraggable = this.getAttribute('isDraggable')
    this.#RESIZABLE = !isResizable || isResizable?.trim() === 'true'
    this.#DRAGGABLE = !isDraggable || isDraggable?.trim() === 'true'
    this.#MIN_WIDTH = this.#toNumber(this.getAttribute('minwidth'), 100)
    this.#MIN_HEIGHT = this.#toNumber(this.getAttribute('minheight'), 100)
    this.#MAX_WIDTH = this.#toNumber(this.getAttribute('maxwidth'), 2000)
    this.#MAX_HEIGHT = this.#toNumber(this.getAttribute('maxheight'), 2000)
    this.#setupListeners()
  }

  /** Coerces strings into numbers with a fallback value. */
  #toNumber(s: unknown, fallback = 0) {
    if (!s || typeof s !== 'string') return fallback
    const trimmed = s.trim()
    if (!trimmed) return fallback
    const numberValue = Number(s)
    return isNaN(numberValue) ? fallback : numberValue
  }

  /** Used for TS exhaustiveness checking. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #exhaustive(_: never) {
    throw new Error('received unexpected value')
  }

  /** Gets called by the browser whenever the component's attributes are changed. */
  private attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string,
  ) {
    if (
      name !== 'minwidth' &&
      name !== 'minheight' &&
      name !== 'maxheight' &&
      name !== 'maxwidth' &&
      name !== 'isResizable' &&
      name !== 'isDraggable'
    )
      return
    if (name === 'minheight')
      return void (this.#MIN_HEIGHT = this.#toNumber(newValue, 100))
    if (name === 'minwidth')
      return void (this.#MIN_WIDTH = this.#toNumber(newValue, 100))
    if (name === 'maxheight')
      return void (this.#MAX_HEIGHT = this.#toNumber(newValue, 100))
    if (name === 'maxwidth')
      return void (this.#MAX_WIDTH = this.#toNumber(newValue, 100))
    if (name === 'isResizable')
      return void (this.#RESIZABLE = newValue.trim() === 'true')
    if (name === 'isDraggable')
      return void (this.#DRAGGABLE = newValue.trim() === 'true')
    return this.#exhaustive(name)
  }

  /** Component state. */
  #state: State = {
    /** Stores booleans indiciating wether any of the sides are close enough to the mouse to be eligible for a resize. */
    position: {
      top: false,
      bottom: false,
      left: false,
      right: false,
    },
    /** Stores the previous mouse position. */
    prev: {
      x: null,
      y: null,
    },
    /** Whether or not the user be allowed to resize at the current moment. */
    canResize: false,
    /** Whether or not the user be allowed to drag at the current moment. */
    mouseDown: false,
  }

  /**
   * Accepts two numbers and a tolerance,
   * and then determines if the gap between those two numbers is within that tolerance.
   */
  #roughly = (a: number, b: number, tolerance: number) =>
    Math.abs(a - b) <= tolerance

  /** Converts a css px value into a number */
  #convert = (val: string) => Number(val.replace('px', ''))

  /** Retrieves an element's width and height in pixels as numbers. */
  #dimensions = (e: HTMLElement) => ({
    width: this.#convert(window.getComputedStyle(e).width),
    height: this.#convert(window.getComputedStyle(e).height),
  })

  /**
   * Given a scale and an html element,
   * this method returns the horizontal and vertical boundaries (in pixels)
   * that the mouse can be within to trigger a resize.
   * If the mouse it outside of these boundaries,
   * then resizing is disabled.
   * If the element has a width of 100 for example,
   * then the mouse must be within 25 pixels of one of the element's four edges to trigger a resize.
   */
  #tolerance = (e: HTMLElement) => ({
    horizontal: this.#dimensions(e).width * 0.25,
    vertical: this.#dimensions(e).height * 0.25,
  })

  /** Determines where the edges of the element are currently located. */
  #getEdges = (e: HTMLElement) => {
    const { left, top, width, height } = window.getComputedStyle(e)
    return {
      left: this.#convert(left),
      right: this.#convert(left) + this.#convert(width),
      top: this.#convert(top),
      bottom: this.#convert(top) + this.#convert(height),
    }
  }

  /**
   * Determines whether or not a resize is allowed based on the min and max height and width.
   * Resizing is allowed as long as one of the following are true:
   * 1. The new dimensions do not exceed the minimum and maximum values.
   * 2. The new dimensions are trending towards the minimum and maximum values.
   *
   * The component can end up in a situation where the second rule holds,
   * because the min and max height and width are dynamically configurable using html attributes.
   */
  #allowResize(options: Record<'newHeight' | 'height', number>): boolean
  #allowResize(options: Record<'newWidth' | 'width', number>): boolean
  #allowResize({
    newHeight,
    newWidth,
    height,
    width,
  }: Record<'newHeight' | 'height' | 'newWidth' | 'width', number>): boolean {
    if (newHeight && height) {
      const increasingHeight = newHeight > height
      return !(
        (newHeight < this.#MIN_HEIGHT && !increasingHeight) ||
        (newHeight > this.#MAX_HEIGHT && increasingHeight)
      )
    }
    if (newWidth && width) {
      const increasingWidth = newWidth > width
      return !(
        (newWidth < this.#MIN_WIDTH && !increasingWidth) ||
        (newWidth > this.#MAX_WIDTH && increasingWidth)
      )
    }
    return false
  }

  /**
   * This method actually performs the resizing
   * (as long as the new dimensions are allowed given the component's height and width constraints).
   * */
  #resize = (
    state: State,
    target: HTMLElement,
    {
      width,
      height,
      yOffset,
      xOffset,
      left,
      top,
    }: Record<
      'width' | 'height' | 'yOffset' | 'xOffset' | 'left' | 'top',
      number
    >,
  ) => {
    if (state.position.bottom) {
      const newHeight = height + yOffset
      if (this.#allowResize({ newHeight, height }))
        target.style.height = height + yOffset + 'px'
    }
    if (state.position.top) {
      const newHeight = height - yOffset
      if (this.#allowResize({ newHeight, height })) {
        target.style.height = height - yOffset + 'px'
        target.style.top = top + yOffset + 'px'
      }
    }
    if (state.position.right) {
      const newWidth = width + xOffset
      if (this.#allowResize({ newWidth, width }))
        target.style.width = width + xOffset + 'px'
    }
    if (state.position.left) {
      const newWidth = width - xOffset
      if (this.#allowResize({ newWidth, width })) {
        target.style.width = width - xOffset + 'px'
        target.style.left = left + xOffset + 'px'
      }
    }
  }

  /** Determines whether or not any edge of the element is eligible to resized. */
  #canResize = (e: MouseEvent, target: HTMLElement) => {
    const { right, top, left, bottom } = this.#canResizeEdges(e, target)
    return right || top || left || bottom
  }

  /**
   * Determines the delta between the previous mouse position,
   * and the current mouse position.
   * */
  #delta = (state: State, e: MouseEvent) => ({
    yOffset: e.clientY - (state.prev.y === null ? e.clientY : state.prev.y),
    xOffset: e.clientX - (state.prev.x === null ? e.clientX : state.prev.x),
  })

  /**
   * Determines whether or not the element should be resizable given:
   * 1. The location of the mouse.
   * 2. The location of the element's edges.
   * 3. The tolerance (currently 25%).
   */
  #canResizeEdges = (e: MouseEvent, target: HTMLElement) => ({
    left: this.#roughly(
      e.clientX,
      this.#getEdges(target).left - window.scrollX,
      this.#tolerance(target).horizontal,
    ),
    right: this.#roughly(
      e.clientX,
      this.#getEdges(target).right - window.scrollX,
      this.#tolerance(target).horizontal,
    ),
    top: this.#roughly(
      e.clientY,
      this.#getEdges(target).top - window.scrollY,
      this.#tolerance(target).vertical,
    ),
    bottom: this.#roughly(
      e.clientY,
      this.#getEdges(target).bottom - window.scrollY,
      this.#tolerance(target).vertical,
    ),
  })

  /** Determines whether or not a resize will happen given the current state and attributes. */
  #willResize = (state: State) => state.canResize && this.#RESIZABLE

  /**
   * Determines which side or corner (if any) to resize from,
   * updates the cursor accordingly,
   * and stores the data in the state object for the resize method to operate on later.
   * If the mouse is close to two adjacent edges during a resize operation,
   * then both edges will be resized and the cursor will be updated accordingly.
   *
   * Or, if the component is not resizable,
   * then set the cursor to move (if it's draggable), or the default otherwise.
   */
  #setupMouseMove = (target: HTMLElement, state: State, e: MouseEvent) => {
    if (this.#RESIZABLE) {
      const { top, bottom, left, right } = this.#canResizeEdges(e, target)

      if (bottom && right) {
        state.position = { bottom: true, right: true }
        return void (target.style.cursor = 'nwse-resize')
      }
      if (top && left) {
        state.position = { top: true, left: true }
        return void (target.style.cursor = 'nwse-resize')
      }
      if (bottom && left) {
        state.position = { bottom: true, left: true }
        return void (target.style.cursor = 'nesw-resize')
      }
      if (top && right) {
        state.position = { top: true, right: true }
        return void (target.style.cursor = 'nesw-resize')
      }
      if (bottom) {
        state.position = { bottom: true }
        return void (target.style.cursor = 'ns-resize')
      }
      if (left) {
        state.position = { left: true }
        return void (target.style.cursor = 'ew-resize')
      }
      if (right) {
        state.position = { right: true }
        return void (target.style.cursor = 'ew-resize')
      }
      if (top) {
        state.position = { top: true }
        return void (target.style.cursor = 'ns-resize')
      }
    }

    if (!this.#willResize(state))
      target.style.cursor = this.#DRAGGABLE ? 'move' : 'default'
  }

  /**
   * This event listener actually updates the underlying div's position and size.
   * It also updates the state's mouse position data.
   */
  #handleMouseMove = (target: HTMLElement, state: State, e: MouseEvent) => {
    const { width, height } = this.#dimensions(target)
    const { yOffset, xOffset } = this.#delta(state, e)
    const { left, top } = this.#getEdges(target)
    state.prev.x = e.clientX
    state.prev.y = e.clientY
    if (!state.mouseDown) return
    /**
     * If the user can resize,
     * then call the resize method to handle that operation.
     */
    if (this.#willResize(state))
      return this.#resize(state, target, {
        width,
        height,
        yOffset,
        xOffset,
        left,
        top,
      })

    /**
     * If the user can drag,
     * then update the element's position and set the cursor to the drag icon.
     */
    if (this.#DRAGGABLE) {
      target.style.top = top + yOffset + 'px'
      target.style.left = left + xOffset + 'px'
    }
  }
}

/** Utility type for creating a record whose properties are numbers or null. */
type NullOrNumber<T extends string> = Record<T, number | null>
/**
 * The type of the state object which tracks the element's position,
 * the mouse's position,
 * and whether or not the element can be resized and dragged.
 * */
type State = {
  position: Partial<Record<'top' | 'bottom' | 'left' | 'right', boolean>>
  prev: NullOrNumber<'x' | 'y'>
} & Record<'canResize' | 'mouseDown', boolean>

export { DraggableResizable }
