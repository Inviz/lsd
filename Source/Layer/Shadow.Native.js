/*
---
 
script: Shadow.Native.js
 
description: CSS powered shadow
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer.Shadow
 
provides: [LSD.Layer.Shadow.Native]
 
...
*/

LSD.Layer.Shadow.Native = new Class({
  //Extends: LSD.Layer,

  paint: function(color, blur, x, y, stroke) {
    var widget = this.base.widget;
    var element = widget.toElement();
    element.set('borderRadius', widget.getStyle('cornerRadius'));
    element.set('boxShadow', {color: color, blur: blur, x: x, y: y})
  },
  
  eject: function() {
    var widget = this.base.widget;
    var element = widget.element;
    element.set('boxShadow', false)
  }
})