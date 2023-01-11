import SwaggerUI from 'swagger-ui'
import { SwaggerUIKongTheme } from '@kong/swagger-ui-kong-theme'
// TODO: if adding inline doesn't fix load of styles remove
import kongThemeStyles from '@kong/swagger-ui-kong-theme/dist/main.css?inline'
import { attributeValueToBoolean } from './utils'

const essentialsOnlyStyles = `
/* hide non-essential sections */
.info-augment-wrapper,
.swagger-ui section {
  display: none !important;
}
`

const slimModeStyles = `
/* slim mode styles */
.swagger-ui .opblock .opblock-summary-description {
  display: none;
}

.swagger-ui .opblock-tag {
  font-size: 16px;
}

.swagger-ui .opblock .opblock-summary .arrow {
  margin-left: auto;
}
`

export class SwaggerUIElement extends HTMLElement {
  /**
   * Should SwaggerUI be automatically initialized after connecting?
   * @type {boolean}
   */
  #autoInit = true

  /**
   * Specification object or string. Required if `url` property is not set
   * @type {object|string}
   */
  #spec = undefined

  /**
   * URL of the specification file. Required if `spec` property is not set
   * @type {null}
   */
  #url = null

  /**
   * Should SwaggerUI navigation sidebar be enabled?
   * @type {boolean}
   */
  #hasSidebar = true

  /**
   * Should SwaggerUI show schemes, actions, etc
   * @type {boolean}
   */
  #essentialsOnly = false

  /**
   * Slim styles for display in compressed places. Hides descriptions,
   * decrease font size of headings
   * @type {boolean}
   */
  #slimMode = false

  /**
   * SwaggerUI instance
   * @type {object}
   */
  #instance = null

  constructor() {
    super()

    this.rootElement = document.createElement('div')

    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(this.rootElement)

    // load styles
    kongThemeStyles.use({ target: this.shadowRoot })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'spec':
        try {
          this.spec = newValue
        } catch (e) {
          console.error('The "spec" attribute value has to be a valid JSON:', e)
        }
        break
      case 'url':
        this.url = newValue
        break
      case 'auto-init':
        this.autoInit = newValue
        break
      case 'has-sidebar':
        this.hasSidebar = newValue
        break
      case 'essentials-only':
        this.essentialsOnly = newValue
        break
      case 'slim-mode':
        this.slimMode = newValue
        break
    }
  }

  connectedCallback() {
    if (this.#autoInit) {
      this.init()
    }
  }

  init() {
    if (this.#instance) {
      throw new Error('SwaggerUI is already initialized')
    }

    if (!this.isConnected) {
      throw new Error('kong-swagger-ui is no longer connected')
    }

    if (!this.#url && !this.#spec) {
      throw new Error('either `spec` or `url` has to be set to initialize SwaggerUI')
    }

    // hide non-essential sections
    if (this.#essentialsOnly) {
      const styleTag = document.createElement('style')
      styleTag.innerHTML = essentialsOnlyStyles
      styleTag.setAttribute('data-testid', 'hide-essentials-styles')
      this.shadowRoot.appendChild(styleTag)
    }

    // add slim styles
    if (this.#slimMode) {
      const styleTag = document.createElement('style')
      styleTag.innerHTML = slimModeStyles
      styleTag.setAttribute('data-testid', 'slim-mode-styles')
      this.shadowRoot.appendChild(styleTag)
    }

    this.#instance = SwaggerUI({
      url: this.#url,
      spec: this.#spec,
      domNode: this.rootElement,
      deepLinking: true,
      filter: true,
      presets: [
        SwaggerUI.presets.apis,
        SwaggerUI.SwaggerUIStandalonePreset
      ],
      plugins: [
        SwaggerUI.plugins.DownloadUrl,
        SwaggerUIKongTheme
      ],
      layout: 'KongLayout',
      theme: {
        hasSidebar: this.#hasSidebar
      }
    })
  }

  get autoInit() {
    return this.#autoInit
  }

  set autoInit(autoInit) {
    this.#autoInit = attributeValueToBoolean(autoInit)
  }

  get hasSidebar() {
    return this.#hasSidebar
  }

  set hasSidebar(hasSidebar) {
    this.#hasSidebar = attributeValueToBoolean(hasSidebar)
  }

  get essentialsOnly() {
    return this.#essentialsOnly
  }

  set essentialsOnly(essentialsOnly) {
    this.#essentialsOnly = attributeValueToBoolean(essentialsOnly)
  }

  get slimMode() {
    return this.#slimMode
  }

  set slimMode(slimMode) {
    this.#slimMode = attributeValueToBoolean(slimMode)
  }

  get spec() {
    return this.#spec
  }

  set spec(spec) {
    if (!spec) {
      throw new Error("Spec cannot be empty")
    }

    let parsedSpec
    if (typeof spec === 'string') {
      parsedSpec = JSON.parse(spec)
    } else if (typeof spec === 'object') {
      parsedSpec = spec
    }

    this.#spec = parsedSpec

    if (this.#instance) {
      // update SwaggerUI store
      this.#instance.getSystem().specActions.updateJsonSpec(this.#spec)
    }
  }

  get url() {
    return this.#url
  }

  set url(url) {
    this.#url = url
  }

  static get observedAttributes() {
    return ['url', 'spec', 'auto-init', 'has-sidebar', 'essentials-only', 'slim-mode']
  }
}
