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
    var widget = LSD.Module.DOM.find(target, true);
    if (widget) widget.show();
    else if (target.localName) {
      target.removeAttribute('hidden');
    }
  },
  
  disable: function(target) {
    var widget = LSD.Module.DOM.find(target, true);
    if (widget) widget.hide();
    else if (target.localName) {
      target.setAttribute('hidden', 'hidden');
    }
  },
  
  getState: function(target) {
    var element = (target.element || target);
    return target.hidden || (target.getAttribute && (target.getAttribute('hidden') == 'hidden')) || (element.getStyle && (element.getStyle('display') == 'none'));
  },
  
  enabler: 'show',
  disabler: 'hide'
});