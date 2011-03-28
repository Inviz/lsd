/*
---
 
script: Display.js
 
description: Shows or hides things
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Display
 
...
*/

LSD.Action.Display = LSD.Action.build({
  enable: function(target) {
    if (target.show) target.show();
    else if (target.setStyle) target.setStyle('display', target.retrieve('style:display') || 'inherit');
  },
  
  disable: function(target) {
    if (target.hide) target.hide();
    else if (target.setStyle) {
      target.store('style:display', target.getStyle('display'));
      target.setStyle('display', 'none');
    }
  },
  
  getState: function(target) {
    var element = (target.element || target);
    return !(target.hidden || (element.getStyle && (element.getStyle('display') == 'none')));
  }
});