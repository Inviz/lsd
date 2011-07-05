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
    actions: {
      autosubmission: {
        enable: function() {
          if (this.attributes.autosubmit) this.submit();
        }
      }
    },
    chain: {
      feedback: function() {
        return {
          action: 'submit',
          target: this.getSubmissionTarget,
          arguments: this.getSubmissionData,
          priority: -5
        }
      }
    }
  },
  
  constructors: {
    invoker: function() {
      if (this.options.invoker) this.setInvoker(this.options.invoker);
    }
  },
  
  invoke: function(invoker) {
    this.setInvoker(invoker);
    this.captureEvent('invoke', invoker);
  },
  
  revoke: function() {
    this.unsetInvoker(invoker);
    this.captureEvent('revoke', invoker);
  },
  
  setInvoker: function(invoker) {
    this.invoker = invoker;
    this.fireEvent('register', ['invoker', invoker]);
  },
  
  unsetInvoker: function(invoker) {
    this.fireEvent('unregister', ['invoker', invoker]);
    delete this.invoker;
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