/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Node
  - Core/DomReady

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
  childNodes: LSD.Properties.ChildNodes,
  events: LSD.Properties.Events,
  title: 'origin.title',
  ready: function() {
    this.set('body', this.createElement(this.origin.body));
  },
  origin: function(document, old) {
    this.set('title', document.title);
    if (!this.onDomReady) this.onDomReady = this.onReady.bind(this);
    Element[document ? 'addEvent' : 'removeEvent']((document || old), 'domready', this.onDomReady);
  },
/*
  Sets a currently focused element in a document. When changing
  from one to another, it keeps shared ancestors focused and
  only blurs an unshared subtree. It also may focus an element
  that is ancestor of currently focused element by blurring
  the nodes.
*/
  activeElement: function(element, old, meta) {
    if (element && meta !== false && !element.set('focused', true)) {
      if (old) for (; old != element; old = old.parentNode) old.unset('focused', true, element)
    } else if (old) old.unset('focused', true)
  }
}, 'Journal')
LSD.Document.prototype.nodeType = 9;
LSD.Document.implement(LSD.Node.prototype);
LSD.Document.prototype._preconstruct = ['childNodes', 'events'];
LSD.Document.prototype.__initialize = function() {
  if (!LSD.document) LSD.document = this;
  return LSD.Element.prototype.__initialize.apply(this, arguments);
}
LSD.Document.prototype.onReady = function() {
  this.set('ready', true)
};
LSD.Document.NodeTypes = {};
LSD.NodeTypes = {
  1:  'Element',
  3:  'Textnode',
  7:  'Instruction',
  8:  'Comment',
  9:  'Document',
  11: 'Fragment'
};
LSD.Document.prototype.createNode = function(type, element, options, fragment) {
  return new (LSD[LSD.NodeTypes[type]])(element, options, this, fragment);
};
Object.each(LSD.NodeTypes, function(value, key) {
  LSD.Document.prototype['create' + value] = function(element, options, fragment) {
    return new LSD[value](element, options, this, fragment)
  }
})
Object.each(LSD, function(value, key) {
  if (typeof value == 'function') value.displayName = 'LSD.' + key;
})