/*
---
 
script: Slider.js
 
description: Because sometimes slider is the answer
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
  - More/Slider
  - Ext/Slider.prototype.update
  - Ext/Class.hasParent

provides: 
  - LSD.Trait.Slider
 
...
*/

LSD.Type.Slider = new LSD.Class({
  Extends: Slider,
  
  imports: {
    element: '.element'
  },
  
  properties: {
    element: function(element) {
      
    },
    mode: function() {
      
    },
    value: function() {
      
    },
    thumb: function() {
      
    }
  },
  
  exports: {
    
  },
  
  events: {
    change: function(value) {
      this.write('value', value);
    }
  }
})