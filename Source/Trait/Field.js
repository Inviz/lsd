/*
---
 
script: Field.js
 
description: A single form field
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD
 
provides: 
  - LSD.Trait.Field
 
...
*/

LSD.Trait.Field = new Class({
  options: {
    writable: true,
    name: null
  },
  
  initialize: function() {
    if (this.options.name) this.attributes.name = this.options.name;
    this.parent.apply(this, arguments);
  }
})