import {
  SiteDocumentRenderer,
  ValidatedSiteDocument
} from "../src/index"
import {
  type DOMNodeShorthandTemplate,
  ContentDuplicationDirective
} from 'dom-shorthand-templates'
import {
  type PageTreeNode
} from 'page-tree-navigation'
import {
  KeyedTemplateResolver,
  DEFAULT_DIRECTIVES
} from 'keyed-value-templates'

const sampleDocument = new ValidatedSiteDocument({
  id: 'sampleDoc',
  title: 'Sample Document',
  style: [
    {
      selector: '.indented',
      values: {
        'margin-left': '4px'
      }
    }
  ],
  pages: [
    {
      id: 'intro',
      title: 'Intro',
      content: ['Hi there!']
    },
    {
      id: 'math',
      title: "Math Examples",
      content: ['math test'],
      children: [
        {
          localName: 'roundEx',
          content: [
            {
              tag: 'p',
              content: [
                'x = ',
                {
                  tag: 'span',
                  attributes: {
                    'data-local-name': 'x'
                  },
                  content: {
                    $use: 'contentValue',
                    value: 2.4
                  }
                }
              ]
            },
            {
              tag: 'p',
              attributes: {
                'data-local-name': 'rounded'
              },
              content: [
                'x rounds to ',
                {
                  $use: 'get',
                  path: [
                    'Math',
                    {
                      name: 'round',
                      args: [
                        {
                          $use: 'get',
                          path: [
                            'siteDocument',
                            {
                              name: 'getContentAt',
                              args: [
                                [
                                  { id: 'math' },
                                  { localName: 'roundEx' },
                                  { localName: 'x' },
                                  'content',
                                  'value'
                                ]
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
})

const ambiguousDocument = new ValidatedSiteDocument({
  pages: [
    {
      id: 'duo',
      title: 'First',
      content: ['p1']
    },
    {
      id: 'duo',
      title: 'Second',
      content: ['p2']
    }
  ]
})

describe("ValidatedSiteDocument", () => {
  describe("findContent", () => {
    test("should resolve content using provided path", () => {
      const search = sampleDocument.findContent([
        { id: 'intro' },
        'content'
      ])
      expect(search.results[0]?.target).toEqual(['Hi there!'])
    })
  })
})

describe("SiteDocumentRenderer", () => {
  const renderer = new SiteDocumentRenderer()
  describe("createContextFor", () => {
    test("should attach site document reference", () => {
      const context = renderer.createContextFor(sampleDocument)
      expect(context.siteDocument).toEqual(sampleDocument)
    })
  })
  describe("resolveContentView", () => {
    test("should resolve found content by default", () => {
      const result = renderer.resolveContentView(
        sampleDocument,
        [
          { id: 'intro' }
        ]
      )
      expect(result).toEqual(
        sampleDocument.source.pages[0]
      )
    })
    test("should use template if one is provided", () => {
      const result = renderer.resolveContentView(
        sampleDocument,
        [
          { id: 'intro' }
        ],
        {
          tag: 'p',
          content: {
            $use: 'getVar',
            path: [
              '$target',
              'content'
            ]
          }
        }
      )
      expect(result).toEqual({
        tag: 'p',
        content: ['Hi there!']
      })
    })
    test("should support element reuse", () => {
      const reuseDocument = new ValidatedSiteDocument({
        pages: [
          {
            content: [
              {
                tag: 'p',
                content: [
                  "Here's an example of bracketed text: ",
                  {
                    tag: 'span',
                    attributes: {
                      id: 'bracketed'
                    },
                    content: [
                      {
                        $use: '+',
                        args: [
                          '[',
                          {
                            $use: 'coalesce',
                            args: [
                              {
                                $use: 'getVar',
                                path: ['text']
                              },
                              "value"
                            ]
                          },
                          ']'
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                tag: 'p',
                attributes: {
                  id: 'copyBlock'
                },
                content: [
                  {
                    $use: 'copyContent',
                    source: {
                      $use: 'get',
                      path: [
                        'siteDocument',
                        {
                          name: 'getContentAt',
                          args: [
                            [
                              {
                                id: 'bracketed'
                              }
                            ]
                          ]
                        }
                      ]
                    },
                    attributes: {
                      'data-local-name': 'example'
                    },
                    data: {
                      text: "test"
                    }
                  }
                ]
              }
            ]
          }
        ]
      })
      const result = renderer.resolveContentView(
        reuseDocument,
        [
          {
            id: 'copyBlock'
          }
        ]
      )
      expect(result).toEqual({
        tag: 'p',
        attributes: {
          id: 'copyBlock'
        },
        content: [
          {
            tag: 'span',
            attributes: {
              'data-local-name': 'example'
            },
            content: ["[test]"]
          }
        ]
      })
    })
  })
  describe("createPageView", () => {
    const targetPageRef = {
      $use: 'getVar',
      path: ['$target']
    }
    test("should extract attributes from page", () => {
      const result = renderer.resolveContentView(
        sampleDocument,
        [
          { id: 'intro' }
        ],
        renderer.createPageView(targetPageRef)
      )
      expect(result).toEqual({
        tag: 'div',
        attributes: {
          id: 'intro'
        },
        content: []
      })
    })
    test("should use provided attribute defaults", () => {
      const result = renderer.resolveContentView(
        sampleDocument,
        [
          { id: 'intro' }
        ],
        renderer.createPageView(
          targetPageRef,
          [],
          {
            class: 'page'
          }
        )
      )
      expect(result).toEqual({
        tag: 'div',
        attributes: {
          id: 'intro',
          class: 'page'
        },
        content: []
      })
    })
    test("should support copying page content", () => {
      const result = renderer.resolveContentView(
        sampleDocument,
        [
          { id: 'intro' }
        ],
        renderer.createPageView(
          targetPageRef,
          [
            renderer.createPageContentView()
          ]
        )
      )
      expect(result).toEqual({
        tag: 'div',
        attributes: {
          id: 'intro'
        },
        content: ["Hi there!"]
      })
    })
    test("should prepend titles with createPageTitleView", () => {
      const result = renderer.resolveContentView(
        sampleDocument,
        [
          { id: 'intro' }
        ],
        renderer.createPageView(
          targetPageRef,
          [
            renderer.createPageTitleView(true),
            renderer.createPageContentView()
          ]
        )
      )
      expect(result).toEqual({
        tag: 'div',
        attributes: {
          id: 'intro'
        },
        content: [
          {
            tag: 'h1',
            content: ["Intro"]
          },
          "Hi there!"
        ]
      })
    })
    test("should show subpages with createSubPagesView", () => {
      const result = renderer.resolveContentView(
        new ValidatedSiteDocument({
          pages: [
            {
              id: "p1",
              title: "Page 1",
              content: ["First page."],
              children: [
                {
                  id: "p1-1",
                  title: "Page 1-1",
                  content: ["First subpage."],
                  children: [
                    {
                      id: "p1-1-1",
                      title: "Page 1-1-1",
                      content: ["Nested page."]
                    }
                  ]
                }
              ]
            }
          ]
        }),
        [
          { id: 'p1' }
        ],
        renderer.createPageView(
          targetPageRef,
          [
            renderer.createPageTitleView(true),
            renderer.createPageContentView(),
            renderer.createSubPagesView()
          ]
        )
      )
      expect(result).toEqual({
        tag: 'div',
        attributes: {
          id: 'p1'
        },
        content: [
          {
            tag: 'h1',
            content: ["Page 1"]
          },
          "First page.",
          {
            tag: 'div',
            attributes: {
              id: 'p1-1'
            },
            content: [
              {
                tag: 'h2',
                content: ["Page 1-1"]
              },
              "First subpage.",
              {
                tag: 'div',
                attributes: {
                  id: 'p1-1-1'
                },
                content: [
                  {
                    tag: 'h3',
                    content: ["Page 1-1-1"]
                  },
                  "Nested page."
                ]
              }
            ]
          }
        ]
      })
    })
  })
  describe("resolveDocumentView", () => {
    const sampleStyleBlock = {
      tag: 'style',
      content: [".indented{margin-left:4px}"]
    }
    const nestedPagesContentView = [
      renderer.createPageTitleView(true),
      renderer.createPageContentView(),
      renderer.createSubPagesView()
    ]
    const nestedPageResults = [
      {
        tag: 'div',
        attributes: {
          id: 'intro'
        },
        content: [
          {
            tag: 'h1',
            content: ["Intro"]
          },
          "Hi there!"
        ]
      },
      {
        tag: 'div',
        attributes: {
          id: 'math'
        },
        content: [
          {
            tag: 'h1',
            content: ["Math Examples"]
          },
          "math test",
          {
            tag: 'div',
            attributes: {
              'data-local-name': 'roundEx'
            },
            content: [
              {
                tag: 'p',
                content: [
                  'x = ',
                  {
                    tag: 'span',
                    attributes: {
                      'data-local-name': 'x'
                    },
                    content: ["2.4"]
                  }
                ]
              },
              {
                tag: 'p',
                attributes: {
                  'data-local-name': 'rounded'
                },
                content: [
                  'x rounds to ',
                  2
                ]
              }
            ]
          }
        ]
      }
    ]
    test("should get pages with createDocumentPagesView", () => {
      const results = renderer.resolveDocumentView(
        sampleDocument,
        renderer.createDocumentPagesView(
          nestedPagesContentView
        )
      )
      expect(results).toEqual(nestedPageResults)
    })
    test("should generate title header with createDocumentTitleView", () => {
      const results = renderer.resolveDocumentView(
        sampleDocument,
        renderer.createDocumentTitleView('header')
      )
      expect(results).toEqual({
        tag: 'header',
        content: ["Sample Document"]
      })
    })
    test("should generate style block with createDocumentStyleView", () => {
      const results = renderer.resolveDocumentView(
        sampleDocument,
        renderer.createDocumentStyleView()
      )
      expect(results).toEqual(sampleStyleBlock)
    })
    test("should create a single element preview with createBasicDocumentView", () => {
      const results = renderer.resolveDocumentView(
        sampleDocument,
        renderer.createBasicDocumentView(
          nestedPagesContentView
        )
      )
      expect(results).toEqual({
        tag: 'div',
        attributes: {
          id: 'sampleDoc'
        },
        content: ([
          sampleStyleBlock,
          {
            tag: 'header',
            content: ["Sample Document"]
          }
        ] as any[]).concat(nestedPageResults)
      })
    })
    test("should export as html with createHTMLDocumentView", () => {
      const results = renderer.resolveDocumentView(
        sampleDocument,
        renderer.createHTMLDocumentView(
          {
            lang: 'en-US'
          },
          nestedPagesContentView
        )
      )
      expect(results).toEqual({
        tag: 'html',
        attributes: {
          id: 'sampleDoc',
          lang: 'en-US'
        },
        content: [
          {
            tag: 'head',
            content: [
              {
                tag: 'title',
                content: ["Sample Document"]
              },
              sampleStyleBlock
            ]
          },
          {
            tag: 'body',
            content: nestedPageResults
          }
        ]
      })
    })
  })
  describe("resolveSearchView", () => {
    const searchViewTemplates = [
      {
        tag: 'p',
        content: [
          {
            $use: '+',
            args: [
              "No matches found for ",
              {
                $use: 'get',
                path: [
                  'renderer',
                  {
                    name: 'getPathShorthand',
                    args: [
                      {
                        $use: 'getVar',
                        path: ['$path']
                      }
                    ]
                  }
                ]
              },
              "."
            ]
          }
        ]
      },
      renderer.createPageView(
        {
          $use: 'getVar',
          path: ['$target']
        },
        [
          renderer.createPageTitleView(true),
          renderer.createPageContentView(),
        ]
      ),
      {
        tag: 'div',
        content: [
          {
            tag: 'p',
            content: [
              {
                $use: '+',
                args: [
                  {
                    $use: 'getVar',
                    path: [
                      '$search',
                      'results',
                      'length'
                    ]
                  },
                  " matches found for ",
                  {
                    $use: 'get',
                    path: [
                      'renderer',
                      {
                        name: 'getPathShorthand',
                        args: [
                          {
                            $use: 'getVar',
                            path: ['$path']
                          }
                        ]
                      }
                    ]
                  },
                  ":"
                ]
              }
            ]
          },
          {
            tag: 'ul',
            content: {
              $use: 'remap',
              source: {
                $use: 'getVar',
                path: [
                  '$search',
                  'results'
                ]
              },
              getValue: {
                tag: 'li',
                content: [
                  {
                    $use: 'coalesce',
                    args: [
                      {
                        $use: 'getVar',
                        path: [
                          '$value',
                          'target',
                          'title'
                        ]
                      },
                      '-untitled item-'
                    ]
                  }
                ]
              }
            }
          }
        ]
      }
    ]
    test("should use template 0 if there are no matches", () => {
      const result = renderer.resolveSearchView(
        sampleDocument,
        [
          {
            id: '_na'
          },
          {
            localName: 'prop'
          },
          0
        ],
        searchViewTemplates
      )
      expect(result).toEqual({
        tag: 'p',
        content: ["No matches found for #_na.~prop.0."]
      })
    })
    test("should use template 1 if there is a single match", () => {
      const result = renderer.resolveSearchView(
        sampleDocument,
        [
          {
            id: 'intro'
          }
        ],
        searchViewTemplates
      )
      expect(result).toEqual({
        tag: 'div',
        attributes: {
          id: 'intro'
        },
        content: [
          {
            tag: 'h1',
            content: ["Intro"]
          },
          "Hi there!"
        ]
      })
    })
    test("should use template 2 if there are multiple matches", () => {
      const result = renderer.resolveSearchView(
        ambiguousDocument,
        [
          {
            id: 'duo'
          }
        ],
        searchViewTemplates
      )
      expect(result).toEqual({
        tag: 'div',
        content: [
          {
            tag: 'p',
            content: ["2 matches found for #duo:"]
          },
          {
            tag: 'ul',
            content: [
              {
                tag: 'li',
                content: ["First"]
              },
              {
                tag: 'li',
                content: ["Second"]
              }
            ]
          }
        ]
      })
    })
  })
})
