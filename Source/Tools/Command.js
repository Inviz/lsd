/*
---
 
script: Checkbox.js
 
description: A triggerable interaction abstraction
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - Ext/States
 
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
    widget.properties.set('command', this);
    if (this.disabled) widget.states.include('disabled');
    if (!this.bound) this.bound = {}
    if (!this.bound.enable) this.bound.enable = this.enable.bind(this);
    if (!this.bound.disable) this.bound.disable = this.disable.bind(this);
    if (this.type && this.type != 'command') {
      widget.states.set('checked');
      if (this.checked) widget.states.include('checked');
      if (!this.bound.check) this.bound.check = this.check.bind(this);
      if (!this.bound.uncheck) this.bound.uncheck = this.uncheck.bind(this);
      widget.addEvent('check', this.bound.check);
      widget.addEvent('uncheck', this.bound.uncheck);
      if (widget.checked) this.check();
    }
    widget.addEvent('disable', this.bound.disable);
    widget.addEvent('enable', this.bound.enable);
    if (widget.disabled) this.disable();
    this.widgets.push(widget);
    return this;
  },
  
  detach: function(widget) {
    widget.properties.unset('command', this);
    if (this.disabled) widget.states.erase('disabled');
    if (this.type && this.type != 'command') {
      widget.states.unset('checked');
      if (this.checked) widget.states.erase('checked');
      widget.removeEvent('check', this.bound.check);
      widget.removeEvent('uncheck', this.bound.uncheck);
    }
    widget.removeEvent('disable', this.bound.disable);
    widget.removeEvent('enable', this.bound.enable);
    this.widgets.erase(widget);
    return this;
  },
  
  check: function() {
    for (var i = 0, widget; widget = this.widgets[i++];) widget.states.include('checked');
  },
  
  uncheck: function() {
    for (var i = 0, widget; widget = this.widgets[i++];) widget.states.erase('checked');
  },
  
  disable: function() {
    for (var i = 0, widget; widget = this.widgets[i++];) widget.disable.add('disabled');
  },
  
  enable: function() {
    for (var i = 0, widget; widget = this.widgets[i++];) widget.enable.remove('disabled');
  },
  
  setType: function(type, unset) {
    if (this.type == type) return;
    if (this.type) this.unsetType(type);
    this.type = type;
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
        };
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
        }
        this.events = {
          click: function() {
            this.check.apply(this, arguments);
          },
          check: function() {
            if (group) group.each(function(sibling) {
              if (sibling != this) {
                sibling.uncheck();
                if (sibling.widgets) sibling.widgets.each(function(widget) {
                  widget.unclick();
                })
              }
            }, this);
          }
        };
    }
    if (this.events) {
      this.addEvents(this.events);
      if (!this.bound) this.bound = {};
      if (!this.bound.check) this.bound.check = this.check.bind(this);
      if (!this.bound.uncheck) this.bound.uncheck = this.uncheck.bind(this);
      for (var i = 0, widget; widget = this.widgets[i++];) {
        widget.states.set('checked');
        if (this.checked) widget.states.include('checked');
        widget.addEvent('check', this.bound.check);
        widget.addEvent('uncheck', this.bound.uncheck);
      }
    }
  },
  
  unsetType: function() {
    if (this.events) {
      if (this.type != 'command') {
        for (var i = 0, widget; widget = this.widgets[i++];) {
          widget.states.unset('checked');
          if (this.checked) widget.states.erase('checked');
          widget.removeEvent('check', this.bound.check);
          widget.removeEvent('uncheck', this.bound.uncheck);
        }
      }
      this.removeEvents(this.events);
      delete this.events;
    }
    delete this.type;
  }
});

LSD.Command.prototype.addStates('disabled', 'checked');