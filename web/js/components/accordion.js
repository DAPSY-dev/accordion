const triggerBrowserReflow = (node) => {
  node.offsetHeight
}

export default class Accordion {
  constructor(element, options = {}) {
    this.accordion = element
    this.options = {
      activeClassName: 'is-active',
      closeOthers: true,
      ...options,
    }

    this.buttons = null
    this.bodies = null

    this.onOpen = null
    this.onOpened = null
    this.onClose = null
    this.onClosed = null

    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.toggle = this.toggle.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleTransitionend = this.handleTransitionend.bind(this)

    this.init()
  }

  init() {
    if (this.accordion.classList.contains('is-init-accordion')) {
      console.error(`Accordion is already initialized (id): ${this.accordion.dataset.id}`)
      return
    }

    if (this.accordion.hasAttribute('data-options')) {
      const dataOptions = JSON.parse(this.accordion.dataset.options)
      this.options = {
        ...this.options,
        ...dataOptions,
      }
    }

    this.buttons = this.getAllButtons()
    this.bodies = this.getAllBodies()

    this.generateA11y()
    this.handleActiveAccordionItem()
    this.hideAllBodiesExceptTheActive()
    this.addEvents()

    this.accordion.classList.add('is-init-accordion')
  }

  getAllButtons() {
    const buttons = [...this.accordion.querySelectorAll('.js-accordion__button')]
    return buttons.filter((button) => button.closest('.js-accordion') === this.accordion)
  }

  getAllBodies() {
    const bodies = [...this.accordion.querySelectorAll('.js-accordion__body')]
    return bodies.filter((body) => body.closest('.js-accordion') === this.accordion)
  }

  getButton(body) {
    return this.accordion.querySelector(`#${body.getAttribute('aria-labelledby')}`)
  }

  getBody(button) {
    return this.accordion.querySelector(`[aria-labelledby="${button.id}"]`)
  }

  getItem(child) {
    return child.closest('.js-accordion__item')
  }

  generateA11y() {
    for (const button of this.buttons) {
      const body = this.getBody(button)
      body.setAttribute('id', `id_${button.id}`)
      body.setAttribute('role', 'region')
      button.setAttribute('aria-expanded', 'false')
      button.setAttribute('aria-controls', body.id)
    }
  }

  removeA11y() {
    for (const button of this.buttons) {
      const body = this.getBody(button)
      body.removeAttribute('id')
      body.removeAttribute('role')
      button.removeAttribute('aria-expanded')
      button.removeAttribute('aria-controls')
    }
  }

  handleActiveAccordionItem() {
    for (const button of this.buttons) {
      const item = this.getItem(button)
      if (!button.classList.contains(this.options.activeClassName)) {
        item.classList.remove(this.options.activeClassName)
        continue
      }

      button.setAttribute('aria-expanded', 'true')
      const body = this.getBody(button)
      body.style.display = 'block'
      body.style.maxHeight = 'none'

      item.classList.add(this.options.activeClassName)
    }
  }

  hideAllBodiesExceptTheActive() {
    for (const body of this.bodies) {
      if (this.getButton(body).classList.contains(this.options.activeClassName)) {
        continue
      }

      body.style.display = 'none'
      body.style.maxHeight = '0px'
    }
  }

  open(button) {
    if (this.options.closeOthers) {
      this.closeOthers(button)
    }

    const body = this.getBody(button)

    button.classList.add(this.options.activeClassName)
    button.setAttribute('aria-expanded', 'true')
    body.style.display = 'block'
    body.style.maxHeight = `${body.scrollHeight}px`

    if (typeof this.onOpen === 'function') {
      this.onOpen()
    }
  }

  close(button) {
    const body = this.getBody(button)

    this.handleBodyIfActive(body)

    button.classList.remove(this.options.activeClassName)
    button.setAttribute('aria-expanded', 'false')
    triggerBrowserReflow(body)
    body.style.maxHeight = '0px'

    if (typeof this.onClose === 'function') {
      this.onClose()
    }
  }

  toggle(button) {
    if (button.classList.contains(this.options.activeClassName)) {
      this.close(button)
    } else {
      this.open(button)
    }
  }

  handleBodyIfActive(body) {
    if (body.style.maxHeight === 'none') {
      body.style.maxHeight = `${body.scrollHeight}px`
    }
  }

  closeOthers(elException) {
    for (const button of this.buttons) {
      if (button === elException) continue

      button.classList.remove(this.options.activeClassName)
      button.setAttribute('aria-expanded', 'false')
      const body = this.getBody(button)
      body.style.maxHeight = `${body.scrollHeight}px`
      triggerBrowserReflow(body)
      body.style.maxHeight = '0px'

      if (typeof this.onClose === 'function' && parseInt(body.style.maxHeight) !== 0) {
        this.onClose()
      }
    }
  }

  handleClick(event) {
    const button = event.currentTarget
    this.toggle(button)
  }

  handleTransitionend(event) {
    if (!event.target.classList.contains('js-accordion__body')) {
      return
    }
    const body = event.currentTarget
    const item = this.getItem(body)
    if (body.style.maxHeight !== '0px') {
      // Remove the height from the active body
      body.style.maxHeight = 'none'
      // Set active item
      item.classList.add(this.options.activeClassName)
      // callback
      if (typeof this.onOpened === 'function') {
        this.onOpened()
      }
    } else {
      // Hide the active body
      body.style.display = 'none'
      // Remove active item
      item.classList.remove(this.options.activeClassName)
      // callback
      if (typeof this.onClosed === 'function') {
        this.onClosed()
      }
    }
  }

  handleKeydown(event) {
    const target = event.target
    const key = event.which.toString()

    if (target.classList.contains('js-accordion__button') && key.match(/35|36|38|40/)) {
      event.preventDefault()
    } else {
      return false
    }

    switch (key) {
      case '36':
        // "Home" key
        this.buttons[0].focus()
        break
      case '35':
        // "End" key
        this.buttons[this.buttons.length - 1].focus()
        break
      case '38':
        // "Up Arrow" key
        const prevIndex = this.buttons.indexOf(target) - 1
        if (this.buttons[prevIndex]) {
          this.buttons[prevIndex].focus()
        } else {
          this.buttons[this.buttons.length - 1].focus()
        }
        break
      case '40':
        // "Down Arrow" key
        const nextIndex = this.buttons.indexOf(target) + 1
        if (this.buttons[nextIndex]) {
          this.buttons[nextIndex].focus()
        } else {
          this.buttons[0].focus()
        }
        break
    }
  }

  addEvents() {
    this.accordion.addEventListener('keydown', this.handleKeydown)
    for (const button of this.buttons) {
      button.addEventListener('click', this.handleClick)
    }
    for (const body of this.bodies) {
      body.addEventListener('transitionend', this.handleTransitionend)
    }
  }

  destroy() {
    this.accordion.removeEventListener('keydown', this.handleKeydown)
    for (const button of this.buttons) {
      button.removeEventListener('click', this.handleClick)
    }
    for (const body of this.bodies) {
      body.removeEventListener('transitionend', this.handleTransitionend)
    }

    this.removeA11y()

    this.buttons = null
    this.bodies = null

    this.accordion.classList.remove('is-init-accordion')
  }
}
