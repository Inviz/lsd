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
        afterSubmit: function() {
          this.revoke(true);
        },
        cancel: 'revoke',
        setParent: function(widget) {
          this.invoke(widget)
        },
        unsetParent: 'revoke'
      }
    },
    methods: {
      invoke: {
        invoke: 'invoke',
        revoke: 'revoke'
      }
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
    return invoker;
  },
  
  revoke: function(soft) {
    var invoker = this.invoker;
    if (soft !== true) this.invoker.uncallChain();
    this.properties.unset('invoker', invoker);
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