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
  enable: function(target, substitutions) {
    if (substitutions.event) substitutions = null;
    if (!target.localName) {
      var dialog = target;
      target = target.element;
    } else var dialog = this.retrieve(target);
    if (dialog && dialog.layout.interpolated) {
      dialog.destroy();
      dialog = null;
    }
    if (!dialog) {
      var source = this.caller.element || this.caller;
      var caller = this.caller;
      dialog = LSD.Element.create('body-dialog', target, {
        layout: {
          options: {
            method: target.hasClass('singlethon') ? 'augment' : 'clone', 
            interpolate: function(string) {
              if (substitutions) {
                var substitution = substitutions[string];
                if (!substitution && substitutions.callback) substitution = substitutions.callback.call(this, string)
                if (substitution) {
                  if (substitution.call) substitution = substitution.call(source, string, this);
                  if (substitution) return substitution;
                }
              }
              return source.getProperty('data-' + string.dasherize())
            }
          }
        },
        caller: function() {
          return caller;
        }
      });
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