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
    action: null
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
    for (var name in this.$states) this.linkState(widget, name, name, true);
    widget.fireEvent('register', ['command', this]);
  },
  
  detach: function(widget) {
    widget.fireEvent('unregister', ['command', this]);
    for (var name in this.$states) this.linkState(widget, name, name, false);
  }
});

LSD.Command.prototype.addState('disabled');

LSD.Command.Command = LSD.Command;