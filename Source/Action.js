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
  this.options = this.options ? Object.append(options || {}, this.options) : options || {};
  this.name = name;
  this.events = {
    enable:  this.enable.bind(this),
    disable: this.disable.bind(this),
    detach:  this.disable.bind(this)
  }
  if (this.options.enabler) LSD.Action[LSD.toClassName(this.options.enabler)] = LSD.Action.build({
    enable: this.options.enable,
    disable: this.options.disable,
    getState: this.options.getState
  })
  if (this.options.disabler) LSD.Action[LSD.toClassName(this.options.disabler)] = LSD.Action.build({
    enable: this.options.disable,
    disable: this.options.enable,
    getState: this.options.getState && function() {
      return !this.options.getState.apply(this, arguments)
    }.bind(this)
  })
  return this;
};

LSD.Action.prototype = {
  enable: function() {
    if (this.enabled) return false;
    this.commit(this.target, arguments, this.target);
    if (this.options.events) this.target.addEvents(this.target.events[this.options.events]);
    if (this.enabled == null) this.target.addEvents(this.events);
    this.enabled = true;
    return true;
  },

  disable: function() {
    if (!this.enabled) return false;
    this.revert(this.target, arguments, this.target);
    if (this.options.events) this.target.removeEvents(this.target.events[this.options.events]);
    if (this.enabled != null) this.target.removeEvents(this.events);
    this.enabled = false;
    return true;
  },
  
  commit: function(target, args, bind) {
    if (this.state) this.target[this.state.enabler]();
    return this.options.enable && this.options.enable.apply(bind || this, [target].concat(args));
  },
  
  revert: function(target, args, bind) {
    if (this.state) this.target[this.state.disabler]();
    return this.options.disable && this.options.disable.apply(bind || this, [target].concat(args));
  },
  
  perform: function(target, args) {
    var method = (!this.options.getState || this.options.getState.apply(this, [target].concat(args))) ? 'commit' : 'revert';
    return this[method].apply(this, arguments);
  },

  use: function(widget, state) {
    var widgets = Array.prototype.slice.call(arguments, 0);
    var state = widgets.pop();
    this[state ? 'enable' : 'disable'].apply(this, widgets);
  },

  watch: function(widget, state) {
    if (!this[state ? 'enable' : 'disable'](widget)) //try enable the action
      this.options[state ? 'enable' : 'disable'].call(this.target, widget); //just fire the callback 
  },
  
  inject: function() {
    this.enable();
    if (this.state) this[state.enabler]();
  },

  attach: function(widget) {
    this.target = widget;
    this.state = this.name && widget.$states && widget.$states[this.name];
    if (this.state) {
      this.events[this.state.enabler] = this.options.enable.bind(this.target);
      this.events[this.state.disabler] = this.options.disabler.bind(this.target);
    }
    this.target.addEvents(this.events);
    if (this.options.uses) {
      this.target.use(this.options.uses, this.use.bind(this));
    } else if (this.options.watches) {
      this.target.watch(this.options.watches, this.watch.bind(this));
    } else if (!this.state || (name && this.target[name])) {
      if (this.target.onDOMInject) this.target.onDOMInject(this.inject.bind(this));
      else this.inject()
    }
  },

  detach: function(widget) {
    this.target.removeEvents(this.events);
    if (this.options.watches) this.target.unwatch(this.options.watches, this.watch);
    if (this.enabled) this.disable();
    if (this.state) {
      this[this.state.disabler]();
      delete this.events[this.state.enabler], this.events[this.state.disabler];
    }
    this.target = this.state = null;
  },
  
  store: function(key, value) {
    if (!this.storage) this.storage = {};
    if (!key.indexOf && (typeof key !== 'number')) key = LSD.uid(key);
    this.storage[key] = value;
   },
  
  retrieve: function(key) {
    if (!this.storage) return;
    if (!key.indexOf && (typeof key !== 'number')) key = LSD.uid(key);
    return this.storage[key];
  },
  
  eliminate: function(key) {
    if (!this.storage) return;
    if (!key.indexOf && (typeof key !== 'number')) key = LSD.uid(key);
    delete this.storage[key];
  },
  
  getInvoker: function() {
    return this.invoker;
  },
  
  getDocument: function() {
    return this.invoker && this.invoker.document;
  }
}

LSD.Action.build = function(curry) {
  var action = function() {
    LSD.Action.apply(this, arguments);
  };
  action.prototype = Object.merge({options: curry}, LSD.Action.prototype);
  return action;
};