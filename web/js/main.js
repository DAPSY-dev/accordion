import { domReady } from './tools/helpers.js'
import Accordion from './components/accordion.js'

class Application {
  constructor() {
    this.Accordion = Accordion
    this.accordionObj = {}

    this.init()
  }

  init() {
    const accordionEls = [...document.querySelectorAll('.js-accordion')]
    if (accordionEls.length > 0) this.initAccordion(accordionEls)
  }

  initAccordion(elements) {
    for (const element of elements) {
      if (element.classList.contains('is-init-accordion')) {
        console.error(`Accordion is already initialized (id): ${element.dataset.id}`)
      } else {
        this.accordionObj[element.dataset.id] = new this.Accordion(element)
      }
    }
  }

  destroyAccordion() {
    for (const property in this.accordionObj) {
      this.accordionObj[property].destroy()
      delete this.accordionObj[property]
    }
  }

  destroy() {
    this.destroyAccordion()
  }
}

domReady(() => {
  window['App'] = new Application()
})
