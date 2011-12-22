/*
---
 
script: Shortcuts.js
 
description: Add command key listeners to the widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - Ext/Shortcuts
  - LSD.Module
  - LSD.Module.Events
  
provides: 
  - LSD.Module.Shortcuts

...
*/
LSD.Module.Shortcuts = new Class({
  Implements: Shortcuts,
  
  addShortcut: function() {
    LSD.Module.Events.setEventsByRegister.call(this, 'shortcuts', LSD.Module.Shortcuts.events);
    return Shortcuts.prototype.addShortcut.apply(this, arguments);
  },
  
  removeShortcut: function() {
    LSD.Module.Events.setEventsByRegister.call(this, 'shortcuts', LSD.Module.Shortcuts.events);
    return Shortcuts.prototype.removeShortcut.apply(this, arguments);
  }
});

LSD.Module.Events.addEvents.call(LSD.Module.Shortcuts.prototype, {
  focus: 'enableShortcuts',
  blur: 'disableShortcuts'
});

LSD.Options.shortcuts = {
  add: 'addShortcut',
  remove: 'removeShortcut',
  process: 'bind',
  iterate: true
};