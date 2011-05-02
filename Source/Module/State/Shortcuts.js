/*
---
 
script: Shortcuts.js
 
description: Add command key listeners to the widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Ext/Shortcuts
  - LSD.Module
  
provides: 
  - LSD.Module.Shortcuts

...
*/
LSD.Module.Shortcuts = new Class({
  Implements: Shortcuts,
  
  initializers: {
    shortcuts: function() {
      return {
        events: {
          shortcuts: {
            focus: 'enableShortcuts',
            blur: 'disableShortcuts'
          }
        }
      }
    }
  },
  
  addShortcut: function() {
    LSD.Module.Events.setEventsByRegister.call(this, 'shortcuts', true);
    return Shortcuts.prototype.addShortcut.apply(this, arguments);
  },
  
  removeShortcut: function() {
    LSD.Module.Events.setEventsByRegister.call(this, 'shortcuts', false);
    return Shortcuts.prototype.removeShortcut.apply(this, arguments);
  }
});

LSD.Options.shortcuts = {
  add: 'addShortcut',
  remove: 'removeShortcut',
  process: 'bindEvents',
  iterate: true
};