/*
---
 
script: Element.js
 
description: Lightweight base class for element-based widgets
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget

provides: [ART.Widget.Element]
 
...
*/

ART.Widget.Element = new Class({

  Extends: ART.Widget,

  options: {
    element: {
      tag: 'div'
    }
  },
  
  style: {
    current: {
    }
  },
  events: {},
  
  setStyle: function(property, value) {
    if (!this.parent.apply(this, arguments)) return;
    if (!this.element) return true;
    return !this.setElementStyle(property, value);
  },
  
  getStyle: function(property) {
    switch(property) { 
      case "height":
        return this.element.offsetHeight;
      case "width":
        return this.element.offsetWidth
      default:
        return this.element.getStyle(property)
    }
  },
  
  getLayoutHeight: function() {
    return this.element.offsetHeight
  },
  
  setStyles: function(properties) {
    for (var property in properties) this.setStyle(property, properties[property]);
    return true;
  },
  
  findStyles: $lambda(false),
  renderStyles: $lambda(false)
});