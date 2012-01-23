/*
---
 
script: Command.js
 
description: A triggerable interaction abstraction
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Struct.Stack
 
provides: 
  - LSD.Command
 
...
*/

LSD.Command = new LSD.Struct({
  imports: {
    disabled: '.disabled'
  },
  exports: {
    commandType: 'type'
  },
  properties: {
    id: function(value, old) {

    },
    title: function() {

    },
    icon: function() {
      
    },
    label: function(value, old) {
      
    },
    document: function(value, old) {

    },
    action: function(value, old) {

    },
    type: function(value, old) {

    },
    radiogroup: function(value, old) {
      
    },
    disabled: function(value, old) {

    },
    hidden: function(value, old) {

    },
    checked: function(value, old) {

    }
  }
});
LSD.Command.prototype.type = 'command';
LSD.Command.prototype.click = function() {
  switch (this.type) {
    case 'radio':
      if (!this.checked) this.set('checked', true);
      break;
    case 'checkbox':
      this[this.checked === true ? 'unset' : 'set']('checked', true);
      break;
    case 'command':
  }
};
LSD.Command.prototype.check = function() {
  this.reset('checked', true)
};
LSD.Command.prototype.uncheck = function() {
  this.reset('checked', false)
};