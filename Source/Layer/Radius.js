/*
---
 
script: Radius.js
 
description: Rounds shapes corners
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Layer
 
provides: 
  - LSD.Layer.Radius
 
...
*/

LSD.Layer.Radius = {
  properties: {
    radius:      [['topLeft', 'bottomLeft', 'topRight', 'bottomRight'], 'collection'],
    topLeft:     ['percentage', 'length'],
    bottomLeft:  ['percentage', 'length'],
    topRight:    ['percentage', 'length'],
    bottomRight: ['percentage', 'length'],
  },
  
  paint: function() {
    return {
      radius: Array.prototype.splice.call(arguments, 0).map(function(r) { return r || 0})
    }
  }
}



LSD.Layer.prepare('corner', ['radius'], false);