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

/*
  Checkbox commands are useful when you need to track and toggle
  state of some linked object. 
  
  Provide your custom logic hooking on *check* and *uncheck*
  state transitions. Use *checked* property to get the current state.
  
  Examples:
    - Button that toggles visibility of a sidebar
    - Context menu item that shows or hides line numbers in editor
*/

LSD.Command.Checkbox = new Class({
  Extends: LSD.Command,

  click: function() {
    this.parent.apply(this, arguments);
    this.toggle();
  }
});

LSD.Command.Checkbox.prototype.addState('checked');