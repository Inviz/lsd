/*
---
 
script: Radio.js
 
description: A command that is linked with others by name (one of many)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Command
 
provides: 
  - LSD.Command.Radio
 
...
*/

/*
  Radio groupping is a way to links commands together to allow
  only one in the group be active at the moment of time.
  
  Activation (*check*ing) of the commands deactivates all 
  other commands in a radiogroup.
  
  Examples: 
    - Tabs on top of a content window
    - List of currently open documents in a context menu that
      shows which of them is the one you edit now and an 
      ability to switch between documents
*/

LSD.Command.Radio = new Class({
  Extends: LSD.Command,
  
  options: {
    radiogroup: false
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    var name = this.options.radiogroup || this.options.name;
    if (name) {
      var groups = this.document.radiogroups;
      if (!groups) groups = this.document.radiogroups = {};
      var group = groups[name];
      if (!group) group = groups[name] = [];
      group.push(this);
      this.group = group;
    }
    this.addEvent('check', function() {
      group.each(function(command) {
        if (command != this) command.uncheck()
      }, this);
    }.bind(this))
  },
  
  click: function() {
    this.parent.apply(this, arguments);
    this.check();
  }
});

LSD.Command.prototype.addState('checked');