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
    options: options,
    
    enable: function() {
      if (self.enabled) return false;
      this.commit(target, state, arguments);
      if (options.events) target.addEvents(target.events[options.events]);
      if (self.enabled == null) target.addEvents(events);
      self.enabled = true;
      return true;
    },

    disable: function() {
      if (!self.enabled) return false;
      this.revert(target, state, arguments);
      if (options.events) target.removeEvents(target.events[options.events]);
      if (self.enabled != null) target.removeEvents(events);
      self.enabled = false;
      return true;
    },
    
    commit: function(target, state, args) {
      if (state) target[state.enabler]();
      var result = options.enable.apply(this, [target].concat(args));
      return result;
    },
    
    revert: function(target, state, args) {
      if (state) target[state.disabler]();
      return options.disable.apply(this, [target].concat(args));
    },
    
    perform: function(target, state, args) {
      var method = (!options.getState || !options.getState.apply(this, [target].concat(args))) ? 'commit' : 'revert';
      return this[method].apply(this, arguments);
    },

    use: function(widget, state) {
      var widgets = Array.prototype.slice.call(arguments, 0);
      var state = widgets.pop();
      self[state ? 'enable' : 'disable'].apply(self, widgets);
    },

    watch: function(widget, state) {
      if (!self[state ? 'enable' : 'disable'](widget)) //try enable the action
        options[state ? 'enable' : 'disable'].call(target, widget); //just fire the callback 
    },
    
    inject: function() {
      self.enable();
      if (state) self[state.enabler]();
    },

    attach: function(widget) {
      target = widget;
      state = name && widget.options.states && widget.options.states[name];
      if (state) {
        events[state.enabler] = options.enable.bind(target);
        events[state.disabler] = options.disabler.bind(target);
      }
      target.addEvents(events);
      if (options.uses) {
        target.use(options.uses, self.use);
      } else if (options.watches) {
        target.watch(options.watches, self.watch);
      } else if (!state || (name && target[name])) target.onDOMInject(self.inject);
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
    },
    
    store: function(key, value) {
      if (!this.storage) this.storage = {};
      if (!key.indexOf && (typeof key !== 'number')) key = $uid(key);
      this.storage[key] = value;
     },
    
    retrieve: function(key) {
      if (!this.storage) return;
      if (!key.indexOf && (typeof key !== 'number')) key = $uid(key);
      return this.storage[key];
    }
    
    
  };
  for (var methods = ['enable', 'disable'], i, method; method = methods[i++];) {
    var fn = options[method];
    if (fn && !fn.call) {
      var types = fn;
      options[method] = function(target) {
        var callback = types[typeOf(target)];
        if (callback) return callback.apply(this, arguments);
      }
    }
  }
  var events = {
    enable:  self.enable,
    disable: self.disable,
    detach:  self.disable
  };  
  return self;
};

LSD.Action.build = function(curry) {
  return function(options, name) {
    return new LSD.Action(Object.append({}, options, curry), name);
  };
};