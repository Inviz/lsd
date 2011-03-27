/*
---
 
script: Shape.js
 
description: Base layer that provides shape
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
  - ART/ART.Shape
 
provides: 
  - LSD.Layer.Shape
 
...
*/

LSD.Layer.Styles = {}
LSD.Layer.Shape = {
  properties: {
    shape:      ['url', 'shape', 'glyph']
  },
  
  paint: function(shape) {
    return {
      shape: shape
    }
  },
  
  onCompile: function(name) {
    for (var shape in ART.Shape) {
      var klass = ART.Shape[shape];
      if (!klass || !klass.prototype || !klass.prototype.properties) continue;
      var properties = klass.prototype.properties;
      LSD.Layer.Styles[name + shape] = properties.map(function(prop) { return name + prop.capitalize()});
    }
  }
}

Object.append(SheetParser.Property.Type, {
  shape: function(value) {
    if (value.indexOf) var name = value
    else for (var key in value) { name = key; break};
    return !!ART.Shape[name.capitalize()]
  },
  
  glyph: function(value) {
    return value.glyph
  }
});

LSD.Styles.shape = SheetParser.Property.compile(LSD.Layer.Shape.properties.shape)