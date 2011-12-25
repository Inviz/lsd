/*
---
 
script: Draggable.js
 
description: Drag widget around the screen
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - More/Drag

provides: 
  - LSD.Mixin.Draggable
 
...
*/

LSD.Property.Dragger = new LSD.Class({
  Extends: Drag,
  
  options: {
    modifiers: {
      x: 'left',
      y: 'top'
    },
    snap: 5,
    style: false,
    container: true,
    handle: []
  },

  exports: {
    element: '.element',
    attached: '.attached',
    handle: '.handle',
    dragged: '.dragged'
  },
  
  properties: {
    attached: function(value) {
      if (value) {
        this.attach()
      } else {
        this.detach();
      }
    },

    handle: function(value) {
      
    }
  },
  
  events: {
    start: function() {
      this.include('dragged');
    },

    complete: function() {
      this.erase('dragged');
    },

    cancel: function() {
      this.erase('dragged');
    }
  }
});