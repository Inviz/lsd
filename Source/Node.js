/*
---
 
script: Node.js
 
description: Super lightweight base class for abstract elements (documents, commands, meta)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Core/Events
  - Core/Options
  
provides:
  - LSD.Node
  
...
*/

LSD.Node = new Class({
  
  Implements: [Events, Options],  
  
  options: {},

  initialize: function(element, options) {
    console.log('node', element, options)
    this.element = document.id(element);
    this.setOptions(options);
    var attributes = this.options.element;
    if (attributes && element) this.element.set(attributes);
  },
  
  toElement: function() {
    return this.element;
  }
})