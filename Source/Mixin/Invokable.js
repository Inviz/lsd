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
    states: {
      invoked: {
        enabler: 'invoke',
        disabler: 'revoke'
      }
    },
    events: {
      _invokable: {
        submit: function() {
          this.revoke(true);
        },
        cancel: 'revoke'
      }
    }
  },
  
  constructors: {
    invoker: function() {
      var invoker = this.invoker || this.options.invoker;
      if (invoker) this.invoke(invoker);
    }
  },
  
  invoke: function(invoker) {
    this.invoker = invoker;
    this.fireEvent('invoke', arguments);
    this.fireEvent('register', ['invoker', invoker]);
  },
  
  revoke: function(soft) {
    var invoker = this.invoker;
    if (soft !== true) this.invoker.uncallChain();
    this.fireEvent('revoke', invoker);
    this.fireEvent('unregister', ['invoker', invoker]);
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

LSD.Behavior.define(':invokable', LSD.Mixin.Invokable);