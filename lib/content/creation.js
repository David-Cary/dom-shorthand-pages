"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omitPageSearchIds = exports.createLinkShorthand = void 0;
var dom_shorthand_templates_1 = require("dom-shorthand-templates");
/**
 * Creates a DOM elemenent shorthand from a given hyperlink summary.
 * @function
 * @param {HyperlinkSummary} source - key hyperlink properties
 * @returns {DOMElementShorthand}
 */
function createLinkShorthand(source) {
    var attributes = {
        href: source.href
    };
    if (source.target != null) {
        attributes.target = source.target;
    }
    return {
        tag: 'a',
        attributes: attributes,
        content: [source.text]
    };
}
exports.createLinkShorthand = createLinkShorthand;
/**
 * Creates a copy of the target page tree node with the id property removed from all pages and the matching attribute removed from it's contents.
 * @function
 * @param {PageTreeNode<DOMNodeShorthandTemplate[]>} source - node to be copied
 * @returns {PageTreeNode<DOMNodeShorthandTemplate[]>}
 */
function omitPageSearchIds(source) {
    var copy = (0, dom_shorthand_templates_1.omitProperties)(source, ['id']);
    copy.content = source.content.map(function (item) { return (0, dom_shorthand_templates_1.omitNestedAttributes)(item, ['id']); });
    if (source.children != null) {
        copy.children = source.children.map(function (child) { return omitPageSearchIds(child); });
    }
    return copy;
}
exports.omitPageSearchIds = omitPageSearchIds;
