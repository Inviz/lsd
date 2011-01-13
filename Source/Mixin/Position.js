/*
---
 
script: Position.js
 
description: Easily reposition element by positioning widget absolutely and one of the edges
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

provides: 
  - LSD.Mixin.Position
 
...
*/

LSD.Mixin.Position = new Class({
  behaviour: "[at], [position]",
  
  initialize: function() {
    this.parent.apply(this, arguments);
    this.positionAt(this.attributes.at || this.attributes.position);
  },
  
  positionAt: function(position) {
    position.split(/\s+/).each(function(property) {
      this.element.setStyle(property, 0)
    }, this);
    this.element.setStyle('position', 'absolute');
    return true;
  }
  
});