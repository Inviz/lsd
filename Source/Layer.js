/*
---
 
script: Layer.js
 
description: Adds a piece of SVG that can be drawn with widget styles
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Shape
 
provides: [ART.Layer, ART.Layer.Shaped]
 
...
*/

ART.Layer = new Class({
  initialize: function(shape) {
    this.base = shape;
  },
  
  produce: function(delta) {
    if (!delta) delta = 0;
    this.delta = delta;
    this.shape = this.base.produce(delta, this.shape);
  }
});

ART.Layer.Shaped = new Class({
  Extends: ART.Layer,
  
  initialize: function() {
    this.shape = new ART.Shape;
  }
});

ART.Layer.implement({
  inject: function() {
    this.injected = true;
    if (this.shape) return this.shape.inject.apply(this.shape, arguments);
  },
  
  eject: function() {
    delete this.injected
    if (this.shape) return this.shape.eject.apply(this.shape, arguments);
  }
});

['translate', 'fill', 'stroke'].each(function(method) {
  ART.Layer.implement(method, function() {
    if (!this.shape) return;
    return this.shape[method].apply(this.shape, arguments);
  })
});