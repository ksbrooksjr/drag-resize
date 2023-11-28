# Introduction

This is a zero dependency web component that provides a draggable and resizable div.

# Demo

[https://ksbrooksjr.github.io/drag-resize/](https://ksbrooksjr.github.io/drag-resize/)

# Installation

You can install this component from NPM:

```bash
npm install @ksbrooksjr/drag-resize
```

Or you can simply add a script tag that loads the component from a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@ksbrooksjr/drag-resize@0.2.0/dist/index.js"></script>
```

# Usage

After installing simply add the component to your markup.

```html
<drag-resize>
  <div>
    <p>Drag and Resize Me!</p>
  </div>
</drag-resize>
```

## Html Attributes

The component can be customized using the following html attributes:

- **isResizable(boolean)**: whether or not the component can be resized _(default: true)_
- **isDraggable(boolean)**: whether or not the component can be dragged (default: true)
- **minwidth(number)**: the minimum width (in pixels) that the component can be resized to _(default: 100)_
- **minheight(number)**: the minimum height (in pixels) that the component can be resized to _(default: 100)_
- **maxwidth(number)**: the maximum width (in pixels) that the component can be resized to _(default: Infinity)_
- **maxheight(number)**: the minimum height (in pixels) that the component can be resized to _(default: Infinity)_

Example with all options:

```html
<drag-resize
  isResizable="true"
  isDraggable="false"
  minwidth="100"
  minheight="100"
  maxwidth="500"
  maxheight="500">
  <div>
    <p>Drag and Resize Me!</p>
    <p><noscript>This demo requires JavaScript!</noscript></p>
  </div>
</drag-resize>
```

## Styling

You can style the component using the `::part(wrapper)` pseudoselector.

```css
drag-resize::part(wrapper) {
  border-color: blue;
}
```

Don't change the `width`, `height`, `top`, `left`, or `cursor` properties using this method though. To set the initial dimensions and position use css variables. The component accepts the following four css variables:

```css
:root {
  --dr-initial-width: 400px;
  --dr-initial-height: 400px;
  --dr-initial-top: 50px;
  --dr-initial-left: 50px;
}
```

The div rendered by the component has the following default styles:

```css
drag-resize::part(wrapper) {
  margin: 5px;
  border: 1px solid black;
  background: white;
}
```

# Flash of Unstyled Content

Before the component is registered (or if js is unavailable) the browser will render the children of the custom element. To prevent a flash of unstyled content you should use the `drag-resize:not(:defined)` selector to give the child node the same styles that will eventually be applied to the component's shadow dom div element.

```html
<style>
  :root {
    --dr-initial-width: 400px;
    --dr-initial-height: 400px;
    --dr-initial-top: 50px;
    --dr-initial-left: 50px;
  }
  drag-resize:not(:defined) > * {
    position: absolute;
    width: var(--dr-initial-width);
    height: var(--dr-initial-height);
    top: var(--dr-initial-top);
    left: var(--dr-initial-left);

    margin: 5px;
    border: 1px solid black;
    background: white;
  }
  drag-resize::part(wrapper) {
    margin: 5px;
    border: 1px solid black;
    background: white;
  }
</style>
<body>
  <drag-resize>
    <div>
      <span>Drag and Resize Me!</span>
    </div>
  </drag-resize>
</body>
```

# Manually Defining the Component

The component is registered by default. If you'd like to import the class and register it yourself then import it like this:

```js
import DraggableResizable from '@ksbrooksjr/drag-resize/dist/component.js'
customElements.define('drag-resize', DraggableResizable)
```
