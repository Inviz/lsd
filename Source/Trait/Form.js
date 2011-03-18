/*
---
 
script: Form.js
 
description: Act as a form to submit data
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
  - LSD.Mixin.Request
 
provides: 
  - LSD.Trait.Form
 
...
*/

LSD.Trait.Form = new Class({
  
  options: {
    request: {
      type: 'form'
    }
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
  
  submit: function() {
    this.fireEvent('submit');
    if (this.getRequestType() == 'form' && event && event.type == 'submit' && ['post', 'get'].contains(this.getRequestMethod())) return;
    this.send.apply(this, arguments);
  }
}); 