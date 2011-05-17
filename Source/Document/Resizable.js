/*
---
 
script: Resizable.js
 
description: Document that redraws children when window gets resized.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Document
  - LSD.Module.Layout
  - LSD.Module.Events
  - Core/Element.Dimensions
 
provides:
  - LSD.Document.Resizable
 
...
*/

LSD.Document.Resizable = new Class({
  
  options: {
    root: true
  },
  
  initializers: {
    resizable: function() {
      return {
        events: {
          window: {
            resize: 'onResize'
          },
          self: {
            build: 'onResize'
          }
        } 
      }
    }
  },
  
  onResize: function() {
    if (this.element.getCoordinates) Object.append(this.style.current, this.element.getCoordinates());
    this.render()
  },
  
  render: function() {
    this.childNodes.each(function(child){
      if (child.refresh) child.refresh();
    });
  }
});