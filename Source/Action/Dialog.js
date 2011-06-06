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
  priority: 50,
  
  enable: function(target) {
    var args = Array.link(Array.prototype.slice(arguments, 1), 
      {content: String.type, data: Object.type, interpolate: Function.type});
    if (target.element) {
      var dialog = target;
      target = target.element;
    } else var dialog = this.retrieve(target);
    if (dialog && dialog.layout.interpolated) {
      dialog.destroy();
      dialog = null;
    }
    if (!dialog) {
      var invoker = this.invoker, options = {
        tag: 'body',
        attributes: {
          type: 'dialog'
        },
        interpolate: LSD.Interpolation.from(args.data, invoker.dataset, args.callback),
        document: this.getDocument(),
        invoker: this.invoker
      };
      if (!target.indexOf) {
        if (target.hasClass('singlethon')) options.clone = false;
        var element = target;
      } else options.attributes.kind = target;
      var dialog = $dialog = new LSD.Widget(options, element);
    }
    if (args.content) dialog.write(content);
    dialog.show();
    this.store(target, dialog);
    return false;
  },
  
  disable: function(target) {
    var dialog = this.retrieve(target);
    if (dialog) dialog.hide();
  }
});