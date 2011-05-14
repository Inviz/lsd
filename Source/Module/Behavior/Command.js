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
  Usually a widget that does something interactive defines command
  automatically. 
  
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
    chain: {
      commandaction: function() {
        var action = this.getCommandAction.apply(this, arguments);
        if (action) return {action: action, priority: 10}
      }
    },
  },
  
  initializers: {
    command: function() {
      return {
        expectations: {
          '[radiogroup]': ['getCommand', true],
          '[command]': ['getCommand', true],
        }
      }
    }
  },

  getCommand: function(force) {
    if (!force && this.command) return this.command;
    if (!this.attributes.command || !this.document.commands) {
      var options = this.options.command || {};
      var type = this.getCommandType(), command;
      options = Object.append(this.getCommandOptions(), options);
      if (!command) command = new LSD.Command[type.capitalize()](this.document, options);
    } else command = this.document.commands[this.attributes.command];
    command.attach(this);
    if (force && this.command) this.command.detach(this);
    return this.command = command;
  },
  
  click: function() {
    this.fireEvent('click', arguments);
    this.clearChain.apply(this, arguments);
    var command = this.getCommand();
    command.click.apply(command, arguments);
    return this.callChain.apply(this, arguments);
  },
  
  getCommandAction: function() {
    return this.attributes.commandaction || this.captureEvent('getCommandAction', arguments);
  },
  
  getCommandType: function() {
    return this.attributes.commandtype || this.options.command.type || (this.attributes.radiogroup ? 'radio' : 'command');
  },
  
  getCommandOptions: function() {
    return {id: this.options.id, name: this.attributes.name, radiogroup: this.attributes.radiogroup};
  }
  
});