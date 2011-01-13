/*
---
 
script: Action.js
 
description: Action is a class that adds some feature to widget by mixing up in runtime
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires: 
  - LSD
 
provides: 
  - LSD.Action
 
...
*/


LSD.Action = function(options, name) {
  var target, state;
  var self = {
    enable: function() {
      if (self.enabled) return false;
      if (state) target[state.enabler]();
      options.enable.apply(target, arguments);
      if (options.events) target.addEvents(target.events[options.events]);
      if (self.enabled == null) target.addEvents(events);
      self.enabled = true;
      return true;
    },

    disable: function() {
      if (!self.enabled) return false;
      if (state) target[state.disabler]();
      options.disable.apply(target, arguments);
      if (options.events) target.removeEvents(target.events[options.events]);
      if (self.enabled != null) target.removeEvents(events);
      self.enabled = false;
      return true;
    },

    use: function(widget, state) {
      var widgets = Array.from(arguments);
      var state = widgets.pop();
      self[state ? 'enable' : 'disable'].apply(self, widgets);
    },

    watch: function(widget, state) {
      if (!self[state ? 'enable' : 'disable'](widget)) //try enable the action
        options[state ? 'enable' : 'disable'].call(target, widget); //just fire the callback 
    },
    
    inject: function() {
      self.enable();
      if (state) self[state.disabler]();
    },

    attach: function(widget) {
      target = widget;
      state = widget.options.states && widget.options.states[name];
      if (state) {
        events[state.enabler] = options.enable.bind(target);
        events[state.disabler] = options.disabler.bind(target);
      }
      target.addEvents(events);
      if (options.uses) {
        target.use(options.uses, self.use);
      } else if (options.watches) {
        target.watch(options.watches, self.watch);
      } else if (!state || target[name]) target.onDOMInject(self.inject);
    },

    detach: function(widget) {
      target.removeEvents(events);
      if (options.watches) target.unwatch(options.watches, self.watch);
      if (self.enabled) self.disable();
      if (state) {
        self[state.disabler]();
        delete events[state.enabler], events[state.disabler];
      }
      target = state = null;
    }
  }
  var events = {
    enable:  self.enable,
    disable: self.disable,
    detach:  self.disable
  };  
  return self ;
}