/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Node

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
      if (old) for (; old != element; old = old.parentNode) old.set('focused', undefined, true, element)
    } else if (old) old.set('focused', undefined, true)
  },
  body: function(value, old, meta) {
    var events = this.events;
    if (events) for (var i in events) if (typeof events[i] == 'object') {
      var length = events[i].length;
      if (!length) continue;
      var def = defs[key], delegates;
      var name = def.base || key;
      if (!def.base || !defs[def.base]) {
        if (value) {
          if (!vevents) var vevents = value.events;
          if (!delegates && !(delegates = vevents.delegates))
            delegates = value.delegates = {};
          if ((delegates[name] += length) == length)
            vevents.addListener(value.element, name)
        }
        if (old) {
          if (!oevents) var oevents = old.events;
          if (odelegates || !(odelegates = old.delegates))
            if (!(odelegates[name] -= length))
              oevents.removeListener(old.element, name)
        }
      }
    }
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
!function(types) {
  for (var key in types) !function(klass) {
    LSD.Document.prototype['create' + klass] = function(element, options, fragment) {
      return new LSD[klass](element, options, this, fragment)
    }
  }(types[key])
}(LSD.NodeTypes)