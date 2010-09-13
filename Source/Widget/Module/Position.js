/*
---
 
script: Position.js
 
description: Easily reposition element by positioning widget absolutely and one of the edges
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base

provides: [ART.Widget.Module.Position]
 
...
*/

ART.Widget.Module.Position = new Class({
  
  attach: Macro.onion(function() {
    if (this.options.at) this.positionAt(this.options.at)
  }),
  
  positionAt: function(position) {
    position.split(/\s+/).each(function(property) {
      this.element.setStyle(property, 0)
    }, this);
    this.position = 'absolute';
    return true;
  }
  
});

ART.Widget.Ignore.attributes.push('at');