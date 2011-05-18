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
    chain: {
      dialog: function() {
        var target = this.getDialogTarget();
        if (target) return {action: 'dialog', target: target, priority: 50};
      }
    },
    dialogs: {
      
    }
  },
  
  initializers: {
    dialog: function() {
      this.dialogs = {};
    }
  },
    
  getDialog: function(name) {
    if (!this.dialogs) this.dialogs = {};
    if (!this.dialogs[name]) this.dialogs[name] = this.buildDialog(name);
    return this.dialogs[name];
  },
  
  getDialogOptions: function(name) {
    return {events: this.options.events[name]};
  },
  
  buildDialog: function(options) {
    if (options.indexOf) options = this.options.dialogs[options] || {};
    if (!options.layout) options.layout = 'body-dialog+' + name;
    if (!options.root) options.root = this.document;
    return options.root.buildLayout(options.layout, null, this.getDialogOptions());
  },
  
  getDialogTarget: function() {
    return this.attributes.dialog && this.getElement(this.attributes.dialog)
  },
  
  getDialogWrapper: function() {
    return document.body;
  }
});

LSD.Behavior.define('[dialog]', LSD.Mixin.Dialog);