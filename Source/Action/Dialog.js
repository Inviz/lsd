/*
---
 
script: Dialog.js
 
description: Shows a dialog
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Dialog
 
...
*/


LSD.Action.Dialog = LSD.Action.build({
  enable: function(target) {
    var dialog = this.retrieve(target);
    if (dialog && dialog.layout.interpolated) {
      dialog.destroy();
      dialog = null;
    }
    if (!dialog) {
      var caller = this.caller.element || this.caller;
      dialog = new LSD.Widget.Body.Dialog(target, {
        layout: {
          options: {
            method: 'clone', 
            interpolate: function(string) {
              return caller.getProperty('data-' + string)
            }
          }
        }
      });
      var caller = this.caller;
      dialog.addEvents({
        'submit': function() {
          if (caller.callChain) caller.callChain(dialog.getData())
        }.bind(this),
        'cancel': function() {
          if (caller.clearChain) caller.clearChain(dialog.getData())
        }.bind(this)
      })
    }
    dialog.show();
    this.store(target, dialog);
    return false;
  },
  
  disable: function(target) {
    var dialog = this.retrieve(target);
    if (dialog) dialog.hide();
  }
});