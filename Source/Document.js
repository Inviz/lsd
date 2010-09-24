/*
---
 
script: Document.js
 
description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Module.DOM
 
provides: [ART.Document]
 
...
*/


ART.Document = new Class({
  Includes: [
    new Class({initialize: function() {
      
    }}),
    ART.Widget.Module.DOM
  ],
  
  Implements: [Events, Options],
  
  options: {},
  
  initialize: function(element) {
    this.element = (element || document.body);
    this.document = this.documentElement = this;
    
    this.xml = true;
    this.navigator = {};
    this.attributes = {};
    
    this.parent.apply(this, arguments);
  },
  
  toElement: function() {
    return this.element;
  },
  
  createElement: function(tag) {
    return {
      innerText: ''
    }
  },

  setParent: function(widget){
  },
  
  getAttribute: function(name) {
    return this.attributes[name]
  },
  
  setAttribute: function(name, value) {
    return this.attributes[name] = value;
  }
});