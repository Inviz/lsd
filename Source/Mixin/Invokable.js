/*
---
 
script: Invokable.js
 
description: Makes widget submit into another widget 
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
 
provides:
  - LSD.Mixin.Invokable
 
...
*/


LSD.Mixin.Invokable = new Class({
  options: {
    chain: {
      feedback: function() {
        return {
          action: 'submit',
          target: this.getSubmissionTarget,
          arguments: this.getSubmissionData,
          priority: -5
        }
      }
    },
    states: Array.object('invoked'),
    events: {
      _invokable: {
        submit: function() {
          this.revoke(true);
        },
        cancel: 'revoke',
        setParent: function(widget) {
          this.invoke(widget)
        },
        unsetParent: 'revoke'
      }
    }
  },
  
  onMix: function() {
    var invoker = this.invoker || this.options.invoker;
    if (invoker) this.invoke(invoker);
  },
  
  invoke: function(invoker) {
    console.error('invoked', invoker.tagName);
    this.invoker = invoker;
    this.fireEvent('invoke', arguments);
    this.objects.set('invoker', invoker);
  },
  
  revoke: function(soft) {
    console.error('revoked');
    var invoker = this.invoker;
    if (soft !== true) this.invoker.uncallChain();
    this.fireEvent('revoke', invoker);
    this.objects.unset('invoker', invoker);
  },
  
  getInvoker: function() {
    return this.invoker;
  },
  
  getSubmissionTarget: function() {
    return this.getInvoker();
  },
  
  getSubmissionData: function() {
    return this.getData ? this.getData() : null;
  }
});

LSD.Behavior.define(':invokable', 'invokable');