/*
---
 
script: Fitting.js
 
description: Fit widget around its content. Useful for variable-height widgets like windows and dialogs.
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- Ext/Drag.Limits

provides: [ART.Widget.Trait.Fitting]
 
...
*/


ART.Widget.Trait.Fitting = new Class({
  fit: function() {
    var element = $(this.content.getContainer());
    var styles = element.getStyles('display', 'width', 'height');
    element.setStyles({display: 'inline-block', width: 'auto', height: 'auto'});
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    this.getResized().setWidth(width);
    this.getResized().setHeight(height);
    this.getResized().setStyles({maxWidth: width, maxHeight: height});
    element.setStyles(styles)
    
    this.collect(function(child) {
      return (child.style.current.width == 'inherit') || (child.style.current.width == 'auto') || child.style.expressed.width
    }).concat(this.getResized()).each(function(child) {
      child.update();
    });
    
    this.refresh()
  }
});