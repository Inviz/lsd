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
 
...
*/

LSD.Command = function(document, options) {
  this.setOptions(options);
  this.widgets = [];
  this.$events = Object.clone(this.$events);
  if (document) {
    this.document = document;
    if (!this.document.commands) this.document.commands = {};
    this.document.commands[this.options.id] = this;
  }
  if (this.options.type) this.setType(this.options.type);
};

LSD.Command.prototype = Object.append(new Options, new Events, new States, {
  options: {
    id: null,
    action: null
  },
  
  click: function() {
    this.fireEvent('click', arguments);
  },
  
  attach: function(widget) {
    for (var name in this.$states) {
      if (!widget.$states[name]) {
        widget.addState(name);
        widget.$states[name].origin = this;
      }
      this.linkState(widget, name, name, true);
    }
    widget.fireEvent('register', ['command', this]);
    this.widgets.push(widget);
    return this;
  },
  
  detach: function(widget) {
    widget.fireEvent('unregister', ['command', this]);
    for (var name in this.$states) {
      this.linkState(widget, name, name, false);
      if (widget.$states[name].origin == this); widget.removeState(name);
    }
    this.widgets.erase(widget);
    return this;
  },
  
  setType: function(type, unset) {
    if (this.type == type) return;
    if (this.type) this.unsetType(type);
    switch (type) {
      case "checkbox":
        /*
          Checkbox commands are useful when you need to track and toggle
          state of some linked object. 

          Provide your custom logic hooking on *check* and *uncheck*
          state transitions. Use *checked* property to get the current state.

          Examples:
            - Button that toggles visibility of a sidebar
            - Context menu item that shows or hides line numbers in editor
        */
        this.events = {
          click: function() {
            this.toggle();
          }
        }
        break;
        

      /*
        Radio groupping is a way to links commands together to allow
        only one in the group be active at the moment of time.

        Activation (*check*ing) of the commands deactivates all 
        other commands in a radiogroup.

        Examples: 
          - Tabs on top of a content window
          - Select box with a dropdown menu
      */
      case "radio":
        var name = this.options.radiogroup;
        if (name) {
          var groups = this.document.radiogroups;
          if (!groups) groups = this.document.radiogroups = {};
          var group = groups[name];
          if (!group) group = groups[name] = [];
          group.push(this);
          this.group = group;
          this.events = {
            click: function() {
              this.check.apply(this, arguments);
            },
            check: function() {
              group.each(function(sibling) {
                if (sibling != this) sibling.uncheck();
              }, this);
            }
          };
        }
    }
    if (this.events) this.addEvents(this.events);
  },
  
  unsetType: function() {
    if (this.events) {
      this.removeEvents(this.events);
      delete this.events;
    }
    delete this.type;
  }
});

LSD.Command.prototype.addStates('disabled', 'checked');