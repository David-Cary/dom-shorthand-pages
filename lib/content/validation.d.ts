import { DepthFirstSearch, type TraversalRoute, ValueVertexFactory, type ValidKey, type SearchResponse } from 'key-crawler';
import { type ValueMap } from 'page-tree-navigation';
import { IdentifiedContentSearchResolver } from './search';
/**
 * Tracks subroutes associated with particular local name values.  This is normally used to
 * create content trees based on local name pathing.
 * @interface
 * @property {TraversalRoute} route - route to parent node
 * @property {Record<string, NamedContentMatchNode[]>} nameMatches - map of local names to their corresponding match nodes
 */
export interface NamedContentMatchNode {
    route: TraversalRoute;
    nameMatches: Record<string, NamedContentMatchNode[]>;
}
/**
 * Used to map object's contents by their id and local name.
 * @interface
 * @property {ValueMap} source - evaluated object
 * @property {Record<string, NamedContentMatchNode[]>} idMatches - map of content routes by id
 * @property {Record<string, NamedContentMatchNode[]>} rootMatches - map of content routes by local name that aren't in the id matches tree
 */
export interface LocalNameMatches {
    source: ValueMap[];
    idMatches: Record<string, NamedContentMatchNode[]>;
    rootMatches: Record<string, NamedContentMatchNode[]>;
}
/**
 * A variant of NamedContentMatchNode that is limited to a single child per key.
 * @interface
 * @property {TraversalRoute} route - route to parent node
 * @property {Record<string, NamedContentMatchNode>} children - map of child nodes by local name
 */
export interface NamedContentTraversalNode {
    route: TraversalRoute;
    children: Record<string, NamedContentTraversalNode>;
}
/**
 * Links a search path to the routes for it's matching content.
 * @interface
 * @property {Array<ValueMap | ValidKey>} search - search path called
 * @property {TraversalRoute[]} results - routes to each matching content item
 */
export interface AmbiguousContentSearchResult {
    search: Array<ValueMap | ValidKey>;
    results: TraversalRoute[];
}
/**
 * Stores the results of checking for duplicate ids or local names.
 * @interface
 * @property {ValueMap} target - evaluated object
 * @property {Record<string, NamedContentTraversalNode>} idValues - map of content with unique ids
 * @property {Record<string, NamedContentTraversalNode>} rootValues - map of content with unique local name paths that aren't in the idValues tree
 * @property {AmbiguousContentSearchResult[]} duplicates - list id and local name path with multiple results
 */
export interface LocalNameValidation {
    target: ValueMap[];
    idValues: Record<string, NamedContentTraversalNode>;
    rootValues: Record<string, NamedContentTraversalNode>;
    duplicates: AmbiguousContentSearchResult[];
}
/**
 * Checks content trees for duplicate ids or duplicate local names with a particular context.
 * @class
 * @property {string} nameAttribute - attribute name to be use for local name resolution
 * @property {DepthFirstSearch} depthSearch - handler for depth first search functionality
 * @property {ValueVertexFactory} vertexFactory - used to generate route vertices
 */
export declare class LocalNameValidator {
    nameAttribute: string;
    readonly depthSearch: DepthFirstSearch;
    readonly vertexFactory: ValueVertexFactory;
    constructor(nameAttribute?: string);
    /**
     * Maps a target object's contents by their id or local name.
     * @function
     * @param {ValueMap[]} source - object to be evaluated
     * @returns {LocalNameMatches}
     */
    getMatches(source: ValueMap[]): LocalNameMatches;
    /**
     * Retrieves a copy of the target map that only contains entries with a single route for a given key.
     * @function
     * @param {Record<string, NamedContentMatchNode[]>} source - object to be evaluated
     * @param {AmbiguousContentSearchResult[] | undefined} duplicates - destination for storing any branches with multiple routes for a given key
     * @param {string} searchProperty - name of the local name property
     * @param {Array<ValueMap | ValidKey>} path - current traversal path
     * @returns {Record<string, NamedContentTraversalNode>}
     */
    getUniqueNamesIn(source: Record<string, NamedContentMatchNode[]>, duplicates?: AmbiguousContentSearchResult[], searchProperty?: string, path?: Array<ValueMap | ValidKey>): Record<string, NamedContentTraversalNode>;
    /**
     * Check if the ids and local names of each object's contents follow uniqueness rules.
     * (No duplicate ids and no duplicate local names with the same named/identified parent.)
     * @function
     * @param {ValueMap[]} source - objects to be evaluated
     * @returns {LocalNameValidation}
     */
    validate(source: ValueMap[]): LocalNameValidation;
    /**
     * Extracts duplicate id / local name entries into their own list and creates trees of
     * such nodes with only one match per key.
     * @function
     * @param {LocalNameMatches} matches - content mapping to be evaluated
     * @returns {LocalNameValidation}
     */
    validateMatches(matches: LocalNameMatches): LocalNameValidation;
}
/**
 * Used to track routing for part of content search.
 * @interface
 * @property {TraversalRoute | undefined} route - matching route for the current pathing
 * @property {Array<ValueMap | ValidKey>} subpath - portion of the main search path being evaluated
 */
export interface PartialSearchResolution {
    route?: TraversalRoute;
    subpath: Array<ValueMap | ValidKey>;
}
/**
 * Provides functionality for searching id / local name mapping, allowing for faster content searches.
 * @class
 * @extends DOMTemplateRenderer
 * @property {IdentifiedContentSearchResolver} subsearchResolver - used to resolve the remainder of a search once id and local name are resolved
 */
export declare class ValidatedNameSearchResolver {
    readonly subsearchResolver: IdentifiedContentSearchResolver;
    constructor(nameAttribute?: string);
    /**
     * Tries to find matching content within validate content mapping for a given search path.
     * @function
     * @param {LocalNameValidation} context - content mapping to be searched
     * @param {Array<ValueMap | ValidKey>} path - search steps to be applied
     * @param {number | undefined} maxResults - exit early if we hit this many matches
     * @returns {SearchResponse}
     */
    resolve(context: LocalNameValidation, path: Array<ValueMap | ValidKey>, maxResults?: number): SearchResponse;
    /**
     * Find a named node within a LocalNameValidation.
     * @function
     * @param {LocalNameValidation} context - content mapping to be searched
     * @param {Array<ValueMap | ValidKey>} path - steps to find the target content
     * @returns {PartialSearchResolution}
     */
    findNamedNode(context: LocalNameValidation, path: Array<ValueMap | ValidKey>): PartialSearchResolution;
    /**
     * Helper function for looking within a particular content mapping for a node with a given key / name.
     * @function
     * @param {NamedContentTraversalNode} context - content mapping node to be searched
     * @param {Array<ValueMap | ValidKey>} path - steps to find the target content
     * @returns {PartialSearchResolution}
     */
    findNamedChildNode(context: NamedContentTraversalNode, path: Array<ValueMap | ValidKey>): PartialSearchResolution;
}
