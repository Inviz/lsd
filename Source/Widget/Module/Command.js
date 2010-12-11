/*
---
 
script: Command.js
 
description: Makes widget use and generate commands
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
- LSD.Widget.Base

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
    var options = $extend({id: this.options.id}, this.options.command);
    return new LSD.Command[type](options).addEvents(this.events.command)
  })
  
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
  {
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
  }
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
  {  
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
    }
  }
];

Widget.Attributes.Ignore.push('command-type');
Widget.Events.Ignore.push('command');