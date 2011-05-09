/*
---
 
script: Checkbox.js
 
description: Abstract command
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
 
provides: 
  - LSD.Command
  - LSD.Command.Command
 
...
*/

LSD.Command = new Class({
  options: {
    id: null,
    action: null,
    states: Array.fast('disabled')
  },
  
  Implements: [Options, Events, States],
  
  initialize: function(document, options) {
    this.setOptions(options);
    if (document) {
      this.document = document;
      if (!this.document.commands) this.document.commands = {};
      this.document.commands[this.options.id] = this;
    }
  },
  
  click: function() {
    this.fireEvent('click', arguments);
  },
  
  attach: function(widget) {
    Object.each(this.$states, function(state, name) {
      widget.linkState(this, name, name, true);
    }, this);
    widget.fireEvent('register', ['command', self]);
  },
  
  detach: function(widget) {
    widget.fireEvent('unregister', ['command', self])
    Object.each(this.$states, function(state, name) {
      widget.linkState(this, name, name, false);
    }, this);
  }
});

LSD.Command.Command = LSD.Command;