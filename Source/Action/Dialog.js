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
  enable: function(target, data) {
    if (data && !data.event) {
      if (data.charAt) {
        var content = data;
        delete data;
      }
    } else delete data;
    if (target.element) {
      var dialog = target;
      target = target.element;
    } else var dialog = this.retrieve(target);
    if (dialog && dialog.layout.interpolated) {
      dialog.destroy();
      dialog = null;
    }
    if (!dialog) {
      var source = this.caller.toElement();
      var options = {
        interpolate: function(string) {
          if (data) {
            var substitution = data[string];
            if (!substitution && substitutions.callback) substitution = substitutions.callback.call(this, string)
            if (substitution) {
              if (substitution.call) substitution = substitution.call(source, string, this);
              if (substitution) return substitution;
            }
          }
          return source.getProperty('data-' + string.dasherize())
        },
        clone: true,
        caller: function() {
          return this;
        }.bind(this.caller),
        tag: 'body',
        attributes: {
          type: 'dialog'
        }
      };
      if (!target.indexOf) {
        if (target.hasClass('singlethon')) options.clone = false;
        var element = target;
      } else options.attributes.kind = target;
      var dialog = new LSD.Widget(options, element);
    }
    if (content) dialog.write(content);
    dialog.show();
    dialog.inject(document.body)
    this.store(target, dialog);
    return false;
  },
  
  disable: function(target) {
    var dialog = this.retrieve(target);
    if (dialog) dialog.hide();
  }
});