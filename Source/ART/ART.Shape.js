/*
---
 
script: Shape.js
 
description: Additional methods to clone the shape
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- ART/ART.Shape
- ART.Styles
 
provides: [ART.Shape]
 
...
*/

ART.Shape.implement({
  produce: function(delta, shape) {
    if (!shape) shape = new this.$constructor;
    if (this.style) shape.draw(delta.push ? this.change.apply(this, delta) : this.change(delta))
    return shape;
  },
  
  setStyles: function(style) {
    this.style = style;
  }
});