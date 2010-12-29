/*
---
 
script: Command.js
 
description: Makes widget use and generate commands
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Base
  - LSD.Command
  - LSD.Command.Command
  - LSD.Command.Radio
  - LSD.Command.Checkbox

provides:
  - LSD.Widget.Module.Command
  - LSD.Widget.Module.Command.Checkbox
  - LSD.Widget.Module.Command.Radio
 
...
*/

LSD.Widget.Module.Command = new Class({
  options: {
    command: {
      type: 'command'
    },
    events: {
      command: {
        'enable': 'enable',
        'disable': 'disable',
      }
    }
  },
  
  /*
    Usually widget generate a command on its own. 
    
    The default type is 'command', but there are possible values of 
    'radio' and 'checkbox'.
    
    Type type can be changed via *options.command.type* 
    (equals to 'command-type' attribute). 
  */

  getCommand: Macro.getter('command', function() {
    var type = this.options.command.type.capitalize();
    var options = Object.append({id: this.options.id}, this.options.command);
    return new LSD.Command[type](this.document, options).addEvents(this.events.command)
  }),
  
  click: function() {
    this.fireEvent('click');
    return this.getCommand().click();
  }
  
});

/*
  Checkbox commands are useful when you need to track and toggle
  state of some linked object. 
  
  Provide your custom logic hooking on *check* and *uncheck*
  state transitions. Use *checked* property to get the current state.
  
  Examples:
    - Button that toggles visibility of a sidebar
    - Context menu item that shows or hides line numbers in editor
*/
LSD.Widget.Module.Command.Checkbox = [
  Class.Stateful({
    checked: ['check', 'uncheck', 'toggle']
  }),
  new Class({
    options: {
      command: {
        type: 'checkbox'
      },
      events: {
        command: {
          'check': 'check',
          'uncheck': 'uncheck',
        }
      }
    }
  })
];

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

LSD.Widget.Module.Command.Radio = [
  Class.Stateful({
    checked: ['check', 'uncheck']
  }),
  
  new Class({  
    options: {
      radiogroup: null,
      command: {
        type: 'radio'
      },
      events: {
        command: {
          'check': 'check',
          'uncheck': 'uncheck',
        }
      }
    },
    
    getCommand: function() {
      if (!this.command) {
        var options = this.options, command = options.command;
        if (!command.radiogroup) command.radiogroup = options.radiogroup || this.attributes.name;
      }
      return this.parent.apply(this, arguments);
    }
  })
];

Widget.Attributes.Ignore.push('command-type');
Widget.Events.Ignore.push('command');