/*
---
 
script: Form.js
 
description: Act as a form to submit data
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Trait
  - LSD.Mixin.Request
 
provides: 
  - LSD.Trait.Form
 
...
*/

LSD.Trait.Form = new Class({
  
  options: {
    pseudos: Array.fast('submittable')
  },
  
  initializers: {
    form: function() {
      return {
        events: {
          nodeInserted: function(node) {
            if (!node.form && (node.pseudos['read-write'] || node.pseudos['form-associated'])) node.form = this;
          }
        }
      }
    }
  },
  
  submit: function(event) {
    this.fireEvent('submit', arguments);
    if (event && event.type == 'submit') {
      event.preventDefault();
      return this.callChain();
    } else return this.send.apply(this, arguments);
  },
  
  getRequestURL: function() {
    return this.attributes.action || location.pathname;
  }
}); 