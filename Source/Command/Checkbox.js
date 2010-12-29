/*
---
 
script: Checkbox.js
 
description: Two-state command (can be on and off)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Command
 
provides: 
  - LSD.Command.Checkbox
 
...
*/

LSD.Command.Checkbox = new Class({
  Extends: LSD.Command,
  
  States: {
    checked: ['check', 'uncheck', 'toggle']
  },

  click: function() {
    this.parent.apply(this, arguments);
    this.toggle();
  }
})