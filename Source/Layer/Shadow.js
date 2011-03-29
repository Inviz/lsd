/*
---
 
script: Shadow.js
 
description: Drops outer shadow with offsets. Like a box shadow!
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Layer
- Ext/Element.Properties.boxShadow
- Ext/Element.Properties.borderRadius
 
provides: [LSD.Layer.Shadow, LSD.Layer.Shadow.Layer]
 
...
*/

                              //only gecko & webkit nightlies                                       AppleWebKit/534.1+ (KHTML, ... plus means nightly
Browser.Features.SVGFilters = Browser.firefox || (Browser.webkit && navigator.userAgent.indexOf("+ (KHTML") > -1) 

LSD.Layer.Shadow = {
  
  properties: {
    shadow:    ['blur', ['offsetX', 'offsetY'], 'color'],
    blur:      ['length', 'number'],
    offsetX:   ['length', 'number'],
    offsetY:   ['length', 'number'],
    color:     ['color']
  },
  
  paint: function(color, blur, x, y, stroke, method) {
    //if (!method) {
    //  if (this.method) method = method
    //  if (blur < 4) method = 'onion';
    //  else if (Browser.Features.boxShadow && this.base.name == 'rectangle') method = 'native';
    //  else if (Browser.Features.SVGFilters) method = 'blur';
    //  else method = 'onion'
    //}
    //if (this.method && method != this.method) this.eject();
    //return this.setMethod(method).paint.apply(this, arguments);
  }
}
