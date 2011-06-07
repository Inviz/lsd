/*
---
 
script: Invokable.js
 
description: Makes widget result in either submission or cancellation
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - QFocuser/QFocuser
 
provides:
  - LSD.Mixin.Invoked
 
...
*/


LSD.Mixin.Submittable = new Class({
  options: {
    actions: {
      autosubmission: {
        enable: function() {
          if (this.attributes.autosubmit) this.submit();
        }
      }
    },
    events: {
      _form: {
        attach: function(element) {
          if (LSD.toLowerCase(element.tagName) == 'form') element.addEvent('submit', this.bindEvent('submit'));
        },
        detach: function(element) {
          if (LSD.toLowerCase(element.tagName) == 'form') element.removeEvent('submit', this.bindEvent('submit'));
        }
      }
    },
    chain: {
      submission: function() {
        return {
          action: 'submit',
          target: this.getSubmissionTarget,
          arguments: this.getSubmissionData,
          priority: -5
        }
      }
    }
  },
  
  submit: function(event) {
    if (event && event.type == 'submit' && event.target == this.element)
      event.preventDefault();

    var submission = this.captureEvent('submit', arguments);
    if (submission) return submission;
    else if (submission !== false) this.callChain();
    return this;
  },
  
  cancel: function() {
    var submission = this.captureEvent('cancel', arguments);
    if (submission) return submission;
    else if (submission !== false) {
      var target = this.getSubmissionTarget();
      if (target) target.uncallChain();
      this.uncallChain();
    };
    return this;
  },
  
  getInvoker: function() {
    return this.invoker || this.options.invoker;
  },
  
  getSubmissionTarget: function() {
    return this.getInvoker();
  },
  
  getSubmissionData: function() {
    return this.getData();
  }
});

LSD.Behavior.define(':submittable', LSD.Mixin.Submittable);