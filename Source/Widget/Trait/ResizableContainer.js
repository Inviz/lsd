/*
---
 
script: ResizableContainer.js
 
description: Make container resize, not the widget itself.
 
license: MIT-style license.
 
requires:
- ART.Widget.Trait.Resizable

provides: [ART.Widget.Trait.ResizableContainer]
 
...
*/

ART.Widget.Trait.ResizableContainer = new Class({
  getResized: function() {
    return this.content;
  },
  
  getScrolled: function() {
    return this.content.wrapper || this.content
  }
});