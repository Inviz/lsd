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
    var dialog = new LSD.Widget.Body.Dialog(target);
    dialog.show();
    console.log('dialog', target.indexOf, this.caller, target.origin, this, target + '');
  },
  
  disable: function(target) {
    
  },
  
  asynchronous: true
});