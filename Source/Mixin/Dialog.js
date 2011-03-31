/*
---
 
script: Dialog.js
 
description: Work with dialog
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
 
provides: 
  - LSD.Mixin.Dialog
 
...
*/

LSD.Mixin.Dialog = new Class({
  behaviour: '[dialog]',
  
  options: {
    layout: {
      dialog: "body[type=dialog]"
    },
    chain: {
      dialog: function() {
        var target = this.getDialogTarget();
        if (target) return {name: 'dialog', target: target, priority: 50};
      }
    },
    events: {
      dialogs: {}
    }
  },
  
  getDialog: function(name) {
    if (!this.dialogs) this.dialogs = {};
    if (!this.dialogs[name]) this.dialogs[name] = this.buildDialog.apply(this, arguments);
    return this.dialogs[name];
  },
  
  buildDialog: function(name) {
    var layout = {}
    layout[this.options.layout.dialog] = this.options.layout[name];
    var dialog = this.buildLayout(layout);
    var events = this.options.events.dialogs;
    if (events[name]) dialog.addEvents(events[name]);
    return dialog;
  },
  
  getDialogTarget: function() {
    return this.attributes.dialog && this.getTarget(this.attributes.dialog);
  }
})