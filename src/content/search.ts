import {
  SearchTermCallbackFactory,
  type SearchCheckCallback,
  type SearchTermCallback,
  SearchPathResolver,
  type ValueMap,
  type ReversibleTextParser,
  KeyedSegmentsParser,
  RouteSearchParser,
  getValidContentNodeVertex
} from 'page-tree-navigation'
import {
  type ValidKey,
  type TraversalState,
  type TraversalRoute,
  ValueVertexFactory,
  type AnyObject
} from 'key-crawler'
import {
  KeyedTemplateResolver,
  DEFAULT_DIRECTIVES
} from 'keyed-value-templates'

/**
 * Extracts the named attribute value from the target object.
 * @function
 * @param {ValueMap} source - object the value should be extracted from
 * @param {string} attribute - name of the target attribute
 * @param {string | undefined} property - property to use if target does not have an attribute map
 * @returns {any}
 */
export function getAttributeValue (
  source: ValueMap,
  attribute: string,
  property?: string
): any {
  const attributes = source.attributes
  if (typeof attributes === 'object' && attributes != null) {
    return attributes[attribute]
  }
  if (property != null && 'content' in source) {
    return source[property]
  }
}

/**
 * Generates rules for searching by a particular attribute value.
 * @class
 * @extends SearchTermCallbackFactory
 */
export class AttributeValueSearchFactory extends SearchTermCallbackFactory {
  /**
   * Helper function that produces a check for a specified attribute value against a the named property of the target search term.
   * @function
   * @param {string} property - name of the search term property to check
   * @param {string} attribute - name of the target object's attribute to check
   * @returns {SearchCheckCallback}
   */
  createAttributeValueCheck (
    property: string,
    attribute: string
  ): SearchCheckCallback {
    return (term: ValueMap | ValidKey) => {
      if (typeof term === 'object' && property in term) {
        return (state: TraversalState) => {
          const target = state.route.target
          if (typeof target === 'object' && target != null) {
            const targetObject = target as Record<string, any>
            const value = getAttributeValue(targetObject, attribute, property)
            return term[property] === value
          }
          return false
        }
      }
    }
  }

  /**
   * Creates a rule for check if the value of a specific search term property equals that of the target attribute value.
   * @function
   * @param {string} name - name of the search term property to check
   * @param {string} attribute - name of the target object's attribute to check
   * @param {boolean} shallow - if set to true the traversal will not extend to descendants of a matching node
   * @returns {SearchTermCallback}
   */
  getAttributeValueSearch (
    name: string,
    attribute: string,
    shallow = false
  ): SearchTermCallback {
    return this.getSearchCallback(
      this.createAttributeValueCheck(name, attribute),
      shallow
    )
  }
}

/**
 * A SearchPathResolver that comes preloaded with rules for searching by id and localName properties.
 * @class
 * @extends SearchPathResolver
 */
export class IdentifiedContentSearchResolver extends SearchPathResolver {
  /**
   * Used to produce attribute search rules.
   * @readonly
   */
  readonly searchFactory = new AttributeValueSearchFactory(
    new ValueVertexFactory(
      [
        getValidContentNodeVertex
      ]
    )
  )

  constructor (nameAttribute = 'data-local-name') {
    super()
    this.termRules.push(
      this.searchFactory.getAttributeValueSearch('id', 'id'),
      this.searchFactory.getAttributeValueSearch('localName', nameAttribute),
      this.searchFactory.getKeyCallback()
    )
  }
}

/**
 * Generates a search path to target content item.  This allows for potentially abbreviated paths for deeply nested content.
 * @class
 * @property {string} nameAttribute - name of the local name attribute to be used
 */
export class IdentifiedContentSearchFactory {
  nameAttribute: string

  constructor (nameAttribute = 'data-local-name') {
    this.nameAttribute = nameAttribute
  }

  /**
   * Abbreviates the provided route to it's corresponding search path, based on an id search followed by local name searches.
   * @function
   * @param {TraversalRoute} route - route to be abbreviated
   * @returns {Array<ValueMap | ValidKey>}
   */
  getSearchFor (route: TraversalRoute): Array<ValueMap | ValidKey> {
    const path: Array<ValueMap | ValidKey> = []
    let copyKeys = true
    for (let i = route.path.length - 1; i >= 0; i--) {
      const vertexIndex = i + 1
      const target = vertexIndex < route.vertices.length
        ? route.vertices[vertexIndex].value
        : route.target
      if (
        typeof target === 'object' &&
        target != null
      ) {
        const id = getAttributeValue(target, 'id', 'id')
        if (id != null) {
          path.unshift({ id })
          break
        }
        const localName = getAttributeValue(target, this.nameAttribute, 'localName')
        if (localName != null) {
          path.unshift({ localName })
          copyKeys = false
          continue
        }
      }
      if (copyKeys) {
        path.unshift(route.path[i])
      }
    }
    return path
  }
}

/**
 * Convert string to and from a search path that uses id and localName attributes.
 * @class
 * @extends ReversibleTextParser<Array<ValueMap | ValidKey>>
 * @property {ReversibleTextParser<Record<string, string>>} paramParser - converts between a source string and a parameter map
 * @property {string} delimiter - delimiter used to split path segments
 */
export class IdentifiedContentSearchParser implements ReversibleTextParser<Array<ValueMap | ValidKey>> {
  paramParser: ReversibleTextParser<Record<string, string>>
  delimiter: string

  constructor (
    paramParser: ReversibleTextParser<Record<string, string>> = new KeyedSegmentsParser(
      ['id', 'namePath', 'childPath', 'contentPath'],
      '/'
    ),
    delimiter = '.'
  ) {
    this.paramParser = paramParser
    this.delimiter = delimiter
  }

  parse (source: string): Array<ValueMap | ValidKey> {
    const params = this.paramParser.parse(source)
    const steps: Array<ValueMap | ValidKey> = []
    if (params.id != null) {
      steps.push({ id: params.id })
    }
    if (params.namePath != null) {
      const names = params.namePath.split(this.delimiter)
      for (const localName of names) {
        steps.push({ localName })
      }
    }
    if (params.childPath != null) {
      const indices = params.childPath.split(this.delimiter)
      for (const item of indices) {
        if (item === '') continue
        steps.push('children')
        steps.push(Number(item))
      }
    }
    if (params.contentPath != null) {
      const indices = params.contentPath.split(this.delimiter)
      for (const item of indices) {
        if (item === '') continue
        steps.push('content')
        steps.push(Number(item))
      }
    }
    return steps
  }

  stringify (source: Array<ValueMap | ValidKey>): string {
    const params: Record<string, string> = {}
    const segments: Record<string, string[]> = {
      namePath: [],
      childPath: [],
      contentPath: []
    }
    let targetSegment: string[] = []
    for (const step of source) {
      if (typeof step === 'object') {
        if ('id' in step) {
          params.id = String(step.id)
        } else if ('localName' in step) {
          segments.namePath.push(
            String(step.localName)
          )
        }
      } else if (step === 'children') {
        targetSegment = segments.childPath
      } else if (step === 'content') {
        targetSegment = segments.contentPath
      } else {
        targetSegment.push(
          String(step)
        )
      }
    }
    for (const key in segments) {
      const segment = segments[key]
      if (segment.length > 0) {
        params[key] = segment.join(this.delimiter)
      }
    }
    const pathText = this.paramParser.stringify(params)
    return pathText
  }
}

/**
 * Converts a string to and from a content traversal route using search by id and localName parameters.
 * @class
 * @extends RouteSearchParser
 * @property {IdentifiedContentSearchFactory} searchFactory - converts the route to a search path
 */
export class IdentifiedContentRouteParser extends RouteSearchParser {
  searchFactory: IdentifiedContentSearchFactory

  constructor (
    paramParser?: ReversibleTextParser<Record<string, string>>,
    nameAttribute = 'data-local-name',
    context: AnyObject = []
  ) {
    super(
      new IdentifiedContentSearchParser(paramParser),
      new IdentifiedContentSearchResolver(nameAttribute),
      (route) => this.searchFactory.getSearchFor(route),
      context
    )
    this.searchFactory = new IdentifiedContentSearchFactory(nameAttribute)
  }
}

/**
 * Generates search term rules that use the results of resolving a keyed value template.
 * @class
 * @extends SearchTermCallbackFactory
 * @property {KeyedTemplateResolver} resolver - resolves the provided search term values
 * @property {ValueMap} context - context to be used during value resolution
 */
export class TemplatedSearchFactory extends SearchTermCallbackFactory {
  resolver: KeyedTemplateResolver
  context: ValueMap

  constructor (
    vertexFactory = new ValueVertexFactory(),
    resolver = new KeyedTemplateResolver(DEFAULT_DIRECTIVES),
    context: ValueMap = {}
  ) {
    super(vertexFactory)
    this.resolver = resolver
    this.context = context
  }

  /**
   * Helper function that checks for the directives key and tries reolving the search term as a keyed value template and returning true if the check passes.
   * @function
   * @returns {SearchCheckCallback}
   */
  createTemplatedCheck (): SearchCheckCallback {
    return (term: ValueMap | ValidKey) => {
      if (typeof term === 'object' && this.resolver.directivesKey in term) {
        const localContext = this.resolver.createLocalContext(this.context)
        return (state: TraversalState) => {
          this.resolver.setLocalValue(localContext, 'state', state)
          this.resolver.setLocalValue(localContext, 'value', state.route.target)
          const value = this.resolver.resolveValue(term, localContext)
          return Boolean(value)
        }
      }
    }
  }

  /**
   * Creates a rule that tries reolving the search term as a keyed value template and returning true if the check passes.
   * @function
   * @param {boolean} shallow - if set to true the traversal will not extend to descendants of a matching node
   * @returns {SearchTermCallback}
   */
  getTemplatedSearch (
    shallow = false
  ): SearchTermCallback {
    return this.getSearchCallback(
      this.createTemplatedCheck(),
      shallow
    )
  }
}

/**
 * A SearchPathResolver with key value template searches enabled by default.
 * @class
 * @extends SearchPathResolver
 */
export class TemplatedSearchResolver extends SearchPathResolver {
  /**
   * Used to produce the template search rule.
   * @readonly
   */
  readonly searchFactory: TemplatedSearchFactory

  constructor (
    searchFactory = new TemplatedSearchFactory()
  ) {
    super()
    this.searchFactory = searchFactory
    this.termRules.push(
      this.searchFactory.getTemplatedSearch(),
      this.searchFactory.getKeyCallback()
    )
  }
}
