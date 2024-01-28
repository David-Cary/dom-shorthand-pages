import { SearchTermCallbackFactory, type SearchCheckCallback, type SearchTermCallback, SearchPathResolver, type ValueMap, type ReversibleTextParser, RouteSearchParser } from 'page-tree-navigation';
import { type ValidKey, type TraversalRoute, ValueVertexFactory, type AnyObject } from 'key-crawler';
import { KeyedTemplateResolver } from 'keyed-value-templates';
/**
 * Extracts the named attribute value from the target object.
 * @function
 * @param {ValueMap} source - object the value should be extracted from
 * @param {string} attribute - name of the target attribute
 * @param {string | undefined} property - property to use if target does not have an attribute map
 * @returns {any}
 */
export declare function getAttributeValue(source: ValueMap, attribute: string, property?: string): any;
/**
 * Generates rules for searching by a particular attribute value.
 * @class
 * @extends SearchTermCallbackFactory
 */
export declare class AttributeValueSearchFactory extends SearchTermCallbackFactory {
    /**
     * Helper function that produces a check for a specified attribute value against a the named property of the target search term.
     * @function
     * @param {string} property - name of the search term property to check
     * @param {string} attribute - name of the target object's attribute to check
     * @returns {SearchCheckCallback}
     */
    createAttributeValueCheck(property: string, attribute: string): SearchCheckCallback;
    /**
     * Creates a rule for check if the value of a specific search term property equals that of the target attribute value.
     * @function
     * @param {string} name - name of the search term property to check
     * @param {string} attribute - name of the target object's attribute to check
     * @param {boolean} shallow - if set to true the traversal will not extend to descendants of a matching node
     * @returns {SearchTermCallback}
     */
    getAttributeValueSearch(name: string, attribute: string, shallow?: boolean): SearchTermCallback;
}
/**
 * A SearchPathResolver that comes preloaded with rules for searching by id and localName properties.
 * @class
 * @extends SearchPathResolver
 */
export declare class IdentifiedContentSearchResolver extends SearchPathResolver {
    /**
     * Used to produce attribute search rules.
     * @readonly
     */
    readonly searchFactory: AttributeValueSearchFactory;
    constructor(nameAttribute?: string);
}
/**
 * Generates a search path to target content item.  This allows for potentially abbreviated paths for deeply nested content.
 * @class
 * @property {string} nameAttribute - name of the local name attribute to be used
 */
export declare class IdentifiedContentSearchFactory {
    nameAttribute: string;
    constructor(nameAttribute?: string);
    /**
     * Abbreviates the provided route to it's corresponding search path, based on an id search followed by local name searches.
     * @function
     * @param {TraversalRoute} route - route to be abbreviated
     * @returns {Array<ValueMap | ValidKey>}
     */
    getSearchFor(route: TraversalRoute): Array<ValueMap | ValidKey>;
}
/**
 * Convert string to and from a search path that uses id and localName attributes.
 * @class
 * @extends ReversibleTextParser<Array<ValueMap | ValidKey>>
 * @property {ReversibleTextParser<Record<string, string>>} paramParser - converts between a source string and a parameter map
 * @property {string} delimiter - delimiter used to split path segments
 */
export declare class IdentifiedContentSearchParser implements ReversibleTextParser<Array<ValueMap | ValidKey>> {
    paramParser: ReversibleTextParser<Record<string, string>>;
    delimiter: string;
    constructor(paramParser?: ReversibleTextParser<Record<string, string>>, delimiter?: string);
    parse(source: string): Array<ValueMap | ValidKey>;
    stringify(source: Array<ValueMap | ValidKey>): string;
}
/**
 * Converts a string to and from a content traversal route using search by id and localName parameters.
 * @class
 * @extends RouteSearchParser
 * @property {IdentifiedContentSearchFactory} searchFactory - converts the route to a search path
 */
export declare class IdentifiedContentRouteParser extends RouteSearchParser {
    searchFactory: IdentifiedContentSearchFactory;
    constructor(paramParser?: ReversibleTextParser<Record<string, string>>, nameAttribute?: string, context?: AnyObject);
}
/**
 * Generates search term rules that use the results of resolving a keyed value template.
 * @class
 * @extends SearchTermCallbackFactory
 * @property {KeyedTemplateResolver} resolver - resolves the provided search term values
 * @property {ValueMap} context - context to be used during value resolution
 */
export declare class TemplatedSearchFactory extends SearchTermCallbackFactory {
    resolver: KeyedTemplateResolver;
    context: ValueMap;
    constructor(vertexFactory?: ValueVertexFactory, resolver?: KeyedTemplateResolver, context?: ValueMap);
    /**
     * Helper function that checks for the directives key and tries reolving the search term as a keyed value template and returning true if the check passes.
     * @function
     * @returns {SearchCheckCallback}
     */
    createTemplatedCheck(): SearchCheckCallback;
    /**
     * Creates a rule that tries reolving the search term as a keyed value template and returning true if the check passes.
     * @function
     * @param {boolean} shallow - if set to true the traversal will not extend to descendants of a matching node
     * @returns {SearchTermCallback}
     */
    getTemplatedSearch(shallow?: boolean): SearchTermCallback;
}
/**
 * A SearchPathResolver with key value template searches enabled by default.
 * @class
 * @extends SearchPathResolver
 */
export declare class TemplatedSearchResolver extends SearchPathResolver {
    /**
     * Used to produce the template search rule.
     * @readonly
     */
    readonly searchFactory: TemplatedSearchFactory;
    constructor(searchFactory?: TemplatedSearchFactory);
}
