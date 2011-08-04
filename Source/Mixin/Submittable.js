/*
---
 
script: Submittable.js
 
description: Makes widget result in either submission or cancellation
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
 
provides:
  - LSD.Mixin.Submittable
 
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
    }
  },
  
  submit: function(event) {
    this.fireEvent('beforeSubmit', arguments);
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
  }
});

LSD.Behavior.define(':submittable', 'submittable');