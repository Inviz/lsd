/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Node
  - LSD.Element
  - LSD.Textnode
  - LSD.Comment
  - LSD.Fragment
  - LSD.Instruction
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
  childNodes: LSD.Properties.Children,
  events: LSD.Properties.Events,
  title: 'origin.title',
  origin: function(document, old) {
    if (!this.onDomReady) this.onDomReady = this.onReady.bind(this);
    Element[document ? 'addEvent' : 'removeEvent']((document || old), 'domready', this.onDomReady);
  }
})
LSD.Document.implement(LSD.Node.prototype);
LSD.Document.prototype._preconstruct = ['childNodes', 'events'];
LSD.Document.prototype.__initialize = function() {
  if (!LSD.document) LSD.document = this;
  return LSD.Element.prototype.__initialize.apply(this, arguments);
}
LSD.Document.prototype.onReady = function() {
  this.events.fire('domready', this.origin.body);
  this.set('body', this.createElement(this.origin.body));
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
  states:      {
    built:     ['build',      'destroy'],
    hidden:    ['hide',       'show'],
    disabled:  ['disable',    'enable'],
    active:    ['activate',   'deactivate'],
    focused:   ['focus',      'blur'],     
    selected:  ['select',     'unselect'], 
    chosen:    ['choose',     'forget'],
    checked:   ['check',      'uncheck'],
    open:      ['collapse',   'expand'],
    started:   ['start',      'finish'],
    empty:     ['unfill',     'fill'],
    invalid:   ['invalidate', 'validate'],
    editing:   ['edit',       'save'],
    placeheld: ['placehold',  'unplacehold'],
    invoked:   ['invoke',     'revoke']
  },
  attributes:  {
    tabindex:  Number,
    width:     Number,
    height:    Number,
    readonly:  Boolean,
    disabled:  Boolean,
    hidden:    Boolean,
    open:      Boolean,
    checked:   Boolean,
    multiple:  Boolean,
    id:        '.id',
    name:      '.name',
    title:     '.title',
    accesskey: '.accesskey',
    action:    '.action',
    href:      '.href',
    itemtype:  '.itemtype',
    radiogroup:'.radiogroup'
  },
  allocations: {
    lightbox:     'body[type=lightbox]',
    dialog:       'body[type=dialog]',
    contextmenu:  'menu[type=context]',
    toolbar:      'menu[type=toolbar]',
    scrollbar:    'input[type=range][kind=scrollbar]',
    message:      'p.message',
    container:    '.container << :inline',
    submit:       'input[type=submit]'
  },
  layers:      {
    shadow:     ['size', 'radius', 'shape',  'shadow'],
    stroke:     [        'radius', 'stroke', 'shape',  'fill'],
    background: ['size', 'radius', 'stroke', 'offset', 'shape',  'color'],
    foreground: ['size', 'radius', 'stroke', 'offset', 'shape',  'color'],
    reflection: ['size', 'radius', 'stroke', 'offset', 'shape',  'color'],
    icon:       ['size', 'scale',  'color',  'stroke', 'offset', 'shape', 'position', 'shadow'],
    glyph:      ['size', 'scale',  'color',  'stroke', 'offset', 'shape', 'position', 'shadow']
  },
  styles:      {},
  relations:   {},
  properties:  {},
  roles:       {}
});
LSD.Document.NodeTypes = {};
LSD.NodeTypes = {
  1:  'Element',
  3:  'Textnode',
  5:  'Instruction',
  8:  'Comment',
  11: 'Fragment'
};
LSD.Document.prototype.createNode = function(type, element, options) {
  var node = new (LSD[LSD.NodeTypes[type]])(element, options);
  //node.ownerDocument = this;
  return node;
};
LSD.Document.prototype.createElement = function(element, options) {
  var node = new LSD.Element(element, options);
  node.ownerDocument = this;
  return node;
};
LSD.Document.prototype.createTextNode = function(element, options) {
  var node = new LSD.Textnode(element, options);
  node.ownerDocument = this;
  return node;
};
LSD.Document.prototype.createInstruction = function(element, options) {
  var node = new LSD.Instruction(element, options);
  node.ownerDocument = this;
  return node;
};
LSD.Document.prototype.createComment = function(element, options) {
  var node = new LSD.Comment(element, options);
  node.ownerDocument = this;
  return node;
};
LSD.Document.prototype.createFragment = function(element, options) {
  var node = new LSD.Fragment(element, options);
  node.ownerDocument = this;
  return node;
};

Object.each(LSD, function(value, key) {
  if (typeof value == 'function') value.displayName = 'LSD.' + key;
})