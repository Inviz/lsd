/*
---

script: Scale.js

description: Adds a way to set scale level to the layer

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Layer

provides:
  - LSD.Layer.Scale

...
*/

LSD.Layer.Scale = {
  properties: {
    scale: [['x', 'y'], 'collection'],
    x:     ['number', 'percentage'],
    y:     ['number', 'percentage']
  },

  paint: function(x, y) {
    if (x != null || y != null) return {
      size: {
        width: - this.size.width * (1 - x),
        height: - this.size.height * (1 - y)
      }
    }
  }
}