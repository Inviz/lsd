/*
---
 
script: Shy.js
 
description: A trait to make widget take no space at all in layout
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Mixin.Shy
  
 
...
*/

LSD.Mixin.Shy = new Class({
  behaviour: "[shy][shy!=false]",
  
  renderOffsets: function() {
    var side = this.style.current['float'] == 'right' ? 'left' : 'right';
    this.offset.margin[side] -= this.size.width;
    return this.parent.apply(this, arguments);
  }
});