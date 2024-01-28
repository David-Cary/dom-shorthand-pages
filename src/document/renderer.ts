import {
  type SearchResponse,
  type ValidKey
} from 'key-crawler'
import {
  type KeyedValueTemplate,
  KeyedTemplateResolver,
  DataViewDirective,
  MapValuesDirective,
  DEFAULT_DIRECTIVES
} from 'keyed-value-templates'
import {
  type DOMNodeShorthandTemplate,
  DOMTemplateRenderer,
  ContentDuplicationDirective,
  ValueTextDirective,
  WrappedValueTextDirective,
  getValueText
} from 'dom-shorthand-templates'
import {
  type PageTreeDocument,
  type StyleRuleDescription,
  type ValueMap
} from 'page-tree-navigation'
import {
  TemplatedSearchResolver
} from '../content/search'
import {
  type LocalNameValidation,
  LocalNameValidator,
  ValidatedNameSearchResolver
} from '../content/validation'

/**
 * Preforms lazy validation on a page tree document of DOM templates.  This also takes advantage of such validation to speed up surges.
 * @class
 * @property {PageTreeDocument<DOMNodeShorthandTemplate[]>} source - document to be validated
 * @property {LocalNameValidator} validator - object to handle the document's validation
 */
export class ValidatedSiteDocument {
  protected _source: PageTreeDocument<DOMNodeShorthandTemplate[]>
  get source (): PageTreeDocument<DOMNodeShorthandTemplate[]> {
    return this._source
  }

  set source (value: PageTreeDocument<DOMNodeShorthandTemplate[]>) {
    this._source = value
    this._validation = undefined
  }

  protected _validator = new LocalNameValidator()
  get validator (): LocalNameValidator {
    return this._validator
  }

  set validator (value: LocalNameValidator) {
    this._validator = value
    this._validation = undefined
    this._resolver = new ValidatedNameSearchResolver(this._validator.nameAttribute)
  }

  protected _validation?: LocalNameValidation
  /**
   * Retrieves validation of the current document, using a cached version of the data
   * if a previous request has been made.
   * @returns {LocalNameValidation}
   */
  get validation (): LocalNameValidation {
    if (this._validation == null) {
      this._validation = this._validator.validate(this._source.pages)
    }
    return this._validation
  }

  protected _resolver = new ValidatedNameSearchResolver()
  /**
   * Exposes the search resolver tnis object uses on it's data.
   * @returns {ValidatedNameSearchResolver}
   */
  get resolver (): ValidatedNameSearchResolver {
    return this._resolver
  }

  constructor (
    source: PageTreeDocument<DOMNodeShorthandTemplate[]>
  ) {
    this._source = source
  }

  /**
   * Finds the element that matches the provided path.  If no matches or multiple matches
   * are found nothing will be returned.  To check for multiple matches use findContent.
   * @function
   * @param {Array<ValueMap | ValidKey>} path - search steps to be executed
   * @returns {any}
   */
  getContentAt (
    path: Array<ValueMap | ValidKey>
  ): any {
    const response = this._resolver.resolve(
      this.validation,
      path
    )
    if (response.results.length === 1) {
      return response.results[0].target
    }
  }

  /**
   * Finds all content matching the provided search path.
   * @function
   * @param {Array<ValueMap | ValidKey>} path - search steps to be executed
   * @param {number | undefined} maxResults - exit out early if we get this many matches
   * @returns {SearchResponse}
   */
  findContent (
    path: Array<ValueMap | ValidKey>,
    maxResults?: number
  ): SearchResponse {
    const response = this._resolver.resolve(
      this.validation,
      path,
      maxResults
    )
    return response
  }

  /**
   * Reruns document validation
   * @function
   */
  refreshValidation (): void {
    this._validation = this._validator.validate(this._source.pages)
  }
}

/**
 * Provides utility functions for resolving and rendering a validated site document's templates.
 * @class
 * @extends DOMTemplateRenderer
 * @property {string} localNameAttribute - attribute to be used in place of the local name property
 * @property {Record<string, any>} defaultContext - values to be added to the resolution context
 */
export class SiteDocumentRenderer extends DOMTemplateRenderer {
  localNameAttribute = 'data-local-name'

  defaultContext: Record<string, any> = {
    Array,
    Boolean,
    JSON,
    Math,
    Number,
    Object,
    String,
    templatedSearch: new TemplatedSearchResolver()
  }

  constructor () {
    super(
      new KeyedTemplateResolver({
        ...DEFAULT_DIRECTIVES,
        present: new DataViewDirective(),
        remap: new MapValuesDirective(),
        copyContent: new ContentDuplicationDirective(),
        contentValue: new WrappedValueTextDirective(),
        valueText: new ValueTextDirective()
      })
    )
  }

  /**
   * Merges content arrays and filters out undefined entries.
   * @function
   * @param {any[]} source - arrays to be merged
   * @returns {any[]}
   */
  concatContentViews (
    source: any[]
  ): any[] {
    const flattened = source.flat()
    const defined = flattened.filter(item => item != null)
    return defined
  }

  /**
   * Generates a context object for template resolution.
   * @function
   * @param {ValidatedSiteDocument | undefined} doc - site document to attach to the context
   * @param {boolean} hasLocalVars - if set true the context will have local variables initialized
   * @returns {Record<string, any>}
   */
  createContextFor (
    doc?: ValidatedSiteDocument,
    hasLocalVars = false
  ): Record<string, any> {
    const context: Record<string, any> = hasLocalVars
      ? this.resolver.createLocalContext(this.defaultContext)
      : { ...this.defaultContext }
    context.renderer = this
    context.siteDocument = doc
    return context
  }

  /**
   * Generates a template for document previews that can be embedded inside other DOM elements.
   * @function
   * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
   * @param {Record<string, any>} attributes - attributes to be used on each page
   * @returns {DOMNodeShorthandTemplate}
   */
  createBasicDocumentView (
    content: DOMNodeShorthandTemplate[] = [],
    attributes: Record<string, any> = {}
  ): DOMNodeShorthandTemplate {
    return {
      tag: 'div',
      attributes: {
        id: {
          $use: 'get',
          path: [
            'siteDocument',
            'source',
            'id'
          ]
        }
      },
      content: {
        $use: 'get',
        path: [
          'renderer',
          {
            name: 'concatContentViews',
            args: [
              [
                this.createDocumentStyleView(),
                this.createDocumentTitleView('header'),
                this.createDocumentPagesView(
                  content,
                  attributes
                )
              ]
            ]
          }
        ]
      }
    }
  }

  /**
   * Generates template for displaying a site document as an html document.
   * @function
   * @param {Record<string, any>} htmlAttributes - attributes to be attached to the top level html element
   * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
   * @param {Record<string, any>} pageAttributes - attributes to be used on each page
   * @returns {DOMNodeShorthandTemplate}
   */
  createHTMLDocumentView (
    htmlAttributes: Record<string, any> = {},
    content: DOMNodeShorthandTemplate[] = [],
    pageAttributes: Record<string, any> = {}
  ): DOMNodeShorthandTemplate {
    return {
      tag: 'html',
      attributes: {
        ...htmlAttributes,
        id: {
          $use: 'get',
          path: [
            'siteDocument',
            'source',
            'id'
          ]
        }
      },
      content: [
        {
          tag: 'head',
          content: [
            this.createDocumentTitleView('title'),
            this.createDocumentStyleView()
          ]
        },
        {
          tag: 'body',
          content: this.createDocumentPagesView(
            content,
            pageAttributes
          )
        }
      ]
    }
  }

  /**
   * Generates a template for rendering the site document's pages.
   * @function
   * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
   * @param {Record<string, any>} pageAttributes - attributes to be used on each page
   * @returns {DOMNodeShorthandTemplate}
   */
  createDocumentPagesView (
    content: DOMNodeShorthandTemplate[] = [],
    attributes: Record<string, any> = {}
  ): DOMNodeShorthandTemplate {
    return {
      $use: 'remap',
      source: {
        $use: 'get',
        path: [
          'siteDocument',
          'source',
          'pages'
        ]
      },
      getValue: this.createPageView(
        {
          $use: 'getVar',
          path: ['$value']
        },
        content,
        attributes
      )
    }
  }

  /**
   * Generates a template for showing the site document's style rules.
   * @function
   * @param {Record<string, any> | undefined} attributes - attributes to be used on the style element
   * @returns {DOMNodeShorthandTemplate}
   */
  createDocumentStyleView (
    attributes?: KeyedValueTemplate<Record<string, string>>
  ): DOMNodeShorthandTemplate {
    return {
      $use: 'if',
      if: {
        $use: 'get',
        path: [
          'siteDocument',
          'source',
          'style'
        ]
      },
      then: {
        tag: 'style',
        attributes,
        content: [
          {
            $use: 'get',
            path: [
              'renderer',
              {
                name: 'getStyleText',
                args: [
                  {
                    $use: 'get',
                    path: [
                      'siteDocument',
                      'source',
                      'style'
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }

  /**
   * Generates a template for showing the site document's title.
   * @function
   * @param {string} tag - node name for the target element
   * @param {Record<string, any> | undefined} attributes - attributes to be attached to the element
   * @returns {DOMNodeShorthandTemplate}
   */
  createDocumentTitleView (
    tag: string,
    attributes?: Record<string, any>
  ): DOMNodeShorthandTemplate {
    return {
      $use: 'if',
      if: {
        $use: 'get',
        path: [
          'siteDocument',
          'source',
          'title'
        ]
      },
      then: {
        tag,
        attributes,
        content: [
          {
            $use: 'get',
            path: [
              'siteDocument',
              'source',
              'title'
            ]
          }
        ]
      }
    }
  }

  /**
   * Generates a template for displaying a particular page.
   * @function
   * @param {Record<string, any>} pageRef - template used to feed tge target page into the template
   * @param {DOMNodeShorthandTemplate[]} content - templates to use for the page view's content
   * @param {Record<string, any>} attributes - attributes to be used on the page element
   * @returns {DOMNodeShorthandTemplate}
   */
  createPageView (
    pageRef: Record<string, any>,
    content: DOMNodeShorthandTemplate[] = [],
    attributes: Record<string, any> = {}
  ): DOMNodeShorthandTemplate {
    return {
      $use: 'present',
      data: {
        page: pageRef,
        pageDepth: 1
      },
      template: {
        $use: 'value',
        value: {
          tag: 'div',
          attributes: {
            ...attributes,
            id: {
              $use: 'getVar',
              path: [
                'page',
                'id'
              ]
            },
            [this.localNameAttribute]: {
              $use: 'getVar',
              path: [
                'page',
                'localName'
              ]
            }
          },
          content: {
            $use: 'get',
            path: [
              'renderer',
              {
                name: 'concatContentViews',
                args: [
                  content
                ]
              }
            ]
          }
        }
      },
      templateKey: 'pageTemplate'
    }
  }

  /**
   * Generates a template the simply displays the current page's contents.
   * @function
   * @returns {DOMNodeShorthandTemplate}
   */
  createPageContentView (): DOMNodeShorthandTemplate {
    return {
      $use: 'resolve',
      value: {
        $use: 'getVar',
        path: [
          'page',
          'content'
        ]
      }
    }
  }

  /**
   * Generates a template that shows the page title if it exists.
   * @function
   * @param {boolean} sized - If true we will use a numbered header (ex. h1, h2..)
   * @returns {DOMNodeShorthandTemplate}
   */
  createPageTitleView (
    sized = false
  ): DOMNodeShorthandTemplate {
    return {
      $use: 'if',
      if: {
        $use: 'getVar',
        path: [
          'page',
          'title'
        ]
      },
      then: {
        tag: sized
          ? {
              $use: 'get',
              path: [
                'renderer',
                {
                  name: 'getSizedHeader',
                  args: [
                    {
                      $use: 'getVar',
                      path: ['pageDepth']
                    }
                  ]
                }
              ]
            }
          : 'header',
        content: [
          {
            $use: 'getVar',
            path: [
              'page',
              'title'
            ]
          }
        ]
      }
    }
  }

  /**
   * Generates a template for displaying child pages of the current page.
   * @function
   * @returns {DOMNodeShorthandTemplateany}
   */
  createSubPagesView (): DOMNodeShorthandTemplate {
    return {
      $use: 'remap',
      source: {
        $use: 'getVar',
        path: [
          'page',
          'children'
        ]
      },
      getValue: {
        $use: 'present',
        data: {
          page: {
            $use: 'getVar',
            path: ['$value']
          },
          pageDepth: {
            $use: '+',
            args: [
              {
                $use: 'coalesce',
                args: [
                  {
                    $use: 'getVar',
                    path: ['pageDepth']
                  },
                  0
                ]
              },
              1
            ]
          }
        },
        template: {
          $use: 'getVar',
          path: ['pageTemplate']
        }
      }
    }
  }

  /**
   * Converts a search path to a text for readability.
   * @function
   * @param {Array<ValueMap | ValidKey>} path - search path to be evaluated
   * @returns {string}
   */
  getPathShorthand (
    path: Array<ValueMap | ValidKey>
  ): string {
    const terms = path.map(step => {
      if (typeof step === 'object' && step != null) {
        if ('id' in step) return `#${String(step.id)}`
        if ('localName' in step) return `~${String(step.localName)}`
      }
      return getValueText(step)
    })
    return terms.join('.')
  }

  /**
   * Retrieves a header tag corresponding to the provided number.  (Ex. 1 => h1, 2 -> h2..)
   * @function
   * @param {number} size - target header size
   * @returns {string}
   */
  getSizedHeader (
    size: number
  ): string {
    if (isNaN(size)) return 'header'
    const clampedSize = Math.min(Math.max(1, size), 6)
    return `h${clampedSize}`
  }

  /**
   * Converts style rule descriptions to css text.
   * @function
   * @param {StyleRuleDescription[]} rules - rules to be converted
   * @returns {string}
   */
  getStyleText (
    rules: StyleRuleDescription[]
  ): string {
    const segments = rules.map(
      (rule) => {
        const effects: string[] = []
        for (const key in rule.values) {
          effects.push(`${key}:${rule.values[key]}`)
        }
        return `${rule.selector}{${effects.join(';')}}`
      }
    )
    const text = segments.join()
    return text
  }

  /**
   * Converts resolved templates to a DOM Node, if possible.
   * @function
   * @param {any} resolved - resolved template to be rendered
   * @returns {Node | undefined}
   */
  renderResolvedView (resolved: any): Node | undefined {
    const shorthand = this.extractShorthand(resolved)
    if (shorthand != null) {
      return this.renderShorthand(shorthand)
    }
  }

  /**
   * Resolves the provided template using the results a single element site document search.
   * @function
   * @param {ValidatedSiteDocument} source - document to be searched
   * @param {Array<ValueMap | ValidKey>} path - search path to the target content
   * @param {DOMNodeShorthandTemplate | undefined} template - template to be used to display the target content
   * @param {string} contentKey - local variable name for the matching content element
   * @returns {any}
   */
  resolveContentView (
    source: ValidatedSiteDocument,
    path: Array<ValueMap | ValidKey>,
    template?: DOMNodeShorthandTemplate,
    contentKey = '$target'
  ): any {
    const content = source.getContentAt(path)
    const context = this.createContextFor(source, true)
    if (contentKey !== '') {
      this.resolver.setLocalValue(
        context,
        contentKey,
        content
      )
    }
    if (template != null) {
      const result = this.resolveTemplate(template, context)
      return result
    }
    const result = this.resolveTemplate(content, context)
    return result
  }

  /**
   * Resolves the provided template using a particular site document.
   * @function
   * @param {ValidatedSiteDocument} doc - site document to be used
   * @param {DOMNodeShorthandTemplate | undefined} template - template to be resolved
   * @returns {any}
   */
  resolveDocumentView (
    doc: ValidatedSiteDocument,
    template: DOMNodeShorthandTemplate
  ): any {
    const context = this.createContextFor(doc)
    const result = this.resolveTemplate(template, context)
    return result
  }

  /**
   * Resolves a template using a given set of search results.
   * @function
   * @param {ValidatedSiteDocument} source - document to be searched
   * @param {Array<ValueMap | ValidKey>} path - search path to be used
   * @param {DOMNodeShorthandTemplate | undefined} template - template to be used to display the search results
   * @returns {any}
   */
  resolveSearchView (
    source: ValidatedSiteDocument,
    path: Array<ValueMap | ValidKey>,
    templates: DOMNodeShorthandTemplate[]
  ): any {
    const search = source.findContent(path)
    const index = Math.min(search.results.length, 2)
    const template = templates[index]
    if (template != null) {
      const context = this.createContextFor(source, true)
      this.resolver.setLocalValue(
        context,
        '$path',
        path
      )
      this.resolver.setLocalValue(
        context,
        '$search',
        search
      )
      if (search.results.length === 1) {
        this.resolver.setLocalValue(
          context,
          '$target',
          search.results[0].target
        )
      }
      const result = this.resolveTemplate(template, context)
      return result
    }
  }
}
