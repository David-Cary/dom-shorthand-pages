"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatedNameSearchResolver = exports.LocalNameValidator = void 0;
var key_crawler_1 = require("key-crawler");
var page_tree_navigation_1 = require("page-tree-navigation");
var search_1 = require("./search");
/**
 * Checks content trees for duplicate ids or duplicate local names with a particular context.
 * @class
 * @property {string} nameAttribute - attribute name to be use for local name resolution
 * @property {DepthFirstSearch} depthSearch - handler for depth first search functionality
 * @property {ValueVertexFactory} vertexFactory - used to generate route vertices
 */
var LocalNameValidator = /** @class */ (function () {
    function LocalNameValidator(nameAttribute) {
        if (nameAttribute === void 0) { nameAttribute = 'data-local-name'; }
        this.depthSearch = new key_crawler_1.DepthFirstSearch();
        this.vertexFactory = new key_crawler_1.ValueVertexFactory([
            page_tree_navigation_1.getValidContentNodeVertex
        ]);
        this.nameAttribute = nameAttribute;
    }
    /**
     * Maps a target object's contents by their id or local name.
     * @function
     * @param {ValueMap[]} source - object to be evaluated
     * @returns {LocalNameMatches}
     */
    LocalNameValidator.prototype.getMatches = function (source) {
        var _this = this;
        var matches = {
            source: source,
            idMatches: {},
            rootMatches: {}
        };
        var contextStack = [];
        this.depthSearch.startPhasedTraversal(source, function (state) {
            var target = state.route.target;
            if (typeof target === 'object' &&
                target != null &&
                !Array.isArray(target)) {
                var match = void 0;
                var id = (0, search_1.getAttributeValue)(target, 'id', 'id');
                if (id != null) {
                    if (matches.idMatches[id] == null) {
                        matches.idMatches[id] = [];
                    }
                    match = {
                        route: (0, key_crawler_1.cloneRoute)(state.route),
                        nameMatches: {}
                    };
                    matches.idMatches[id].push(match);
                }
                var name_1 = (0, search_1.getAttributeValue)(target, _this.nameAttribute, 'localName');
                if (name_1 != null) {
                    if (match == null) {
                        match = {
                            route: (0, key_crawler_1.cloneRoute)(state.route),
                            nameMatches: {}
                        };
                    }
                    if (contextStack.length > 0) {
                        var context = contextStack[0];
                        if (context.nameMatches[name_1] == null) {
                            context.nameMatches[name_1] = [];
                        }
                        context.nameMatches[name_1].push(match);
                    }
                    else {
                        if (matches.rootMatches[name_1] == null) {
                            matches.rootMatches[name_1] = [];
                        }
                        matches.rootMatches[name_1].push(match);
                    }
                }
                if (match != null) {
                    contextStack.unshift(match);
                }
            }
        }, function (state) {
            var context = contextStack[0];
            if ((context === null || context === void 0 ? void 0 : context.route.target) === state.route.target) {
                contextStack.shift();
            }
        }, this.vertexFactory);
        return matches;
    };
    /**
     * Retrieves a copy of the target map that only contains entries with a single route for a given key.
     * @function
     * @param {Record<string, NamedContentMatchNode[]>} source - object to be evaluated
     * @param {AmbiguousContentSearchResult[] | undefined} duplicates - destination for storing any branches with multiple routes for a given key
     * @param {string} searchProperty - name of the local name property
     * @param {Array<ValueMap | ValidKey>} path - current traversal path
     * @returns {Record<string, NamedContentTraversalNode>}
     */
    LocalNameValidator.prototype.getUniqueNamesIn = function (source, duplicates, searchProperty, path) {
        var _a;
        if (searchProperty === void 0) { searchProperty = 'localName'; }
        if (path === void 0) { path = []; }
        var uniques = {};
        for (var key in source) {
            path.push((_a = {},
                _a[searchProperty] = key,
                _a));
            var matches = source[key];
            if (matches.length === 1) {
                var match = matches[0];
                uniques[key] = {
                    route: match.route,
                    children: this.getUniqueNamesIn(match.nameMatches, duplicates, 'localName', path)
                };
            }
            else if (duplicates != null) {
                duplicates.push({
                    search: path.slice(),
                    results: matches.map(function (match) { return match.route; })
                });
            }
            path.pop();
        }
        return uniques;
    };
    /**
     * Check if the ids and local names of each object's contents follow uniqueness rules.
     * (No duplicate ids and no duplicate local names with the same named/identified parent.)
     * @function
     * @param {ValueMap[]} source - objects to be evaluated
     * @returns {LocalNameValidation}
     */
    LocalNameValidator.prototype.validate = function (source) {
        var matches = this.getMatches(source);
        var results = this.validateMatches(matches);
        return results;
    };
    /**
     * Extracts duplicate id / local name entries into their own list and creates trees of
     * such nodes with only one match per key.
     * @function
     * @param {LocalNameMatches} matches - content mapping to be evaluated
     * @returns {LocalNameValidation}
     */
    LocalNameValidator.prototype.validateMatches = function (matches) {
        var duplicates = [];
        var results = {
            target: matches.source,
            idValues: this.getUniqueNamesIn(matches.idMatches, duplicates, 'id'),
            rootValues: this.getUniqueNamesIn(matches.rootMatches, duplicates),
            duplicates: duplicates
        };
        return results;
    };
    return LocalNameValidator;
}());
exports.LocalNameValidator = LocalNameValidator;
/**
 * Provides functionality for searching id / local name mapping, allowing for faster content searches.
 * @class
 * @extends DOMTemplateRenderer
 * @property {IdentifiedContentSearchResolver} subsearchResolver - used to resolve the remainder of a search once id and local name are resolved
 */
var ValidatedNameSearchResolver = /** @class */ (function () {
    function ValidatedNameSearchResolver(nameAttribute) {
        if (nameAttribute === void 0) { nameAttribute = 'data-local-name'; }
        this.subsearchResolver = new search_1.IdentifiedContentSearchResolver(nameAttribute);
    }
    /**
     * Tries to find matching content within validate content mapping for a given search path.
     * @function
     * @param {LocalNameValidation} context - content mapping to be searched
     * @param {Array<ValueMap | ValidKey>} path - search steps to be applied
     * @param {number | undefined} maxResults - exit early if we hit this many matches
     * @returns {SearchResponse}
     */
    ValidatedNameSearchResolver.prototype.resolve = function (context, path, maxResults) {
        var nameSearch = this.findNamedNode(context, path);
        if (nameSearch.route != null) {
            var response = {
                state: {
                    route: (0, key_crawler_1.cloneRoute)(nameSearch.route),
                    visited: [],
                    completed: false
                },
                results: []
            };
            if (nameSearch.subpath.length > 0) {
                this.subsearchResolver.extendSearch(response, nameSearch.subpath, maxResults);
            }
            else {
                response.results.push(nameSearch.route);
            }
            response.state.completed = true;
            return response;
        }
        var delegated = this.subsearchResolver.resolve(context.target, path, maxResults);
        return delegated;
    };
    /**
     * Find a named node within a LocalNameValidation.
     * @function
     * @param {LocalNameValidation} context - content mapping to be searched
     * @param {Array<ValueMap | ValidKey>} path - steps to find the target content
     * @returns {PartialSearchResolution}
     */
    ValidatedNameSearchResolver.prototype.findNamedNode = function (context, path) {
        if (path.length > 0) {
            var firstStep = path[0];
            if (typeof firstStep === 'object') {
                if ('id' in firstStep) {
                    var id = String(firstStep.id);
                    var identifiedItem = context.idValues[id];
                    if (identifiedItem != null) {
                        var subpath = path.slice(1);
                        if (subpath.length < 1) {
                            return {
                                route: identifiedItem.route,
                                subpath: subpath
                            };
                        }
                        var response = this.findNamedChildNode(identifiedItem, subpath);
                        return response;
                    }
                }
                else if ('localName' in firstStep) {
                    var name_2 = String(firstStep.localName);
                    var namedItem = context.rootValues[name_2];
                    if (namedItem != null) {
                        var subpath = path.slice(1);
                        if (subpath.length < 1) {
                            return {
                                route: namedItem.route,
                                subpath: subpath
                            };
                        }
                        var response = this.findNamedChildNode(namedItem, subpath);
                        return response;
                    }
                }
            }
        }
        return {
            subpath: []
        };
    };
    /**
     * Helper function for looking within a particular content mapping for a node with a given key / name.
     * @function
     * @param {NamedContentTraversalNode} context - content mapping node to be searched
     * @param {Array<ValueMap | ValidKey>} path - steps to find the target content
     * @returns {PartialSearchResolution}
     */
    ValidatedNameSearchResolver.prototype.findNamedChildNode = function (context, path) {
        if (path.length > 0) {
            var firstStep = path[0];
            if (typeof firstStep === 'object') {
                if ('localName' in firstStep) {
                    var name_3 = String(firstStep.localName);
                    var child = context.children[name_3];
                    if (child != null) {
                        var subpath = path.slice(1);
                        if (subpath.length < 1) {
                            return {
                                route: child.route,
                                subpath: subpath
                            };
                        }
                        var response = this.findNamedChildNode(child, subpath);
                        return response;
                    }
                }
            }
        }
        return {
            subpath: []
        };
    };
    return ValidatedNameSearchResolver;
}());
exports.ValidatedNameSearchResolver = ValidatedNameSearchResolver;
