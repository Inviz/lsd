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

LSD.Property.Dragger = LSD.Struct({
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
  
  imports: {
    element: '.element',
    attached: '.draggable',
    handle: '.handle'
  },

  exports: {
    dragged: 'dragged'
  },
  
  attached: function(value, old) {
    if (value) {
      this.attach()
    } else if (old) {
      this.detach();
    }
  },

  handle: function(value) {
    
  },
  
  events: {
    start: function() {
      this.set('dragged', true);
    },

    complete: function() {
      this.unset('dragged', true);
    },

    cancel: function() {
      this.unset('dragged', true);
    }
  }
});