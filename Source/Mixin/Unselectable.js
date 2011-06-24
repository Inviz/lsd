/*
---
 
script: Unselectable.js
 
description: DisableS in browser native selection for element
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Ext/Element.disableSelection
 
provides: 
  - LSD.Mixin.Unselectable
 
...
*/

LSD.Mixin.Unselectable = new Class({
  options: {
    actions: {
      selection: {
        enable: function() {
          this.element.disableSelection()
        },
        disable: function() {
          this.element.enableSelection();
        }
      }
    }
  }
});

LSD.Behavior.define(':unselectable', LSD.Mixin.Unselectable);