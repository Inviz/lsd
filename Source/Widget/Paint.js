/*
---
 
script: Paint.js
 
description: Base class for widgets that use SVG layers in render
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget
- LSD.Widget.Trait.Shape
- LSD.Widget.Trait.Dimensions
- LSD.Widget.Trait.Layers

provides: [LSD.Widget.Paint]
 
...
*/

LSD.Widget.Paint = new Class({
  Includes: [
    LSD.Widget,
    LSD.Widget.Trait.Shape,
    LSD.Widget.Trait.Dimensions,
    LSD.Widget.Trait.Layers
  ],
  
  getCanvas: Macro.getter('canvas', function() {
    var art = new ART;
    art.toElement().inject(this.toElement(), 'top');
    return art;
  }),
  
  setStyle: function(property, value) {
    var value = this.parent.apply(this, arguments);
    if (typeof value == 'undefined') return;
    return Widget.Styles.Paint[property] ? this.setPaintStyle(property, value) : this.setElementStyle(property, value);
  },
  
  setPaintStyle: function(property, value) {
    this.style.paint[property] = value;
    var properties = Widget.Styles.Complex[property];
    if (properties) {
      if (properties.set) properties = properties.set;
      if (!(value instanceof Array)) {
        var array = [];
        for (var i = 0, j = properties.length; i < j; i++) array.push(value); 
        value = array;
      }
      for (var i = 0, j = properties.length, count = value.length; i < j; i++) this.setStyle(properties[i], value[i % count])
    }
  },
  
  tween: function(property, from, to) {
    if (!this.tweener) this.tweener = new LSD.Fx(this, this.options.tween);
    this.tweener.start(property, from, to);
    return this;
  }
});