/*
---
 
script: Form.js
 
description: A mixin to make widget take focus like a regular input (even in Safari)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Mixin
  - QFocuser/QFocuser
 
provides:
  - LSD.Mixin.Form
 
...
*/


LSD.Mixin.Form = new Class({
  options: {},
  
  initializers: {
    form: function() {
      return {
        events: {
          nodeInserted: function(node) {
            if (!node.form && (node.pseudos['submittable'] || node.pseudos['form-associated'])) node.form = this;
          }
        }
      }
    }
  },
  
  submit: function(event) {
    this.fireEvent('submit', arguments);
    if (event && event.type == 'submit') event.preventDefault();
  },
  
  cancel: function() {
    this.fireEvent('cancel', arguments);
  },
  
  reset: function() {
    
  }
});

LSD.Behavior.define(':form', LSD.Mixin.Form);