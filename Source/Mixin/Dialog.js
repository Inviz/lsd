/*
---
 
script: Dialog.js
 
description: Work with dialog
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Mixin.Dialog
 
...
*/

LSD.Mixin.Dialog = new Class({
  options: {
    layout: {
      dialog: "body[type=dialog]"
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
    var dialog = this.buildLayout(null, layout, null);
    for (var z in this.$constructor.prototype.options.layout[name]) console.log(z)
    console.log(name, dialog)
    var events = this.options.events.dialogs;
    if (events[name]) dialog.addEvents(events[name]);
    return dialog;
  }
})