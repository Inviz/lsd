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
    this.parent.apply(this, arguments);
    console.log('ima form trait')
    if (!this.getAttribute('action')) this.setAttribute('action', location.pathname);
  },
  
  submit: function(e) {
    this.fireEvent('submit');
    if (this.getRequestType() != 'form') {
      if (e) e.stop();
      this.send()
    }
  },
  
  reset: function() {
    
  }  
})