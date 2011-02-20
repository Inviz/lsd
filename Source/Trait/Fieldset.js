/*
---
 
script: Fieldset.js
 
description: Wrapper around set of form fields
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Trait.Fieldset
 
...
*/

LSD.Trait.Fieldset = new Class({
  initialize: function() {
    this.elements = {};
    this.addEvent('nodeInserted', function(node) {
      var name = node.attributes.name;
      if (node.pseudos['read-write'] && name) this.elements[name] = node
    });
    this.parent.apply(this, arguments)
  },
  
  checkValidity: function() {
    var valid = true;
    for (var name in this.elements) if (!this.elements[name].checkValidity()) valid = false;
    return valid;
  },

  getRequestData: function() {
    return this.element;
  },
  
  reset: function() {
    
  }  
})