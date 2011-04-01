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
    request: {
      type: 'form'
    },
    pseudos: Array.fast('submittable')
  },
  
  initialize: function() {
    this.addEvents({
      nodeInserted: function(node) {
        if (node.pseudos['read-write'] || node.pseudos['form-associated']) node.form = this;
      },
      build: function() {
        this.element.submit = this.submit.bind(this);
      }
    });
    this.parent.apply(this, arguments);
    
    if (!this.getAttribute('action')) this.setAttribute('action', location.pathname);
  },
  
  submit: function(event) {
    this.fireEvent('submit', arguments);
    if (event && event.type == 'submit') {
      event.preventDefault();
      return this.callChain();
    } else return this.send.apply(this, arguments);
  }
}); 