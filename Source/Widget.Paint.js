/*
---
 
script: Widget.Paint.js
 
description: Base class for widgets that use SVG layers in render
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget
  - LSD.Trait.Shape
  - LSD.Trait.Dimensions
  - LSD.Trait.Layers
  - LSD.Layer.Color
  - LSD.Layer.Offset
  - LSD.Layer.Radius
  - LSD.Layer.Shadow.Blur
  - LSD.Layer.Shadow.Inset
  - LSD.Layer.Shadow
  - LSD.Layer.Shadow.Native
  - LSD.Layer.Shadow.Onion
  - LSD.Layer.Shape
  - LSD.Layer.Size
  - LSD.Layer.Scale
  - LSD.Layer.Stroke
  - LSD.Layer.Position
  
provides: 
  - LSD.Widget.Paint
 
...
*/

LSD.Widget.Paint = new Class({
  Includes: [
    LSD.Widget,
    LSD.Trait.Shape,
    LSD.Trait.Dimensions,
    LSD.Trait.Layers
  ],
  
  options: {
    //layers: ['shadow', 'stroke', 'background', 'foreground', 'icon', 'glyph']
    layers: {
      shadow:     ['size', 'radius', 'shape', 'shadow'],
      stroke:     [        'radius', 'stroke', 'shape', 'fill'],
      background: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
      foreground: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
      reflection: ['size', 'radius', 'stroke', 'offset', 'shape', 'color'],
      icon:       ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position','shadow'],
      glyph:      ['size', 'scale', 'color', 'stroke', 'offset', 'shape', 'position', 'shadow']
    }
  },
  
  getCanvas: Macro.getter('canvas', function() {
    var art = new ART;
    art.toElement().inject(this.toElement(), 'top');
    return art;
  })
});

/*
  Pre-generate CSS grammar for layers.
  
  It is not required for rendering process itself, because
  this action is taken automatically when the first
  widget gets rendered. Declaring layer css styles upfront
  lets us use it in other parts of the framework
  (e.g. in stylesheets to validate styles)
*/
(function(layers) {
  for (var layer in layers) LSD.Layer.get(layer, layers[layer]);
})(LSD.Widget.Paint.prototype.options.layers);