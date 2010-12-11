/*
---
 
script: Position.js
 
description: Easily reposition element by positioning widget absolutely and one of the edges
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base

provides: [LSD.Widget.Trait.Position]
 
...
*/

LSD.Widget.Trait.Position = new Class({
  
  attach: Macro.onion(function() {
    if (this.options.at) this.positionAt(this.options.at)
  }),
  
  positionAt: function(position) {
    position.split(/\s+/).each(function(property) {
      this.element.setStyle(property, 0)
    }, this);
    this.element.setStyle('position', 'absolute');
    return true;
  }
  
});

Widget.Attributes.Ignore.push('at');