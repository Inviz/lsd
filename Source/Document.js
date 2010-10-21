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
  Extends: ART.Widget.Module.DOM,
  
  Implements: [Events, Options],
  
  options: {},
  
  initialize: function(element) {
    if (!element) ART.document = this;
    this.element = (element || document.body);
    this.body = this.element.store('widget', this);
    this.document = this.documentElement = this;
    
    this.xml = true;
    this.navigator = {};
    this.attributes = {};
    
    this.childNodes = [];
    this.nodeType = 9;
    this.nodeName = "#document";
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
  },
  
  id: function(item) {
    if (item.render) return item;
    
  }
});