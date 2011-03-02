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
  enable: function() {
    if (this.show) this.show();
    else if (this.setStyle) this.setStyle('display', this.retrieve('style:display') || 'inherit');
  },
  
  disable: function() {
    if (this.hide) this.hide();
    else if (this.setStyle) {
      this.store('style:display', this.getStyle('display'));
      this.setStyle('display', 'none');
    }
  },
  
  getState: function() {
    return !(('hidden' in this) || (this.getStyle && (this.getStyle('display') == 'none')));
  }
});