/*
---

script: Size.js

description: Base layer that provides shape

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Layer

provides:
  - LSD.Layer.Size

...
*/

LSD.Layer.Size = {
  properties: {
    size:       [['height', 'width'], 'collection'],
    height:     ['length', 'percentage'],
    width:      ['length', 'percentage']
  },

  prefix: false,

  paint: function(height, width) {
    if (height !== null && width !== null) return {
      size: {
        height: this.size.height ? (height - this.size.height) : height,
        width: this.size.width ? (width - this.size.width) : width
      }
    }
  }
}