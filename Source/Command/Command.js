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
    var states = this.$states;
    var events = widget.events._command = {}, self = this;
    Object.each(states, function(state, name) {
      events[state.enabler] = function() {
        self[state.enabler].apply(widget, arguments)
      }
      events[state.disabler] = function() {
        self[state.disabler].apply(widget, arguments)
      }
    });
    if (widget.options.events.command) this.addEvents(widget.options.events.command);
    this.addEvents(events);
  },
  
  detach: function(widget) {
    if (widget.options.events.command) this.removeEvents(widget.options.events.command);
		var events = widget.events._command;
		if (events) this.removeEvents(events);
  }
});

LSD.Command.prototype.addState('disabled');

LSD.Command.Command = LSD.Command;