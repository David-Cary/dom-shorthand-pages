import {
  LocalNameValidator,
  ValidatedNameSearchResolver
} from "../src/index"

const samplePages = [
  {
    id: 'a',
    content: [],
    children: [
      {
        id: 'a1',
        content: [
          {
            tag: 'p',
            attributes: {
              id: 'a1-term'
            },
            content: [
              {
                tag: 'span',
                attributes: {
                  'data-local-name': 'label'
                },
                content: ['apple']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'b',
    content: [],
    children: [
      {
        localName: 'intro',
        content: []
      }
    ]
  },
  {
    localName: 'noId',
    content: [
      {
        tag: 'p',
        attributes: {
          'data-local-name': 'first'
        },
        content: ['blank']
      }
    ]
  }
]

describe("LocalNameValidator", () => {
  const validator = new LocalNameValidator()
  const namedPages = [
    {
      localName: 'intro',
      content: [],
      children: [
        {
          localName: 'terms',
          content: []
        }
      ]
    }
  ]
  const duplicates = [
    {
      id: 'intro',
      content: [
        {
          tag: 'p',
          attributes: {
            'data-local-name': 'greet'
          }
        },
        {
          tag: 'p',
          attributes: {
            'data-local-name': 'echo'
          }
        },
        {
          tag: 'p',
          attributes: {
            'data-local-name': 'echo'
          }
        }
      ],
      children: [
        {
          id: 'duo',
          content: []
        }
      ]
    },
    {
      id: 'duo',
      content: []
    }
  ]
  describe("getMatches", () => {
    test("should get id members", () => {
      const matches = validator.getMatches(samplePages)
      const ids = Object.keys(matches.idMatches)
      expect(ids).toEqual(['a', 'a1', 'a1-term', 'b'])
      const termProps = Object.keys(matches.idMatches['a1-term'][0].nameMatches)
      expect(termProps).toEqual(['label'])
      const bProps = Object.keys(matches.idMatches['b'][0].nameMatches)
      expect(bProps).toEqual(['intro'])
    })
    test("should attach to root value list if not in id owner", () => {
      const matches = validator.getMatches(namedPages)
      const names = Object.keys(matches.rootMatches)
      expect(names).toEqual(['intro'])
      const introProps = Object.keys(matches.rootMatches['intro'][0].nameMatches)
      expect(introProps).toEqual(['terms'])
    })
    test("should find multiple matches, if any", () => {
      const matches = validator.getMatches(duplicates)
      const names = Object.keys(matches.rootMatches)
      const duoMatch = Object.keys(matches.idMatches['duo'])
      expect(duoMatch.length).toEqual(2)
      const echoMatch = Object.keys(matches.idMatches['intro'][0].nameMatches['echo'])
      expect(echoMatch.length).toEqual(2)
    })
  })
  describe("validate", () => {
    test("should map unique values and capture duplicates", () => {
      const results = validator.validate(duplicates)
      const ids = Object.keys(results.idValues)
      expect(ids).toEqual(['intro'])
      const introProps = Object.keys(results.idValues['intro'].children)
      expect(introProps).toEqual(['greet'])
      const dupePaths = results.duplicates.map(item => item.search)
      expect(dupePaths).toEqual([
        [
          { id: 'intro' },
          { localName: 'echo' }
        ],
        [
          { id: 'duo' }
        ]
      ])
    })
  })
})

describe("ValidatedNameSearchResolver", () => {
  const validator = new LocalNameValidator()
  const validation = validator.validate(samplePages)
  const resolver = new ValidatedNameSearchResolver()
  describe("findNamedNode", () => {
    test("should be able to resolve nested name reference", () => {
      const response = resolver.findNamedNode(
        validation,
        [
          { id: 'b' },
          { localName: 'intro' }
        ]
      )
      expect(response.route?.path).toEqual([1, 'children', 0])
    })
    test("should be able to resolve root references", () => {
      const response = resolver.findNamedNode(
        validation,
        [
          { localName: 'noId' },
          { localName: 'first' }
        ]
      )
      expect(response.route?.path).toEqual([2, 'content', 0])
    })
  })
  describe("resolve", () => {
    test("should look up route by id and name", () => {
      const response = resolver.resolve(
        validation,
        [
          { id: 'a1-term' },
          { localName: 'label' }
        ]
      )
      const targetObject: Record<string, any> = response.results[0]?.target ?? {}
      expect(targetObject.content).toEqual(['apple'])
    })
    test("should apply remaining path once id and name are accounted for", () => {
      const response = resolver.resolve(
        validation,
        [
          { id: 'a1-term' },
          { localName: 'label' },
          'content',
          0
        ]
      )
      expect(response.results[0]?.target).toEqual('apple')
    })
    test("should be able to handle root references", () => {
      const response = resolver.resolve(
        validation,
        [
          { localName: 'noId' },
          { localName: 'first' },
          'content',
          0
        ]
      )
      expect(response.results[0]?.target).toEqual('blank')
    })
    test("should be able to standard paths", () => {
      const response = resolver.resolve(
        validation,
        [
          2,
          'content',
          0,
          'content',
          0
        ]
      )
      expect(response.results[0]?.target).toEqual('blank')
    })
  })
})
