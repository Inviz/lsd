/*
---
 
script: Radio.js
 
description: A command that is linked with others by name (one of many)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Command
 
provides: [LSD.Command.Radio]
 
...
*/

LSD.Command.Radio = new Class({
  Extends: LSD.Command,
  
  States: {
    checked: ['check', 'uncheck']
  },
  
  options: {
    events: {
      command: {
        'check': 'check',
        'uncheck': 'uncheck'
      }
    },
    radiogroup: false
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    var name = this.options.radiogroup;
    if (name) {
      var groups = this.document.radiogroups;
      if (!groups) groups = this.document.radiogroups = {};
      var group = groups[name];
      if (!group) group = groups[name] = [];
      group.push(this);
      this.group = group;
    }
  },
  
  check: Macro.onion(function() {
    console.log('chheck', this.group)
    this.group.each(function(command) {
      if (command != this) command.uncheck()
    });
  });
});