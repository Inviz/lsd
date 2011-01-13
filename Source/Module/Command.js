/*
---
 
script: Command.js
 
description: A command getter that watches attributes to redefine command
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Module.Expectations
  - LSD.Command.Command
  - LSD.Command.Radio
  - LSD.Command.Checkbox
  
provides: 
  - LSD.Module.Command
 
...
*/

/*
  Usually widget generate a command on its own. 
  
  The default type is 'command', but there are possible values of 
  'radio' and 'checkbox'.
  
  Type type can be changed via *options.command.type* 
  (equals to 'command-type' attribute).
  
  You can specify a command id in *command* attribute
  to link a widget to already initialized command.
*/

LSD.Module.Command = new Class({
  options: {
    command: {},
    expectations: {
      '[radiogroup]': ['getCommand', true],
      '[command]': ['getCommand', true],
    }
  },

  getCommand: function(force) {
    if (!force && this.command) return this.command;
    if (!this.attributes.command || !this.document.commands) {
      var options = this.options.command || {};
      var type = options.type || 'command', command;
      options = Object.append({id: this.options.id, name: this.attributes.name}, options);
      if (this.attributes.radiogroup) {
        options.radiogroup = this.attributes.radiogroup;
        type = 'radio'
      };
      if (!command) command = new LSD.Command[type.capitalize()](this.document, options);
    } else command = this.document.commands[this.attributes.command];
    command.attach(this);
    if (force && this.command) this.command.detach(this);
    return this.command = command;
  },
  
  click: function() {
    this.fireEvent('click', arguments);
    return this.getCommand().click();
  }
  
});