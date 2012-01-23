/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Element
  - LSD.Fragment
  - LSD.Textnode
  - LSD.Instruction
  - LSD.Comment
  - Core/DomReady
  - Core/Options
  - Core/Events
  - More/String.QueryString
  - LSD
  - LSD.Module.Attributes
  - LSD.Module.Properties
  - LSD.Module.Render
  - LSD.Module.Selectors

provides:
  - LSD.Document

...
*/


/*
  Document is a big disguise proxy class that contains the tree
  of widgets and a link to document element.
  
  It is DOM-compatible (to some degree), so tools that crawl DOM
  tree (we use Slick) can work with the widget tree like it usually
  does with the real DOM so we get selector engine for free.
  
  The document itself is not in the tree, it's a container.
  
  The class contains a few hacks that allows Slick to initialize.
*/

LSD.Document = LSD.Struct({
  attributes: 'Attributes',
  childNodes: 'Children'
});

LSD.NodeTypes = {
  1: 'element',
  3: 'textnode',
  5: 'instruction',
  8: 'comment',
  11: 'fragment'
};
LSD.Document.NodeTypes = {};
Object.each(LSD.NodeTypes, function(name, index) {
  LSD.Document.NodeTypes[index] = LSD[name.capitalize()];
  LSD.Document.prototype['create' + name.capitalize()] = function(element, options) {
    return LSD.Document.NodeTypes[index](element, options);
  }
});