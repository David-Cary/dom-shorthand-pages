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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatedSearchResolver = exports.TemplatedSearchFactory = exports.IdentifiedContentRouteParser = exports.IdentifiedContentSearchParser = exports.IdentifiedContentSearchFactory = exports.IdentifiedContentSearchResolver = exports.AttributeValueSearchFactory = exports.getAttributeValue = void 0;
var page_tree_navigation_1 = require("page-tree-navigation");
var key_crawler_1 = require("key-crawler");
var keyed_value_templates_1 = require("keyed-value-templates");
/**
 * Extracts the named attribute value from the target object.
 * @function
 * @param {ValueMap} source - object the value should be extracted from
 * @param {string} attribute - name of the target attribute
 * @param {string | undefined} property - property to use if target does not have an attribute map
 * @returns {any}
 */
function getAttributeValue(source, attribute, property) {
    var attributes = source.attributes;
    if (typeof attributes === 'object' && attributes != null) {
        return attributes[attribute];
    }
    if (property != null && 'content' in source) {
        return source[property];
    }
}
exports.getAttributeValue = getAttributeValue;
/**
 * Generates rules for searching by a particular attribute value.
 * @class
 * @extends SearchTermCallbackFactory
 */
var AttributeValueSearchFactory = /** @class */ (function (_super) {
    __extends(AttributeValueSearchFactory, _super);
    function AttributeValueSearchFactory() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Helper function that produces a check for a specified attribute value against a the named property of the target search term.
     * @function
     * @param {string} property - name of the search term property to check
     * @param {string} attribute - name of the target object's attribute to check
     * @returns {SearchCheckCallback}
     */
    AttributeValueSearchFactory.prototype.createAttributeValueCheck = function (property, attribute) {
        return function (term) {
            if (typeof term === 'object' && property in term) {
                return function (state) {
                    var target = state.route.target;
                    if (typeof target === 'object' && target != null) {
                        var targetObject = target;
                        var value = getAttributeValue(targetObject, attribute, property);
                        return term[property] === value;
                    }
                    return false;
                };
            }
        };
    };
    /**
     * Creates a rule for check if the value of a specific search term property equals that of the target attribute value.
     * @function
     * @param {string} name - name of the search term property to check
     * @param {string} attribute - name of the target object's attribute to check
     * @param {boolean} shallow - if set to true the traversal will not extend to descendants of a matching node
     * @returns {SearchTermCallback}
     */
    AttributeValueSearchFactory.prototype.getAttributeValueSearch = function (name, attribute, shallow) {
        if (shallow === void 0) { shallow = false; }
        return this.getSearchCallback(this.createAttributeValueCheck(name, attribute), shallow);
    };
    return AttributeValueSearchFactory;
}(page_tree_navigation_1.SearchTermCallbackFactory));
exports.AttributeValueSearchFactory = AttributeValueSearchFactory;
/**
 * A SearchPathResolver that comes preloaded with rules for searching by id and localName properties.
 * @class
 * @extends SearchPathResolver
 */
var IdentifiedContentSearchResolver = /** @class */ (function (_super) {
    __extends(IdentifiedContentSearchResolver, _super);
    function IdentifiedContentSearchResolver(nameAttribute) {
        if (nameAttribute === void 0) { nameAttribute = 'data-local-name'; }
        var _this = _super.call(this) || this;
        /**
         * Used to produce attribute search rules.
         * @readonly
         */
        _this.searchFactory = new AttributeValueSearchFactory(new key_crawler_1.ValueVertexFactory([
            page_tree_navigation_1.getValidContentNodeVertex
        ]));
        _this.termRules.push(_this.searchFactory.getAttributeValueSearch('id', 'id'), _this.searchFactory.getAttributeValueSearch('localName', nameAttribute), _this.searchFactory.getKeyCallback());
        return _this;
    }
    return IdentifiedContentSearchResolver;
}(page_tree_navigation_1.SearchPathResolver));
exports.IdentifiedContentSearchResolver = IdentifiedContentSearchResolver;
/**
 * Generates a search path to target content item.  This allows for potentially abbreviated paths for deeply nested content.
 * @class
 * @property {string} nameAttribute - name of the local name attribute to be used
 */
var IdentifiedContentSearchFactory = /** @class */ (function () {
    function IdentifiedContentSearchFactory(nameAttribute) {
        if (nameAttribute === void 0) { nameAttribute = 'data-local-name'; }
        this.nameAttribute = nameAttribute;
    }
    /**
     * Abbreviates the provided route to it's corresponding search path, based on an id search followed by local name searches.
     * @function
     * @param {TraversalRoute} route - route to be abbreviated
     * @returns {Array<ValueMap | ValidKey>}
     */
    IdentifiedContentSearchFactory.prototype.getSearchFor = function (route) {
        var path = [];
        var copyKeys = true;
        for (var i = route.path.length - 1; i >= 0; i--) {
            var vertexIndex = i + 1;
            var target = vertexIndex < route.vertices.length
                ? route.vertices[vertexIndex].value
                : route.target;
            if (typeof target === 'object' &&
                target != null) {
                var id = getAttributeValue(target, 'id', 'id');
                if (id != null) {
                    path.unshift({ id: id });
                    break;
                }
                var localName = getAttributeValue(target, this.nameAttribute, 'localName');
                if (localName != null) {
                    path.unshift({ localName: localName });
                    copyKeys = false;
                    continue;
                }
            }
            if (copyKeys) {
                path.unshift(route.path[i]);
            }
        }
        return path;
    };
    return IdentifiedContentSearchFactory;
}());
exports.IdentifiedContentSearchFactory = IdentifiedContentSearchFactory;
/**
 * Convert string to and from a search path that uses id and localName attributes.
 * @class
 * @extends ReversibleTextParser<Array<ValueMap | ValidKey>>
 * @property {ReversibleTextParser<Record<string, string>>} paramParser - converts between a source string and a parameter map
 * @property {string} delimiter - delimiter used to split path segments
 */
var IdentifiedContentSearchParser = /** @class */ (function () {
    function IdentifiedContentSearchParser(paramParser, delimiter) {
        if (paramParser === void 0) { paramParser = new page_tree_navigation_1.KeyedSegmentsParser(['id', 'namePath', 'childPath', 'contentPath'], '/'); }
        if (delimiter === void 0) { delimiter = '.'; }
        this.paramParser = paramParser;
        this.delimiter = delimiter;
    }
    IdentifiedContentSearchParser.prototype.parse = function (source) {
        var params = this.paramParser.parse(source);
        var steps = [];
        if (params.id != null) {
            steps.push({ id: params.id });
        }
        if (params.namePath != null) {
            var names = params.namePath.split(this.delimiter);
            for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
                var localName = names_1[_i];
                steps.push({ localName: localName });
            }
        }
        if (params.childPath != null) {
            var indices = params.childPath.split(this.delimiter);
            for (var _a = 0, indices_1 = indices; _a < indices_1.length; _a++) {
                var item = indices_1[_a];
                if (item === '')
                    continue;
                steps.push('children');
                steps.push(Number(item));
            }
        }
        if (params.contentPath != null) {
            var indices = params.contentPath.split(this.delimiter);
            for (var _b = 0, indices_2 = indices; _b < indices_2.length; _b++) {
                var item = indices_2[_b];
                if (item === '')
                    continue;
                steps.push('content');
                steps.push(Number(item));
            }
        }
        return steps;
    };
    IdentifiedContentSearchParser.prototype.stringify = function (source) {
        var params = {};
        var segments = {
            namePath: [],
            childPath: [],
            contentPath: []
        };
        var targetSegment = [];
        for (var _i = 0, source_1 = source; _i < source_1.length; _i++) {
            var step = source_1[_i];
            if (typeof step === 'object') {
                if ('id' in step) {
                    params.id = String(step.id);
                }
                else if ('localName' in step) {
                    segments.namePath.push(String(step.localName));
                }
            }
            else if (step === 'children') {
                targetSegment = segments.childPath;
            }
            else if (step === 'content') {
                targetSegment = segments.contentPath;
            }
            else {
                targetSegment.push(String(step));
            }
        }
        for (var key in segments) {
            var segment = segments[key];
            if (segment.length > 0) {
                params[key] = segment.join(this.delimiter);
            }
        }
        var pathText = this.paramParser.stringify(params);
        return pathText;
    };
    return IdentifiedContentSearchParser;
}());
exports.IdentifiedContentSearchParser = IdentifiedContentSearchParser;
/**
 * Converts a string to and from a content traversal route using search by id and localName parameters.
 * @class
 * @extends RouteSearchParser
 * @property {IdentifiedContentSearchFactory} searchFactory - converts the route to a search path
 */
var IdentifiedContentRouteParser = /** @class */ (function (_super) {
    __extends(IdentifiedContentRouteParser, _super);
    function IdentifiedContentRouteParser(paramParser, nameAttribute, context) {
        if (nameAttribute === void 0) { nameAttribute = 'data-local-name'; }
        if (context === void 0) { context = []; }
        var _this = _super.call(this, new IdentifiedContentSearchParser(paramParser), new IdentifiedContentSearchResolver(nameAttribute), function (route) { return _this.searchFactory.getSearchFor(route); }, context) || this;
        _this.searchFactory = new IdentifiedContentSearchFactory(nameAttribute);
        return _this;
    }
    return IdentifiedContentRouteParser;
}(page_tree_navigation_1.RouteSearchParser));
exports.IdentifiedContentRouteParser = IdentifiedContentRouteParser;
/**
 * Generates search term rules that use the results of resolving a keyed value template.
 * @class
 * @extends SearchTermCallbackFactory
 * @property {KeyedTemplateResolver} resolver - resolves the provided search term values
 * @property {ValueMap} context - context to be used during value resolution
 */
var TemplatedSearchFactory = /** @class */ (function (_super) {
    __extends(TemplatedSearchFactory, _super);
    function TemplatedSearchFactory(vertexFactory, resolver, context) {
        if (vertexFactory === void 0) { vertexFactory = new key_crawler_1.ValueVertexFactory(); }
        if (resolver === void 0) { resolver = new keyed_value_templates_1.KeyedTemplateResolver(keyed_value_templates_1.DEFAULT_DIRECTIVES); }
        if (context === void 0) { context = {}; }
        var _this = _super.call(this, vertexFactory) || this;
        _this.resolver = resolver;
        _this.context = context;
        return _this;
    }
    /**
     * Helper function that checks for the directives key and tries reolving the search term as a keyed value template and returning true if the check passes.
     * @function
     * @returns {SearchCheckCallback}
     */
    TemplatedSearchFactory.prototype.createTemplatedCheck = function () {
        var _this = this;
        return function (term) {
            if (typeof term === 'object' && _this.resolver.directivesKey in term) {
                var localContext_1 = _this.resolver.createLocalContext(_this.context);
                return function (state) {
                    _this.resolver.setLocalValue(localContext_1, 'state', state);
                    _this.resolver.setLocalValue(localContext_1, 'value', state.route.target);
                    var value = _this.resolver.resolveValue(term, localContext_1);
                    return Boolean(value);
                };
            }
        };
    };
    /**
     * Creates a rule that tries reolving the search term as a keyed value template and returning true if the check passes.
     * @function
     * @param {boolean} shallow - if set to true the traversal will not extend to descendants of a matching node
     * @returns {SearchTermCallback}
     */
    TemplatedSearchFactory.prototype.getTemplatedSearch = function (shallow) {
        if (shallow === void 0) { shallow = false; }
        return this.getSearchCallback(this.createTemplatedCheck(), shallow);
    };
    return TemplatedSearchFactory;
}(page_tree_navigation_1.SearchTermCallbackFactory));
exports.TemplatedSearchFactory = TemplatedSearchFactory;
/**
 * A SearchPathResolver with key value template searches enabled by default.
 * @class
 * @extends SearchPathResolver
 */
var TemplatedSearchResolver = /** @class */ (function (_super) {
    __extends(TemplatedSearchResolver, _super);
    function TemplatedSearchResolver(searchFactory) {
        if (searchFactory === void 0) { searchFactory = new TemplatedSearchFactory(); }
        var _this = _super.call(this) || this;
        _this.searchFactory = searchFactory;
        _this.termRules.push(_this.searchFactory.getTemplatedSearch(), _this.searchFactory.getKeyCallback());
        return _this;
    }
    return TemplatedSearchResolver;
}(page_tree_navigation_1.SearchPathResolver));
exports.TemplatedSearchResolver = TemplatedSearchResolver;
