import {
  IdentifiedContentSearchResolver,
  IdentifiedContentSearchParser,
  IdentifiedContentRouteParser,
  TemplatedSearchResolver
} from "../src/index"
import {
  KeyedURLValuesParser,
  ContentCrawler
} from 'page-tree-navigation'

const samplePages = [
  {
    id: 'intro',
    content: [
      'Welcome!'
    ]
  },
  {
    id: 'main',
    content: [],
    children: [
      {
        localName: 'terms',
        content: [
          {
            tag: 'div',
            attributes: {
              id: 'apple'
            },
            content: ['Apples are fruit.']
          }
        ]
      },
      {
        localName: 'examples',
        content: [
          {
            tag: 'div',
            attributes: {
              'data-local-name': 'sampleOrder'
            },
            content: ["6 apples for $5"]
          }
        ]
      }
    ]
  }
]

describe("IdentifiedContentSearchResolver", () => {
  const resolver = new IdentifiedContentSearchResolver()
  describe("resolve", () => {
    test("should be able to look up by id and local name attributes", () => {
      const search = resolver.resolve(
        samplePages,
        [
          { id: 'main' },
          { localName: 'examples' },
          { localName: 'sampleOrder' },
          'content',
          0
        ]
      )
      expect(search.results.length).toEqual(1)
      expect(search.results[0]?.target).toEqual('6 apples for $5')
    })
    test("should work on nested element ids", () => {
      const search = resolver.resolve(
        samplePages,
        [
          { id: 'apple' },
          'content',
          0
        ]
      )
      expect(search.results.length).toEqual(1)
      expect(search.results[0]?.target).toEqual('Apples are fruit.')
    })
  })
})

describe("IdentifiedContentSearchParser", () => {
  const slashParser = new IdentifiedContentSearchParser()
  const urlParser = new IdentifiedContentSearchParser(
    new KeyedURLValuesParser(
      {
        origin: 'http://my.site',
        path: [
          'view'
        ],
        hash: { key: 'id' },
        search: {
          namePath: { key: 'namePath' },
          childPath: { key: 'childPath' },
          contentPath: { key: 'contentPath' }
        }
      }
    )
  )
  describe("parse", () => {
    test("should extract parameters", () => {
      const path = slashParser.parse("main/terms.apple/0.1/1.0")
      expect(path).toEqual([
        { id: 'main' },
        { localName: 'terms' },
        { localName: 'apple' },
        'children',
        0,
        'children',
        1,
        'content',
        1,
        'content',
        0
      ])
    })
    test("should support url parser", () => {
      const path = urlParser.parse(
        "http://my.site/view?namePath=terms.apple&childPath=0.1&contentPath=1.0#main"
      )
      expect(path).toEqual([
        { id: 'main' },
        { localName: 'terms' },
        { localName: 'apple' },
        'children',
        0,
        'children',
        1,
        'content',
        1,
        'content',
        0
      ])
    })
  })
  describe("stringify", () => {
    test("should encode segments", () => {
      const text = slashParser.stringify([
        { id: 'main' },
        { localName: 'terms' },
        { localName: 'apple' },
        'children',
        0,
        'children',
        1,
        'content',
        1,
        'content',
        0
      ])
      expect(text).toEqual("main/terms.apple/0.1/1.0")
    })
    test("should support url parser", () => {
      const text = urlParser.stringify([
        { id: 'main' },
        { localName: 'terms' },
        { localName: 'apple' },
        'children',
        0,
        'children',
        1,
        'content',
        1,
        'content',
        0
      ])
      expect(text).toEqual(
        "http://my.site/view?namePath=terms.apple&childPath=0.1&contentPath=1.0#main"
      )
    })
  })
})

describe("IdentifiedContentRouteParser", () => {
  const parser = new IdentifiedContentRouteParser()
  parser.context = samplePages
  describe("parse", () => {
    test("should resolve path to a route", () => {
      const route = parser.parse("main/examples.sampleOrder//0")
      expect(route.target).toEqual("6 apples for $5")
    })
  })
  describe("stringify", () => {
    test("should get path text for route", () => {
      const crawler = new ContentCrawler()
      const route = crawler.createRouteFrom(
        samplePages,
        [1, "children", 1, "content", 0, "content", 0]
      )
      const pathText = parser.stringify(route)
      expect(pathText).toEqual("main/examples.sampleOrder//0")
    })
  })
})

describe("TemplatedSearchResolver", () => {
  const resolver = new TemplatedSearchResolver()
  describe("resolve", () => {
    test("should be able to find content by attribute value", () => {
      const search = resolver.resolve(
        [
          {
            tag: 'p',
            attributes: {
              class: 'odd'
            },
            content: '1st'
          },
          {
            tag: 'p',
            attributes: {
              class: 'even'
            },
            content: '2nd'
          },
          {
            tag: 'p',
            attributes: {
              class: 'odd'
            },
            content: '3rd'
          },
          {
            tag: 'p',
            attributes: {
              class: 'even'
            },
            content: '4th'
          }
        ],
        [
          {
            $use: '==',
            args: [
              {
                $use: 'getVar',
                path: [
                  'value',
                  'attributes',
                  'class'
                ]
              },
              'odd'
            ]
          }
        ]
      )
      const targets = search.results.map(route => route.target)
      expect(targets).toEqual([
        {
          tag: 'p',
          attributes: {
            class: 'odd'
          },
          content: '1st'
        },
        {
          tag: 'p',
          attributes: {
            class: 'odd'
          },
          content: '3rd'
        }
      ])
    })
  })
})
