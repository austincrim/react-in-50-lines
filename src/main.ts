const Freact = {
  // Tracks the root DOM element for initial render and subsequent re-renders
  rootElement: undefined as HTMLElement | undefined,
  // Tracks the root component so we can call it for later re-renders
  rootComponent: undefined as (() => HTMLElement) | undefined,
  // Holds the current values of each useState call
  currentState: [] as any[],
  // Tracks the current useState call in the tree so we can retrieve the correct value from currentState
  currentIndex: 0,
  // Performs the initial mount and render to a DOM node
  render(el: HTMLElement, component: () => HTMLElement) {
    Freact.rootElement = el
    Freact.rootComponent = component
    el.appendChild(component())
  },
  /**
   * Perform React's patented "re-render everything" model.
   * Start hook calls from the beginning and clear out the DOM before recreating it fresh
   * by just calling our root component and putting the result in our root element
   */
  rerender() {
    Freact.currentIndex = 0
    Freact.rootElement!.innerHTML = ""
    Freact.rootElement!.appendChild(Freact.rootComponent!())
  },
  /**
   * Creates the actual DOM elements to be rendered, supports elements and components as children
   */
  createElement(
    tag: string,
    props: Record<string, any>,
    children?: Array<HTMLElement | (() => HTMLElement)>
  ) {
    let el = document.createElement(tag)
    Object.assign(el, props)

    if (children) {
      for (let child of children) {
        el.appendChild(typeof child === "function" ? child() : child)
      }
    }
    return el
  },
  useState<T>(initial: T) {
    // store current index so we can increment it later without returning incorrect state
    let index = Freact.currentIndex

    // set initial value into state if we haven't set any values yet
    if (Freact.currentState[index] === undefined) {
      Freact.currentState[index] = initial
    }

    // creates a closure that will update the correct currentState and force a re-render
    function setState(newVal: T) {
      Freact.currentState[index] = newVal
      Freact.rerender()
    }

    // increment the current hook index so that the next useState call references the correct value
    Freact.currentIndex += 1

    /**
     * return state from original index value, casting with the generic T to ensure the correct type is returned
     * additionally use `as const` so TypeScript considers the return type a tuple, with [state, setState] always in that order with their corresponding types
     */
    return [Freact.currentState[index] as T, setState] as const
  },
}

// use it like you would React!
Freact.render(document.getElementById("app")!, App)

function App() {
  return Freact.createElement("div", {}, [
    Counter({ initial: 1 }),
    Counter({ initial: 5 }),
  ])
}

function Counter({ initial }: { initial: number }) {
  let [count, setCount] = Freact.useState(initial ?? 0)
  return Freact.createElement("div", { style: "display: flex" }, [
    Freact.createElement("button", {
      textContent: "-",
      ariaLabel: "decrement",
      onclick: () => setCount(count - 1),
    }),
    Freact.createElement("h1", { textContent: count }),
    Freact.createElement("button", {
      textContent: "+",
      ariaLabel: "increment",
      onclick: () => setCount(count + 1),
    }),
  ])
}
