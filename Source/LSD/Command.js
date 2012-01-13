/*
---
 
script: Command.js
 
description: A triggerable interaction abstraction
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Struct
  - Ext/States
 
provides: 
  - LSD.Command
 
...
*/

LSD.Command = new LSD.Class({
  options: {
    type: 'command',
    radiogroup: null,
    id: null
  },
  imports: {
    disabled: '.disabled'
  },
  exports: {
    
  },
  properties: {
    id: function() {

    },
    document: function() {

    },
    action: function() {

    },
    type: function() {

    },
    disabled: function() {

    },
    hidden: function() {

    },
    checked: function() {

    }
  }
});

LSD.Command.prototype.click = function() {
  //if (this.type != 'command')
};