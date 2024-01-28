"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteDocumentRenderer = exports.ValidatedSiteDocument = void 0;
var keyed_value_templates_1 = require("keyed-value-templates");
var dom_shorthand_templates_1 = require("dom-shorthand-templates");
var search_1 = require("../content/search");
var validation_1 = require("../content/validation");
/**
 * Preforms lazy validation on a page tree document of DOM templates.  This also takes advantage of such validation to speed up surges.
 * @class
 * @property {PageTreeDocument<DOMNodeShorthandTemplate[]>} source - document to be validated
 * @property {LocalNameValidator} validator - object to handle the document's validation
 */
var ValidatedSiteDocument = /** @class */ (function () {
    function ValidatedSiteDocument(source) {
        this._validator = new validation_1.LocalNameValidator();
        this._resolver = new validation_1.ValidatedNameSearchResolver();
        this._source = source;
    }
    Object.defineProperty(ValidatedSiteDocument.prototype, "source", {
        get: function () {
            return this._source;
        },
        set: function (value) {
            this._source = value;
            this._validation = undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ValidatedSiteDocument.prototype, "validator", {
        get: function () {
            return this._validator;
        },
        set: function (value) {
            this._validator = value;
            this._validation = undefined;
            this._resolver = new validation_1.ValidatedNameSearchResolver(this._validator.nameAttribute);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ValidatedSiteDocument.prototype, "validation", {
        /**
         * Retrieves validation of the current document, using a cached version of the data
         * if a previous request has been made.
         * @returns {LocalNameValidation}
         */
        get: function () {
            if (this._validation == null) {
                this._validation = this._validator.validate(this._source.pages);
            }
            return this._validation;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ValidatedSiteDocument.prototype, "resolver", {
        /**
         * Exposes the search resolver tnis object uses on it's data.
         * @returns {ValidatedNameSearchResolver}
         */
        get: function () {
            return this._resolver;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Finds the element that matches the provided path.  If no matches or multiple matches
     * are found nothing will be returned.  To check for multiple matches use findContent.
     * @function
     * @param {Array<ValueMap | ValidKey>} path - search steps to be executed
     * @returns {any}
     */
    ValidatedSiteDocument.prototype.getContentAt = function (path) {
        var response = this._resolver.resolve(this.validation, path);
        if (response.results.length === 1) {
            return response.results[0].target;
        }
    };
    /**
     * Finds all content matching the provided search path.
     * @function
     * @param {Array<ValueMap | ValidKey>} path - search steps to be executed
     * @param {number | undefined} maxResults - exit out early if we get this many matches
     * @returns {SearchResponse}
     */
    ValidatedSiteDocument.prototype.findContent = function (path, maxResults) {
        var response = this._resolver.resolve(this.validation, path, maxResults);
        return response;
    };
    /**
     * Reruns document validation
     * @function
     */
    ValidatedSiteDocument.prototype.refreshValidation = function () {
        this._validation = this._validator.validate(this._source.pages);
    };
    return ValidatedSiteDocument;
}());
exports.ValidatedSiteDocument = ValidatedSiteDocument;
/**
 * Provides utility functions for resolving and rendering a validated site document's templates.
 * @class
 * @extends DOMTemplateRenderer
 * @property {string} localNameAttribute - attribute to be used in place of the local name property
 * @property {Record<string, any>} defaultContext - values to be added to the resolution context
 */
var SiteDocumentRenderer = /** @class */ (function (_super) {
    __extends(SiteDocumentRenderer, _super);
    function SiteDocumentRenderer() {
        var _this = _super.call(this, new keyed_value_templates_1.KeyedTemplateResolver(__assign(__assign({}, keyed_value_templates_1.DEFAULT_DIRECTIVES), { present: new keyed_value_templates_1.DataViewDirective(), remap: new keyed_value_templates_1.MapValuesDirective(), copyContent: new dom_shorthand_templates_1.ContentDuplicationDirective(), contentValue: new dom_shorthand_templates_1.WrappedValueTextDirective(), valueText: new dom_shorthand_templates_1.ValueTextDirective() }))) || this;
        _this.localNameAttribute = 'data-local-name';
        _this.defaultContext = {
            Array: Array,
            Boolean: Boolean,
            JSON: JSON,
            Math: Math,
            Number: Number,
            Object: Object,
            String: String,
            templatedSearch: new search_1.TemplatedSearchResolver()
        };
        return _this;
    }
    /**
     * Merges content arrays and filters out undefined entries.
     * @function
     * @param {any[]} source - arrays to be merged
     * @returns {any[]}
     */
    SiteDocumentRenderer.prototype.concatContentViews = function (source) {
        var flattened = source.flat();
        var defined = flattened.filter(function (item) { return item != null; });
        return defined;
    };
    /**
     * Generates a context object for template resolution.
     * @function
     * @param {ValidatedSiteDocument | undefined} doc - site document to attach to the context
     * @param {boolean} hasLocalVars - if set true the context will have local variables initialized
     * @returns {Record<string, any>}
     */
    SiteDocumentRenderer.prototype.createContextFor = function (doc, hasLocalVars) {
        if (hasLocalVars === void 0) { hasLocalVars = false; }
        var context = hasLocalVars
            ? this.resolver.createLocalContext(this.defaultContext)
            : __assign({}, this.defaultContext);
        context.renderer = this;
        context.siteDocument = doc;
        return context;
    };
    /**
     * Generates a template for document previews that can be embedded inside other DOM elements.
     * @function
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
     * @param {Record<string, any>} attributes - attributes to be used on each page
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createBasicDocumentView = function (content, attributes) {
        if (content === void 0) { content = []; }
        if (attributes === void 0) { attributes = {}; }
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
                                this.createDocumentPagesView(content, attributes)
                            ]
                        ]
                    }
                ]
            }
        };
    };
    /**
     * Generates template for displaying a site document as an html document.
     * @function
     * @param {Record<string, any>} htmlAttributes - attributes to be attached to the top level html element
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
     * @param {Record<string, any>} pageAttributes - attributes to be used on each page
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createHTMLDocumentView = function (htmlAttributes, content, pageAttributes) {
        if (htmlAttributes === void 0) { htmlAttributes = {}; }
        if (content === void 0) { content = []; }
        if (pageAttributes === void 0) { pageAttributes = {}; }
        return {
            tag: 'html',
            attributes: __assign(__assign({}, htmlAttributes), { id: {
                    $use: 'get',
                    path: [
                        'siteDocument',
                        'source',
                        'id'
                    ]
                } }),
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
                    content: this.createDocumentPagesView(content, pageAttributes)
                }
            ]
        };
    };
    /**
     * Generates a template for rendering the site document's pages.
     * @function
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for each page
     * @param {Record<string, any>} pageAttributes - attributes to be used on each page
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createDocumentPagesView = function (content, attributes) {
        if (content === void 0) { content = []; }
        if (attributes === void 0) { attributes = {}; }
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
            getValue: this.createPageView({
                $use: 'getVar',
                path: ['$value']
            }, content, attributes)
        };
    };
    /**
     * Generates a template for showing the site document's style rules.
     * @function
     * @param {Record<string, any> | undefined} attributes - attributes to be used on the style element
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createDocumentStyleView = function (attributes) {
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
                attributes: attributes,
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
        };
    };
    /**
     * Generates a template for showing the site document's title.
     * @function
     * @param {string} tag - node name for the target element
     * @param {Record<string, any> | undefined} attributes - attributes to be attached to the element
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createDocumentTitleView = function (tag, attributes) {
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
                tag: tag,
                attributes: attributes,
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
        };
    };
    /**
     * Generates a template for displaying a particular page.
     * @function
     * @param {Record<string, any>} pageRef - template used to feed tge target page into the template
     * @param {DOMNodeShorthandTemplate[]} content - templates to use for the page view's content
     * @param {Record<string, any>} attributes - attributes to be used on the page element
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createPageView = function (pageRef, content, attributes) {
        var _a;
        if (content === void 0) { content = []; }
        if (attributes === void 0) { attributes = {}; }
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
                    attributes: __assign(__assign({}, attributes), (_a = { id: {
                                $use: 'getVar',
                                path: [
                                    'page',
                                    'id'
                                ]
                            } }, _a[this.localNameAttribute] = {
                        $use: 'getVar',
                        path: [
                            'page',
                            'localName'
                        ]
                    }, _a)),
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
        };
    };
    /**
     * Generates a template the simply displays the current page's contents.
     * @function
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createPageContentView = function () {
        return {
            $use: 'resolve',
            value: {
                $use: 'getVar',
                path: [
                    'page',
                    'content'
                ]
            }
        };
    };
    /**
     * Generates a template that shows the page title if it exists.
     * @function
     * @param {boolean} sized - If true we will use a numbered header (ex. h1, h2..)
     * @returns {DOMNodeShorthandTemplate}
     */
    SiteDocumentRenderer.prototype.createPageTitleView = function (sized) {
        if (sized === void 0) { sized = false; }
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
        };
    };
    /**
     * Generates a template for displaying child pages of the current page.
     * @function
     * @returns {DOMNodeShorthandTemplateany}
     */
    SiteDocumentRenderer.prototype.createSubPagesView = function () {
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
        };
    };
    /**
     * Converts a search path to a text for readability.
     * @function
     * @param {Array<ValueMap | ValidKey>} path - search path to be evaluated
     * @returns {string}
     */
    SiteDocumentRenderer.prototype.getPathShorthand = function (path) {
        var terms = path.map(function (step) {
            if (typeof step === 'object' && step != null) {
                if ('id' in step)
                    return "#".concat(String(step.id));
                if ('localName' in step)
                    return "~".concat(String(step.localName));
            }
            return (0, dom_shorthand_templates_1.getValueText)(step);
        });
        return terms.join('.');
    };
    /**
     * Retrieves a header tag corresponding to the provided number.  (Ex. 1 => h1, 2 -> h2..)
     * @function
     * @param {number} size - target header size
     * @returns {string}
     */
    SiteDocumentRenderer.prototype.getSizedHeader = function (size) {
        if (isNaN(size))
            return 'header';
        var clampedSize = Math.min(Math.max(1, size), 6);
        return "h".concat(clampedSize);
    };
    /**
     * Converts style rule descriptions to css text.
     * @function
     * @param {StyleRuleDescription[]} rules - rules to be converted
     * @returns {string}
     */
    SiteDocumentRenderer.prototype.getStyleText = function (rules) {
        var segments = rules.map(function (rule) {
            var effects = [];
            for (var key in rule.values) {
                effects.push("".concat(key, ":").concat(rule.values[key]));
            }
            return "".concat(rule.selector, "{").concat(effects.join(';'), "}");
        });
        var text = segments.join();
        return text;
    };
    /**
     * Converts resolved templates to a DOM Node, if possible.
     * @function
     * @param {any} resolved - resolved template to be rendered
     * @returns {Node | undefined}
     */
    SiteDocumentRenderer.prototype.renderResolvedView = function (resolved) {
        var shorthand = this.extractShorthand(resolved);
        if (shorthand != null) {
            return this.renderShorthand(shorthand);
        }
    };
    /**
     * Resolves the provided template using the results a single element site document search.
     * @function
     * @param {ValidatedSiteDocument} source - document to be searched
     * @param {Array<ValueMap | ValidKey>} path - search path to the target content
     * @param {DOMNodeShorthandTemplate | undefined} template - template to be used to display the target content
     * @param {string} contentKey - local variable name for the matching content element
     * @returns {any}
     */
    SiteDocumentRenderer.prototype.resolveContentView = function (source, path, template, contentKey) {
        if (contentKey === void 0) { contentKey = '$target'; }
        var content = source.getContentAt(path);
        var context = this.createContextFor(source, true);
        if (contentKey !== '') {
            this.resolver.setLocalValue(context, contentKey, content);
        }
        if (template != null) {
            var result_1 = this.resolveTemplate(template, context);
            return result_1;
        }
        var result = this.resolveTemplate(content, context);
        return result;
    };
    /**
     * Resolves the provided template using a particular site document.
     * @function
     * @param {ValidatedSiteDocument} doc - site document to be used
     * @param {DOMNodeShorthandTemplate | undefined} template - template to be resolved
     * @returns {any}
     */
    SiteDocumentRenderer.prototype.resolveDocumentView = function (doc, template) {
        var context = this.createContextFor(doc);
        var result = this.resolveTemplate(template, context);
        return result;
    };
    /**
     * Resolves a template using a given set of search results.
     * @function
     * @param {ValidatedSiteDocument} source - document to be searched
     * @param {Array<ValueMap | ValidKey>} path - search path to be used
     * @param {DOMNodeShorthandTemplate | undefined} template - template to be used to display the search results
     * @returns {any}
     */
    SiteDocumentRenderer.prototype.resolveSearchView = function (source, path, templates) {
        var search = source.findContent(path);
        var index = Math.min(search.results.length, 2);
        var template = templates[index];
        if (template != null) {
            var context = this.createContextFor(source, true);
            this.resolver.setLocalValue(context, '$path', path);
            this.resolver.setLocalValue(context, '$search', search);
            if (search.results.length === 1) {
                this.resolver.setLocalValue(context, '$target', search.results[0].target);
            }
            var result = this.resolveTemplate(template, context);
            return result;
        }
    };
    return SiteDocumentRenderer;
}(dom_shorthand_templates_1.DOMTemplateRenderer));
exports.SiteDocumentRenderer = SiteDocumentRenderer;
