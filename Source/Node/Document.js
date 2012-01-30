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

LSD.Document = LSD.Struct.Stack({
  childNodes: 'Children',
  title: 'origin.title',
  origin: function(document, old) {
    if (!this.onDomReady) this.onDomReady = this.onReady.bind(this);
    Element[document ? 'addEvent' : 'removeEvent']((document || old), 'domready', this.onDomReady);
  }
});
LSD.Document.prototype._preconstruct = ['childNodes', 'events'];
LSD.Document.prototype.__initialize = LSD.Element.prototype.__initialize;
LSD.Document.prototype.onReady = function() {
  this.fireEvent('domready', this.origin.body);
  this.set('body', this.createElement(this.origin.body));
};
LSD.Document.prototype.createNode = function(type, element, options) {
  return new (LSD.Document.NodeTypes[type])(element, options).mix('document', this);
};
/*
  The following is a basic set of structures that every
  LSD namespace implements. Those are global objects
  that customize the behavior of widgets by providing 
  reusable pieces of configuration and defining various
  possible collections.
  
  For example LSD.attributes contains functions that are
  called whenever a widget in that namespaces recieves
  by that name. 
  
  LSD.relations provides a set of preconfigured relations 
  that can be further customized for each of the widgets.  
*/
LSD.Document.prototype.mix({
  roles:       {},
  layers:      {},
  states:      {},
  styles:      {},
  relations:   {},
  attributes:  {},
  properties:  {},
  allocations: {}
});
LSD.NodeTypes = {
  1:  'element',
  3:  'textnode',
  5:  'instruction',
  8:  'comment',
  11: 'fragment'
};
LSD.Document.NodeTypes = {};
Object.each(LSD.NodeTypes, function(name, type) {
  var capitalized = name.capitalize();
  LSD.Document.NodeTypes[type] = LSD[capitalized];
  LSD.Document.prototype['create' + capitalized] = function(element, options) {
    return new LSD.Document.NodeTypes[type](element, options).mix('document', this);
  }
});
LSD.Document.prototype.createTextNode = LSD.Document.prototype.createText = LSD.Document.prototype.createTextnode;