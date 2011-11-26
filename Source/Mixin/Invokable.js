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
          target: this.getFeedbackTarget,
          arguments: this.getFeedbackData,
          priority: -5
        }
      }
    },
    states: Array.object('invoked'),
    events: {
      _invokable: {
        cancel: 'revoke',
        setParent: function(widget) {
          if (!this.pseudos.uninvoked) this.invoke(widget)
        },
        unsetParent: 'revoke'
      }
    },
    scripts: {
      feedback: 'submit(getFeedbackTarget(), getFeedbackData())'
    }
  },
  
  constructors: {
    invokable: function(options, state) {
      if (state) {
        var invoker = this.invoker || this.options.invoker;
        if (invoker) this.invoke(invoker);
      }
    }
  },
  
  invoke: function(invoker) {
    this.invoker = invoker;
    this.properties.set('invoker', invoker);
  },
  
  revoke: function(soft) {
    var invoker = this.invoker;
    if (soft !== true && invoker.uncallChain) invoker.uncallChain();
    this.properties.unset('invoker', invoker);
  },
  
  getInvoker: function() {
    return this.invoker;
  },
  
  getFeedbackTarget: function() {
    return this.getInvoker();
  },
  
  getFeedbackData: function() { 
    return {}
  }
});

LSD.Behavior.define(':invokable', 'invokable');