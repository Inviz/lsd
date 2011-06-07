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
  fork: true,
  
  enable: function(target) {
    if (this.retrieve(target)) return;
    var args = Array.prototype.slice.call(arguments, 1);
    if (target.lsd && !target.submit && this.invoker != target) {
      if (target.chainPhase == -1 || (target.getCommandAction && target.getCommandAction() == 'submit')) 
        return target.callChain.apply(target, args);
    }
    var method = (target.submit || target.send || target.click);
    var submission = method.apply(target, args);
    if (submission && submission != target) {
      this.store(target, submission);
      var self = this, callback = function() {
        this.removeEvents(events);
        self.eliminate(target);
      };
      var events = { complete: callback, cancel: callback };
      submission.addEvents(events);
    }
    return submission
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