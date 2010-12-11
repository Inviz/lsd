/*
---
 
script: Document.js
 
description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Node
  - LSD.Widget.Module.DOM
 
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
  
  The class contains a few hacks that allows Slick to initialize.
*/

LSD.Document = new Class({

  Includes: [
    LSD.Node,
    LSD.Widget.Module.DOM
  ],
  
  States: {
    built: ['build', 'destroy', false]
  },
  
  options: {
    root: false // topmost widget's parentNode is the document if set to true
  },
  
  initialize: function(options) {
    if (!LSD.document) LSD.document = this;
    this.parent.apply(this, Element.type(options) ? [options] : [options.origin, options]);
    this.body = this.element.store('widget', this);
    this.document = this.documentElement = this;
    
    this.xml = true;
    this.navigator = {};
    this.attributes = {};
    
    this.childNodes = [];
    this.nodeType = 9;
    this.nodeName = "#document";
  },
  
  build: Macro.onion(function() {
    this.element.getChildren(':not(.art)').each(LSD.Layout.replace)
  }),
  
  /*
    Slick.Finder tries to probe document it was given to determine
    capabilities of the engine and possible quirks that will alter
    the desired results. 
    
    We try to emulate XML-tree (simple built-in querying capabilities),
    so all of the traversing work happens inside of Slick except 
    getElementsByTagName which is provided by LSD.Widget.Module.DOM.
    
    So the problem is that Slick creates element and tries to 
    append it to the document which is unacceptable (because every node
    in LSD.Document means widget instance, and we dont want that for 
    dummy elements). The solution is to ignore those elements.
  */
  createElement: function(tag) {
    return {
      innerText: '',
      mock: true
    }
  },
  
  appendChild: function(widget) {
    if (widget.mock) return false;
    if (this.options.root) widget.parentNode = this; 
    return this.parent.apply(this, arguments);
  },
  
  removeChild: function(widget) {
    if (widget.mock) return false;
    return this.parent.apply(this, arguments);
  },

  setParent: function(widget){
  },
  
  getAttribute: function(name) {
    return this.attributes[name]
  },
  
  setAttribute: function(name, value) {
    return this.attributes[name] = value;
  },
  
  id: function(item) {
    if (item.render) return item;
  }
});