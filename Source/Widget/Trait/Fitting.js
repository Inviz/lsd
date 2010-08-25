/*
---
 
script: Fitting.js
 
description: Fit widget around its content. Useful for variable-height widgets like windows and dialogs.
 
license: MIT-style license.
 
requires:
- ART.Widget.Base
- Ext/Drag.Limits

provides: [ART.Widget.Trait.Fitting]
 
...
*/


ART.Widget.Trait.Fitting = new Class({
  fit: function() {
    var element = $(this.content.getContainer());
    var display = element.getStyle('display');
    element.setStyle('display', 'inline-block');
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    this.content.setWidth(width);
    this.content.setHeight(height);
    if (this.resizer) {
      this.resizer.setMaxX(width);
      this.resizer.setMaxY(height);
    }
    element.setStyle('display', display)
    this.refresh(true)
  }
});