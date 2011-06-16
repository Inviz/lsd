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
  - LSD.Action.Show
  - LSD.Action.Hide
 
...
*/

LSD.Action.Display = LSD.Action.build({
  enable: function(target) {
    if (target.show) target.show();
    else if (target.setStyle) {
      target.setStyle('display', target.retrieve('style:display') || 'inherit');
      target.removeAttribute('hidden');
    }
  },
  
  disable: function(target) {
    if (target.hide) target.hide();
    else if (target.setStyle) {
      target.store('style:display', target.getStyle('display'));
      target.setStyle('display', 'none');
      target.setAttribute('hidden', 'hidden');
    }
  },
  
  getState: function(target) {
    var element = (target.element || target);
    return target.hidden || (target.getAttribute && target.getAttribute('hidden')) || (element.getStyle && (element.getStyle('display') == 'none'));
  }
});

LSD.Action.Hide = LSD.Action.build({
  enable: LSD.Action.Display.prototype.options.disable,
  disable: LSD.Action.Display.prototype.options.enable,
  getState: function() {
    return !LSD.Action.Display.prototype.options.getState.apply(this, arguments);
  }
});

LSD.Action.Show = LSD.Action.build({
  enable: LSD.Action.Display.prototype.options.enable,
  disable: LSD.Action.Display.prototype.options.display,
  getState: LSD.Action.Display.prototype.options.getState
});