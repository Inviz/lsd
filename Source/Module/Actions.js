/*
---
 
script: Actions.js
 
description: Assign functions asyncronously to any widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Action
  - LSD.Module.Expectations
 
provides: 
  - LSD.Module.Actions
 
...
*/

LSD.Module.Actions = new Class({
  Stateful: Object.subset(LSD.States.Known, ['disabled']),
  
  initialize: function() {
    this.actions = {};
    this.parent.apply(this, arguments);
    var actions = this.options.actions;
    for (var name in actions) {
      var action = actions[name];
      if (!action.lazy && action.enable && action.disable) this.addAction(name)
    }
  },
  
  addAction: function() {
    this.getAction.apply(this, arguments).attach(this);
  },
  
  removeAction: function() {
    this.getAction.apply(this, arguments).detach(this);
  },
  
  getAction: function(action) {
    if (action instanceof LSD.Action) return action;
    if (typeof action == 'string') {
      if (this.actions[action]) return this.actions[action];
      var actions = this.options.actions;
      var named = {name: action};
      if (actions && actions[action]) action = Object.append(actions[action], named);
      else action = named;
    }   
    var cc = action.name.capitalize();
    var Action = LSD.Action[cc] || LSD.Action;
    return this.actions[action.name] || (this.actions[action.name] = new Action(action, action.name))
  },

  mixin: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[mixin.capitalize()];
    Class.mixin(this, mixin);
    var options = mixin.prototype.options;
    if (!options) return;
    for (var action in options.actions) this.addAction(Object.clone(action));
    if (options.events) this.addEvents(this.bindEvents(options.events));
  },

  unmix: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[mixin.capitalize()];
    var options = Object.clone(mixin.prototype.options);
    if (options) {
      for (var action in options.actions) this.removeAction(action);
      if (options.events) this.removeEvents(this.bindEvents(options.events));
    };
    Class.unmix(this, mixin);
  },
  
  getTarget: function() {
    return false;
  },
  
  execute: function(action, args) {
    if (typeof action == 'string') action = this.getAction(action);
    var targets = this.getTarget();
    if (targets) targets.each(function(target) {
      action.perform(target, target.options && target.options.states && target.options.states[action.name], args);
    });
  }
});

LSD.addEvent('before', function() {
  Object.each(LSD.Mixin, function(mixin, name) {
    var selector = mixin.prototype.behaviour;
    if (!selector) return;
    var watcher = function (widget, state) {
      widget[state ? 'mixin' : 'unmix'](mixin)
    };
    selector.split(/\s*,\s*/).each(function(bit) {
      LSD.Module.Expectations.behaviours[bit] = watcher;
    })
  });
})