/*
---
 
script: Fitting.js
 
description: Fit widget around its content. Useful for variable-height widgets like windows and dialogs.
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base
- Ext/Drag.Limits

provides: [LSD.Widget.Trait.Fitting]
 
...
*/


LSD.Widget.Trait.Fitting = new Class({
  fit: function() {
    //var element = this.content.getContainer().toElement();
    //var styles = element.getStyles('display', 'width', 'height');
    //element.setStyles({display: 'inline-block', width: 'auto', height: 'auto'});
    //var width = element.offsetWidth;
    //var height = element.offsetHeight;
    //this.resizable.setWidth(width);
    //this.resizable.setHeight(height);
    //this.resizable.setStyles({maxWidth: width, maxHeight: height});
    //element.setStyles(styles)
    //
    //this.collect(function(child) {
    //  return (child.style.current.width == 'inherit') || (child.style.current.width == 'auto') || child.style.expressed.width
    //}).concat(this.resizable).each(Macro.proc('update'));
    //this.refresh()
  }
});

Widget.Attributes.Ignore.push('fitting')