import { type SearchResponse, type ValidKey } from 'key-crawler';
import { type KeyedValueTemplate } from 'keyed-value-templates';
import { type DOMNodeShorthandTemplate, DOMTemplateRenderer } from 'dom-shorthand-templates';
import { type PageTreeDocument, type StyleRuleDescription, type ValueMap } from 'page-tree-navigation';
import { type LocalNameValidation, LocalNameValidator, ValidatedNameSearchResolver } from '../content/validation';
/**
 * Preforms lazy validation on a page tree document of DOM templates.  This also takes advantage of such validation to speed up surges.
 * @class
 * @property {PageTreeDocument<DOMNodeShorthandTemplate[]>} source - document to be validated
 * @property {LocalNameValidator} validator - object to handle the document's validation
 */
export declare class ValidatedSiteDocument {
    protected _source: PageTreeDocument<DOMNodeShorthandTemplate[]>;
    get source(): PageTreeDocument<DOMNodeShorthandTemplate[]>;
    set source(value: PageTreeDocument<DOMNodeShorthandTemplate[]>);
    protected _validator: LocalNameValidator;
    get validator(): LocalNameValidator;
    set validator(value: LocalNameValidator);
    protected _validation?: LocalNameValidation;
    /**
     * Retrieves validation of the current document, using a cached version of the data
     * if a previous request has been made.
     * @returns {LocalNameValidation}
     */
    get validation(): LocalNameValidation;
    protected _resolver: ValidatedNameSearchResolver;
    /**
     * Exposes the search resolver tnis object uses on it's data.
     * @returns {ValidatedNameSearchResolver}
     */
    get resolver(): ValidatedNameSearchResolver;
    constructor(source: PageTreeDocument<DOMNodeShorthandTemplate[]>);
    /**
     * Finds the element that matches the provided path.  If no matches or multiple matches
     * are found nothing will be returned.  To check for multiple matches use findContent.
     * @function
     * @param {Array<ValueMap | ValidKey>} path - search steps to be executed
     * @returns {any}
     */
    getContentAt(path: Array<ValueMap | ValidKey>): any;
    /**
     * Finds all content matching the provided search path.
     * @function
     * @param {Array<ValueMap | ValidKey>} path - search steps to be executed
     * @param {number | undefined} maxResults - exit out early if we get this many matches
     * @returns {SearchResponse}
     */
    findContent(path: Array<ValueMap | ValidKey>, maxResults?: number): SearchResponse;
    /**
     * Reruns document validation
     * @function
     */
    refreshValidation(): void;
}
/**
 * Provides utility functions for resolving and rendering a validated site document's templates.
 * @class
 * @extends DOMTemplateRenderer
 * @property {string} localNameAttribute - attribute to be used in place of the local name property
 * @property {Record<string, any>} defaultContext - values to be added to the resolution context
 */
export declare class SiteDocumentRenderer extends DOMTemplateRenderer {
    localNameAttribute: string;
    defaultContext: Record<string, any>;
    constructor();
    /**
     * Merges content arrays and filters out undefined entries.
     * @function
     * @param {any[]} source - arrays to be merged
     * @returns {any[]}
     */
    concatContentViews(source: any[]): any[];
    /**
     * Generates a context object for template resolution.
     * @function
     * @param {ValidatedSiteDocument | undefined} doc - site document to attach to the context
     * @param {boolean} hasLocalVars - if set true the context will have local variables initialized
     * @returns {Record<string, any>}
     */
    createContextFor(doc?: ValidatedSiteDocument, hasLocalVars?: boolean): Record<string, any>;
    /**
     * Generates a template for document previews that can be embedded inside other DOM elements.
     * @function
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
     * @param {Record<string, any>} attributes - attributes to be used on each page
     * @returns {DOMNodeShorthandTemplate}
     */
    createBasicDocumentView(content?: DOMNodeShorthandTemplate[], attributes?: Record<string, any>): DOMNodeShorthandTemplate;
    /**
     * Generates template for displaying a site document as an html document.
     * @function
     * @param {Record<string, any>} htmlAttributes - attributes to be attached to the top level html element
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
     * @param {Record<string, any>} pageAttributes - attributes to be used on each page
     * @returns {DOMNodeShorthandTemplate}
     */
    createHTMLDocumentView(htmlAttributes?: Record<string, any>, content?: DOMNodeShorthandTemplate[], pageAttributes?: Record<string, any>): DOMNodeShorthandTemplate;
    /**
     * Generates a template for rendering the site document's pages.
     * @function
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
     * @param {Record<string, any>} pageAttributes - attributes to be used on each page
     * @returns {DOMNodeShorthandTemplate}
     */
    createDocumentPagesView(content?: DOMNodeShorthandTemplate[], attributes?: Record<string, any>): DOMNodeShorthandTemplate;
    /**
     * Generates a template for showing the site document's style rules.
     * @function
     * @param {Record<string, any> | undefined} attributes - attributes to be used on the style element
     * @returns {DOMNodeShorthandTemplate}
     */
    createDocumentStyleView(attributes?: KeyedValueTemplate<Record<string, string>>): DOMNodeShorthandTemplate;
    /**
     * Generates a template for showing the site document's title.
     * @function
     * @param {string} tag - node name for the target element
     * @param {Record<string, any> | undefined} attributes - attributes to be attached to the element
     * @returns {DOMNodeShorthandTemplate}
     */
    createDocumentTitleView(tag: string, attributes?: Record<string, any>): DOMNodeShorthandTemplate;
    /**
     * Generates a template for displaying a particular page.
     * @function
     * @param {Record<string, any>} pageRef - template used to feed tge target page into the template
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for the page view's content
     * @param {Record<string, any>} attributes - attributes to be used on the page element
     * @returns {DOMNodeShorthandTemplate}
     */
    createPageView(pageRef: Record<string, any>, content?: DOMNodeShorthandTemplate[], attributes?: Record<string, any>): DOMNodeShorthandTemplate;
    /**
     * Generates a template the simply displays the current page's contents.
     * @function
     * @returns {DOMNodeShorthandTemplate}
     */
    createPageContentView(): DOMNodeShorthandTemplate;
    /**
     * Generates a template that shows the page title if it exists.
     * @function
     * @param {boolean} sized - If true we will use a numbered header (ex. h1, h2..)
     * @returns {DOMNodeShorthandTemplate}
     */
    createPageTitleView(sized?: boolean): DOMNodeShorthandTemplate;
    /**
     * Generates a template for displaying child pages of the current page.
     * @function
     * @returns {DOMNodeShorthandTemplateany}
     */
    createSubPagesView(): DOMNodeShorthandTemplate;
    /**
     * Converts a search path to a text for readability.
     * @function
     * @param {Array<ValueMap | ValidKey>} path - search path to be evaluated
     * @returns {string}
     */
    getPathShorthand(path: Array<ValueMap | ValidKey>): string;
    /**
     * Retrieves a header tag corresponding to the provided number.  (Ex. 1 => h1, 2 -> h2..)
     * @function
     * @param {number} size - target header size
     * @returns {string}
     */
    getSizedHeader(size: number): string;
    /**
     * Converts style rule descriptions to css text.
     * @function
     * @param {StyleRuleDescription[]} rules - rules to be converted
     * @returns {string}
     */
    getStyleText(rules: StyleRuleDescription[]): string;
    /**
     * Converts resolved templates to a DOM Node, if possible.
     * @function
     * @param {any} resolved - resolved template to be rendered
     * @returns {Node | undefined}
     */
    renderResolvedView(resolved: any): Node | undefined;
    /**
     * Resolves the provided template using the results a single element site document search.
     * @function
     * @param {ValidatedSiteDocument} source - document to be searched
     * @param {Array<ValueMap | ValidKey>} path - search path to the target content
     * @param {DOMNodeShorthandTemplate | undefined} template - template to be used to display the target content
     * @param {string} contentKey - local variable name for the matching content element
     * @returns {any}
     */
    resolveContentView(source: ValidatedSiteDocument, path: Array<ValueMap | ValidKey>, template?: DOMNodeShorthandTemplate, contentKey?: string): any;
    /**
     * Resolves the provided template using a particular site document.
     * @function
     * @param {ValidatedSiteDocument} doc - site document to be used
     * @param {DOMNodeShorthandTemplate | undefined} template - template to be resolved
     * @returns {any}
     */
    resolveDocumentView(doc: ValidatedSiteDocument, template: DOMNodeShorthandTemplate): any;
    /**
     * Resolves a template using a given set of search results.
     * @function
     * @param {ValidatedSiteDocument} source - document to be searched
     * @param {Array<ValueMap | ValidKey>} path - search path to be used
     * @param {DOMNodeShorthandTemplate | undefined} template - template to be used to display the search results
     * @returns {any}
     */
    resolveSearchView(source: ValidatedSiteDocument, path: Array<ValueMap | ValidKey>, templates: DOMNodeShorthandTemplate[]): any;
}
