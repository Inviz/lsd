/*
---
 
script: Submit.js
 
description: Does a request or navigates url to the link
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
 
provides:
  - LSD.Action.Submit
 
...
*/


LSD.Action.Submit = LSD.Action.build({
  enable: function(target, event) {
    if (this.retrieve(target)) return;
    var args = Array.prototype.slice.call(arguments, 1);
    var widget = LSD.Module.DOM.find(target, true);
    if (widget) target = widget;
    if (target.lsd && !target.submit && this.invoker != target 
    && (!event || event.type != 'click' || (Element.get(event.target, 'tag') != 'label' && event.target != (target.lsd ? target.element : target)))) {
      var commandAction = target.getCommandAction ? target.getCommandAction() : false;
      if (target.chainPhase == -1 || (commandAction == null || commandAction == 'submit')) 
        return target.callChain.apply(target, args);
    }
    var method = target.lsd ? (target.submit || target.send || target.click) : target.click;
    if (method) {
      var submission = method.apply(target, args);
      if (submission && submission.callChain && submission != target) {
        this.store(target, submission);
        var self = this, callback = function() {
          this.removeEvents(events);
          self.eliminate(target);
        };
        var events = { complete: callback, cancel: callback };
        if (submission.callChain) submission.addEvents(events);
      }
      return submission
    }
  },
  
  disable: function(target) {
    var submission = this.retrieve(target);
    if (submission) {
      if (submission !== true && submission.running) submission.cancel();
      this.eliminate(target);
    } else {
      if (target.cancel) return target.cancel.apply(target, Array.prototype.slice.call(arguments, 1));
    }
  },
  
  getState: function(target) {
    var submission = this.retrieve(target);
    return !submission || !(submission !== true || submission.running);
  }
});