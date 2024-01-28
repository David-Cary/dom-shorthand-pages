# DOM Shorthand Pages
This library provides support for using [Keyed Value Templates](https://www.npmjs.com/package/keyed-value-templates) to generate [DOM Shorthand](https://www.npmjs.com/package/dom-shorthand) trees.  This includes validating unique ids, searching for content nodes, and rendering resolved templates as DOM nodes.

# Quickstart
## Installation
You can install this library though npm like so:
```
$ npm install --save dom-shorthand-pages
```

## Content Searches
This library provides support for 2 new types of searches: search by attribute value and search by template resolution.

### Search by Attribute
Searches by attribute are handled by `AttributeValueSearchFactory` instances.  They do so by generating search rules that check if a specific term property equals the corresponding attribute value of the target.

`IdentifiedContentSearchResolver` comes preloaded with 2 such rules.  The first expects an object with an id property and matches against the attribute of the same name.  The second expects and object with a `localName`  property and matches it against a specific local name attribute.  Said local name attribute can be provided in the constructor and defaults to `data-local-name`.

This supports search paths like this:
```
  [
    { id: 'terms' },
    { localName: 'cardio' }
  ]
```

Note that if the target has no attributes property the property will be check directly.  For example, if the above check was done on a page instead of an element it would check the id and localName properties instead of the id and data-local-name attributes.

To take advantage of these searches, we've also provided a `IdentifiedContentSearchFactory` class.  You can pass a traversal route into the factory's `getSearchFor` function to get back a search path in the above format.  This can provide more readable and potentially shorter pathing.  For example, compare the above search path sample to a more explicit path like this:
```
  [
    'children',
    1,
    'content',
    0,
    'content',
    12
  ]
```
Note that the search factory does take in a local attribute name into it's constructor with the same `data-local-name` default the search resolver uses.

#### Route Parsing
If you want to pull a path like that from a url you can use `IdentifiedContentSearchParser`.  That parser encodes these searches by breaking it into the following parts:
  * id - Seach by element id.  Equivalent to `{ id: 'value' }`.
  * namePath - A delimited string where each term is treats as a local name search.  Each step is equivalent to `{ localName: 'value' }`.
  * childPath - A delimtied string of child indices.  Each step is equivalent to `children, index`.
  * contentPath - A delimtied string of child indices.  Each step is equivalent to `content, index`.

By default these sections are just separated by slashes with a dot delimiter, like so: `id/name1.name2/1.2/3.4`.  If you want to handle the string conversion differently, you can pass an appropriate `ReversibleTextParser` into the constructor, such as a `KeyedURLValuesParser` with a url template using the above parameter names.  You can also specify a delimiter should you want to use something other than a period.

### Search by Template
Templated searches work by checking a term for the a directive name property (defaults to the `$use` property).  If that property is found it treats the term and template and tries to resolve it, treating it as a match if the resolved value is truthy.  This allows very complex matching logic should you want it.

The rules for such searches are generated by `TemplatedSearchFactory` instances.  If you want a search resolver that comes preloaded with such rules, use `TemplatedSearchResolver`.

## Validation
We consider a DOM template tree valid if no elements in the tree share the same id attribute.  This ensure any hyperlinks by id resolve to a single element.

To support id / localName searches we also validate local name attributes.  A local name is considered valid if no other element within the nearest name or identified common ancestor shares the same name.

To actually check this, we use the `LocalNameValidator` class.  Such instances have a `validate` function that accepts an object array and returns a `LocalNameValidation` object with the following properties:
  * target - Objects validated.
  * idValues - A tree of the target objects' content where each root branch is keyed to the contents unique id attribute / property.  Further down branches are keyed by local name instead.
  * rootValues - A tree of all content with local names that don't occur inside of nodes with an id value.
  * duplicates - An array of searches by id and local name that return multiple matches.  If this has any entries the target has violated either id or local name rules.

Note that you can use the value tree properties to do an accelerated search by id and local name.  The `ValidatedNameSearchResolver` will do that for you.  Simply pass the above validation object and the search path into it's resolve function and it will return a `SearchResponse` object with routes to each matching value.

### Validated Site Documents
You can use the `ValidatedSiteDocument` to perform lazy validation on a page tree of DOM shorthand template content.  When you access the `validation` property of that object it will perform valiation on the tree pointed to by it's `source` property and return the results.  This validation is then cached until either the source or validator property changs, though you can force a refresh of that data with the `refreshValidation` function.

These objects also has a couple built in search function that get applied to that validation.  `findContent` performa a search as per the `ValidatedNameSearchResolver`, returning a SearchResponse object for all matches.  `getContentAt` retricts it's matches to unique values for a given search only.  If a search would return multiple matches it returns undefined.

## Site Document Rendering
We've provided `SiteDocumentRenderer` as a specialized `DOMTemplateRenderer` for rendering validated site documents.  In addition to the standard `renderTemplate` function, you can use `renderResolvedView` to convert resolved templates to a DOM node.  We've also provided some functions to generate said resolved templates.

### Default Context
The new resolution functions all use a copy of the renderer's default context as the resolution context.  You can set this context yourself if desired.  By default it provides access to the Array, Boolean, JSON, Math, Number, Object, and String javascript globals, as well as a TemplatedSearchResolver under the templatedSearch key.

Any resolution function that does not explicitly allow for a context will use a copy of this default context with the following added properties:
  * renderer - Reference to the renderer itself.  This is mainly used to provide access to it's utility functions, such as getSizedHeader.
  * siteDocument - Reference to the current validated site document, if any.  This is mainly used with lookup directives to retrieve values or templates from other parts of the document.

### Directives
By default these renderes use all default directives plus the following:
  * contentValue - `WrappedValueTextDirective` for letting you reference content values during resolution that will turn to text when rendered.
  * copyContent - `ContentDuplicationDirective` for letting you duplicate objects while maintaining unique ids.
  * present - `DataViewDirective` for displaying data in a particular format.
  * remap - `MapValuesDirective` for converting collections to their dom template counterparts.
  * valueText - `valueText` for converting template values to text during rendering.

### Nested Content Renders
`resolveContentView` accepts a validated document and search path.  It will then use that path to try finding the target content within the document and return a resolved version of said content if found.

Note that this context will contain a reference to the target content as under the `$target` local variable.  You can change this variable name through the 4th parameter.

You can specificy a wrapper template as the 3rd parameter.  If you do so, that template will be resolved instead.  Such templates should reference the above local variable, letting them act as wrappers for displaying the content found or showing a message when no content was found.

### Page Renders
Note that content searchs can potentially return a document pages.  Using a wrapper template can be especially useful in these cases as such pages can't be converted to DOM nodes directly.  Using a template can let you get the page into a more dom friendly format.

You can use `createPageView` to create such a template.  All you need to do is pass it a directive that references the page to be rendered, like so:
```
renderer.createPageView(
  {
    $use: 'getVar',
    path: ['$target']
  }
)
```

By itself, that will simply return an empty div with the id and local name attributes of the target page.  To actuall populate that div's content you'll need to provide it content templates as the 2nd parameter.

We've provided the following utility functions to make generating those content templates easier:
  * `createPageContentView` returns a directive for looking up the page's content.  When resolved, this will dump a copy of said page content into the div at the directive's position.
  * `createPageTitleView` returns a header containing the page's title, if it has one.  If you set this function's first parameter to true it will used the renderer's `getSizedHeader` function to use a sized header based on the page's depth.  For example, top level pages would get the "h1" tag, their children would get the "h2" tag, and so on.
  * `createSubPagesView` repeats the current template on all descendants of the current page, incrementing page depth each time it descends.

To display a full page, you'll normally want to use a title view followed by a content view, with a subpages view appended if you to display those.  However, you may want to limit this to just some sub views, such as skipping the title if it's displayed elsewhere or only using the title if displaying a summary such as table of contents or search results.

Note that createPageView does accept an attribute map as an optional 3rd parameter.  This is primarily used for attaching classes to the resulting div, though you can attach other attributes that way if desired.

### Rendering Search Results
`resolveSearchView` takes in the same validated document and search path parameters as resolveContentView, but accepts an array of templates as it's 3rd parameter.  Should it find no matches, it will use the 1st template.  On exactly 1 match, it will use the second template.  For 2 or more matches, it uses the 3rd template.  This lets you show different displays for no, one, or multiple matches on a given search.

The following local variables are attached to the context for these templates:
  * $path - The search path used.
  * $search - The results of running the site document's findContent on that search path.

For no matches, you'll usually want to just display a message to the user.  Should you want to show the search path that failed, the renderer's `getPathShorthand` may be useful.  It simply converts id search steps to "#id" string and local name search steps to "~name" strings.

Single match templates often just display the target content or page through an appropriate wrapper.

Multiple match templates can be as simple as an ambiguous result message.  This can include the number of matches through a `$search.results.length` reference.  More complex versions can use the remap directive to show previews of each match.

### Rendering Documents
`resolveDocumentView` creates a context for the provided validated site document, them resolves the provided template using that context.  This is usually used to display the entire document as a dom node.  We've provided creation functions for 2 such templates.

`createBasicDocumentView` wraps the document in a div.  That div's contents consist of the following sections:
  * If the document has style rules, start with a style block created via `createDocumentStyleView`.
  * If the document has a title, add a header element via `createDocumentTitleView`.
  * Add divs for each top level page in the document via `createDocumentPagesView`.  This template will be passed the content and attributes parameters of the createBasicDocumentView function call.

`createHTMLDocumentView` wraps the document in an html element.  The style block and title are created as above but are placed in the html element's head while the page views are placed in the element's body.  The first parameter of this function lets you attach attributes to the html element while the next two get passed on to createDocumentPagesView to control how the top level pages are displayed.

## Utility Functions
We've provided a `createLinkShorthand` function for converting hyperlink summaries generated by page tree navigator code into DOM shorthands.  There's also an `omitPageSearchIds` should you want to copy a page while retaining unique ids.

