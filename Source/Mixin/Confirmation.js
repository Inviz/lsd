/*
---
 
script: Confirmation.js
 
description: Spit out a confirmation before command takes action
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

provides: 
  - LSD.Mixin.Confirmation
 
...
*/

LSD.Mixin.Confirmation = new Class({
  behaviour: '[confirm]',
  
  Stateful: {
    'confirming': ['confirm', 'unconfirm']
  },
  
  click: function() {
    this.confirm()
  },
  
  confirm: function() {
    
  }
});