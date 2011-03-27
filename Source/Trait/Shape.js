/*
---
 
script: Shape.js
 
description: Draw a widget with any SVG path you want
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - ART/ART.Shape
  - LSD
  
provides: 
  - LSD.Trait.Shape
 
...
*/

LSD.Trait.Shape = new Class({
  options: {
    shape: 'rectangle'
  },
  
  getShape: Macro.getter('shape', function(name) {
    return this.setShape(name);
  }),
  
  setShape: function(name) {    
    if (!name) name = this.options.shape;
    var shape = new ART.Shape[name.camelCase().capitalize()];
    shape.name = name;
    shape.widget = this;
    this.shape = shape;
    return shape;
  }
  
});