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
    has: {
      many: {
        submitters: {
          selector: ':submitter',
          as: 'submittable',
          scope: {
            'default': {
              filter: '[default]'
            }
          },
          options: {
            chain: {
              submission: function() {
                var args;
                if (this.attributes.formmethod) (args || (args = {})).method = this.attributes.formmethod;
                if (this.attributes.formaction) (args || (args = {})).url = this.attributes.formaction;
                var action = {action: 'submit', target: this.submittable};
                if (args) action.arguments = args;
                return action;
              }
            }
          },
          callbacks: {
            fill: function() {
              this.properties.watch('rendered', this.bind(LSD.Mixin.Submittable.watchNativeSubmission));
            },
            empty: function() {
              this.properties.unwatch('rendered', this.bind(LSD.Mixin.Submittable.watchNativeSubmission));
            }
          }
        }
      }
    },
    events: {
      _form: {
        attach: function(element) {
          if (LSD.toLowerCase(element.tagName) == 'form') element.addEvent('submit', this.bind('submit'));
        },
        detach: function(element) {
          if (LSD.toLowerCase(element.tagName) == 'form') element.removeEvent('submit', this.bind('submit'));
        }
      }
    }
  },
  
  submit: function(event) {
    this.fireEvent('beforeSubmit', arguments);
    if (event) {
      switch (event.type) {
        case "submit":
          if (event.target == this.element) event.preventDefault();
          break;
        case "click":
          if (LSD.toLowerCase(event.target.tagName) == 'input' && event.target.type == 'submit')
            event.preventDefault();
      }
    }
    var submission = this.captureEvent('submit', arguments);
    if (!submission && submission !== false) this.callChain.apply(this, arguments);
    this.fireEvent('afterSubmit', arguments);
    return submission;
  },
  
  cancel: function() {
    var submission = this.fireEvent('cancel', arguments);
    var target = this.getSubmissionTarget();
    if (target) target.uncallChain();
    this.uncallChain();
    return submission;
  }
});

/*
  Injects native submit button at top of the form that gets activated 
  when `enter` button is pressed in the form field. It stops the 
  native submission, and submits the widget form instead. 
  
  The first submitter widget in the form is considered activated and
  its value is used for submission data.
*/
LSD.Mixin.Submittable.watchNativeSubmission = function(state) {
  if (LSD.toLowerCase(this.element.tagName) == 'form') {
    if (state) {
      this.allocate('submit').inject(this.element, 'top').addEvent('click', this.bind('submit'))
    } else {
      this.release('submit').dispose().removeEvent('click', this.bind('submit'));
    }
  } else {
    this.element[state ? 'addEvent' : 'removeEvent']('keydown', this.bind(LSD.Mixin.Submittable.listenKeyPress))
  }
  /* 
    novalidate html attribute disables internal form validation 
    on form submission. Chrome and Safari will block form 
    submission without any visual clues otherwise.
  */
  this.element[state ? 'setAttribute' : 'removeAttribute']('novalidate', '');
};

LSD.Mixin.Submittable.listenKeyPress = function(event) {
  if (event.key == 'enter') {
    this.submit()
    event.preventDefault();
  }
};

LSD.Behavior.define(':submittable', 'submittable');