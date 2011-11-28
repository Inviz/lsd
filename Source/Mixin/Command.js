/*
---
 
script: Command.js
 
description: A command getter that watches attributes to redefine command
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD.Module.Expectations
  - LSD.Command
  
provides: 
  - LSD.Mixin.Command
 
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

LSD.Mixin.Command = new Class({
  options: {
    chain: {
      commandaction: function() {
        var action = this.getCommandAction.apply(this, arguments);
        if (action) return {action: action, priority: 10}
      }
    },
    actions: {
      command: {
        enable: function() {
          this.getCommand();
          if (LSD.Mixin.Command.getCommandType.call(this) == 'command') {
            var arg = this.getValue ? this.getValue() : true;
          } else {
            var arg = !!this.checked;
          };
          if (arg != null) this.eachLink('quickstart', arg, true, !this.getCommandState());
        }
      }
    }
  },
  
  getCommand: function() {
    if (this.command) return this.command;
    var options = Object.append(this.getCommandOptions(), this.options.command || {});
    this.command = new LSD.Command(this.document, options).attach(this);
    return this.command;
  },
  
  click: function() {
    if (this.disabled) return false;
    this.fireEvent('click', arguments);
    this.getCommand().click();
    var method = this.getCommandState() ? 'callChain' : 'uncallChain';
    return this[method].apply(this, arguments) != false || this.getCommandType() != 'command';
  },
  
  unclick: function() {
    return this.uncallChain.apply(this, arguments);
  },
  
  setCommandType: function(type) {
    this.getCommand().setType(type);
    this.commandType = type;
  },
  
  unsetCommandType: function(type) {
    this.getCommand().unsetType(type);
    delete this.commandType
  },
  
  getCommandAction: function() {
    return this.attributes.commandaction || this.options.commandAction || this.captureEvent('getCommandAction', arguments);
  },
  
  getCommandOptions: function() {
    return {id: this.attributes.id || this.lsd, radiogroup: this.getCommandRadioGroup(), type: this.getCommandType()};
  },
  
  getCommandRadioGroup: function() {
    return this.attributes.radiogroup || this.attributes.name || this.options.radiogroup || this.captureEvent('getCommandRadioGroup');
  }
  
});

Object.append(LSD.Mixin.Command, {
  getCommandType: function() {
    return this.attributes.commandtype || this.commandType || (this.pseudos.checkbox && 'checkbox') || (this.pseudos.radio && 'radio') || 'command';
  },
  
  getCommandState: function() {
    return (LSD.Mixin.Command.getCommandType.call(this) == 'command') || this.checked;
  }
});

['getCommandType', 'getCommandState'].each(function(method) {
  LSD.Mixin.Command.implement(method, LSD.Mixin.Command[method]);
});

LSD.Options.commandType = {
  add: 'setCommandType',
  remove: 'unsetCommandType'
};

LSD.Behavior.define(':command, :radio, :checkbox, [accesskey]', 'command');