/*
---
 
script: Command.js
 
description: Command is an abstract one-way interaction that can be triggered by different widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD
 
provides: 
  - LSD.Command
 
...
*/

LSD.Command = new Class({
  States: {
    disabled: ['disable', 'enable']
  },
  
  initialize: function(document, options) {
    this.document = document;
    this.setOptions(options);
  }
})