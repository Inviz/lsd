/*
---
 
script: Element.js
 
description: Lightweight base class for element-based widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget

provides: 
  - LSD.Widget.Element
 
...
*/

LSD.Widget.Element = new Class({

  Extends: LSD.Widget,

  options: {
    element: {
      tag: 'div'
    },
    events: {}
  },
  
  style: {
    current: {}
  },
  
  setStyle: function(property, value) {
    if (!this.parent.apply(this, arguments)) return;
    if (!this.element) return true;
    return !this.element.setStyle(property, value);
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
  
  renderStyles: $lambda(false)
});