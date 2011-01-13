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
  Stateful: {
    disabled: ['disable', 'enable']
  },
  
  options: {
    id: null
  },
  
  Implements: [Options, Events],
  
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
    var states = this.options.states;
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
    this.removeEvents(events);
  }
})

LSD.Command.Command = LSD.Command;