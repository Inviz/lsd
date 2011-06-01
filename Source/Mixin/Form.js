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
  initializers: {
    form: function() {
      return {
        events: {
          nodeInserted: function(node) {
            if (!node.form && (node.attributes.name || node.pseudos['form-associated'])) node.form = this;
          }
        }
      }
    }
  },
  
  submit: function(event) {
    this.fireEvent('submit', arguments);
    if (event && event.type == 'submit') event.preventDefault();
    return this.send && this.send.apply(this, arguments)
  },
  
  cancel: function(event) {
    if (event && event.event) event.preventDefault();
    this.fireEvent('cancel', arguments);
  }
});

LSD.Behavior.define(':form', LSD.Mixin.Form);