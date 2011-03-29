/*
---
 
script: ART.js
 
description: ART extensions
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- ART/ART.Path
- ART/ART.SVG
- ART/ART.VML
- ART/ART.Base
- Core/Browser
 
provides: [ART, ART.Features]
 
...
*/

ART.implement({

  setHeight: function(height) {
    this.element.setAttribute('height', height);
    return this;
  },

  setWidth: function(width) {
    this.element.setAttribute('width', width);
    return this;
  }

});



ART.Features = {};
ART.Features.Blur = Browser.firefox; //TODO: Figure it out