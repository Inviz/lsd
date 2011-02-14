/*
---
 
script: Node.js
 
description: Super lightweight base class for abstract elements (documents, commands, meta)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  
provides:
  - LSD.Node
  
...
*/

LSD.Node = new Class({
  
  Implements: [Events, Options],  
  
  options: {},

  initialize: function(element, options) {
    if ((element && !element.tagName) || (options && options.tagName)) {
      var el = options;
      options = element;
      element = el;
    }
    this.element = document.id(element);
    this.setOptions(options);
  },
  
  dispose: function() {
    if (this.element) this.element.dispose();
  },
  
  destroy: function() {
    if (this.parentNode) this.dispose();
    if (this.element) this.element.destroy();
  },
  
  toElement: function() {
    return this.element;
  },
  
  /* This declaration speeds up mootools type checks */
  
  $family: function() {
    return "object"
  }
})