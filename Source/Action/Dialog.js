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
    if (!dialog) {
      dialog = LSD.Layout.clone(target);
      if (!dialog.show) dialog = new LSD.Widget.Body.Dialog(dialog);
      var caller = this.caller;
      dialog.addEvents({
        'submit': function() {
          console.log('submit', caller)
          if (caller.kick) caller.kick()
        }.bind(this),
        'cancel': function() {
          if (caller.unkick) caller.unkick()
        }.bind(this)
      })
    }
    dialog.show();
    this.store(target, dialog);
  },
  
  disable: function(target) {
    
  },
  
  asynchronous: true
});