import {
  type DOMElementShorthand
} from 'dom-shorthand'
import {
  type DOMNodeShorthandTemplate,
  omitNestedAttributes,
  omitProperties
} from 'dom-shorthand-templates'
import {
  type HyperlinkSummary,
  type PageTreeNode
} from 'page-tree-navigation'

/**
 * Creates a DOM elemenent shorthand from a given hyperlink summary.
 * @function
 * @param {HyperlinkSummary} source - key hyperlink properties
 * @returns {DOMElementShorthand}
 */
export function createLinkShorthand (
  source: HyperlinkSummary
): DOMElementShorthand {
  const attributes: Record<string, string> = {
    href: source.href
  }
  if (source.target != null) {
    attributes.target = source.target
  }
  return {
    tag: 'a',
    attributes,
    content: [source.text]
  }
}

/**
 * Creates a copy of the target page tree node with the id property removed from all pages and the matching attribute removed from it's contents.
 * @function
 * @param {PageTreeNode<DOMNodeShorthandTemplate[]>} source - node to be copied
 * @returns {PageTreeNode<DOMNodeShorthandTemplate[]>}
 */
export function omitPageSearchIds (
  source: PageTreeNode<DOMNodeShorthandTemplate[]>
): PageTreeNode<DOMNodeShorthandTemplate[]> {
  const copy = omitProperties(source, ['id']) as PageTreeNode<DOMNodeShorthandTemplate[]>
  copy.content = source.content.map(
    item => omitNestedAttributes(item, ['id'])
  )
  if (source.children != null) {
    copy.children = source.children.map(
      child => omitPageSearchIds(child)
    )
  }
  return copy
}
