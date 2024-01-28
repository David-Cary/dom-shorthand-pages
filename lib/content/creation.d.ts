import { type DOMElementShorthand } from 'dom-shorthand';
import { type DOMNodeShorthandTemplate } from 'dom-shorthand-templates';
import { type HyperlinkSummary, type PageTreeNode } from 'page-tree-navigation';
/**
 * Creates a DOM elemenent shorthand from a given hyperlink summary.
 * @function
 * @param {HyperlinkSummary} source - key hyperlink properties
 * @returns {DOMElementShorthand}
 */
export declare function createLinkShorthand(source: HyperlinkSummary): DOMElementShorthand;
/**
 * Creates a copy of the target page tree node with the id property removed from all pages and the matching attribute removed from it's contents.
 * @function
 * @param {PageTreeNode<DOMNodeShorthandTemplate[]>} source - node to be copied
 * @returns {PageTreeNode<DOMNodeShorthandTemplate[]>}
 */
export declare function omitPageSearchIds(source: PageTreeNode<DOMNodeShorthandTemplate[]>): PageTreeNode<DOMNodeShorthandTemplate[]>;
