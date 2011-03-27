/*
---
 
script: Actions.js
 
description: Assign functions asyncronously to any widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD
  - LSD.Action

provides: 
  - LSD.Module.Actions
 
...
*/

LSD.Module.Actions = new Class({
  Stateful: Object.subset(LSD.States.Known, ['disabled']),
  
  options: {
    chain: {}
  },
  
  initialize: function() {
    this.actions = {};
    this.currentActionIndex = -1;
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
    if (action.perform) return action;
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
  
  getActionChain: function() {
    var actions = [];
    for (var name in this.options.chain) {
      var value = this.options.chain[name];
      var action = (value.indexOf ? this[value] : value).apply(this, arguments);
      if (action) actions.push(action);
    }
    return actions.sort(function(a, b) {
      return (b.priority || 0) - (a.priority || 0);
    });
  },
  
  callChain: function() {
    var chain = this.getActionChain.apply(this, arguments), action, actions;
    var args = Array.prototype.slice.call(arguments, 0);
    for (var link; link = chain[++this.currentActionIndex];) {
      action = link.perform ? link : link.name ? this.getAction(link.name) : null;
      if (action) {
        var result = this.execute(link, args);
        args = null;
      } else {
        if (link.arguments) args = link.arguments;
        if (link.callback) link.callback.call(this, args)
      }
      if (!action || result === true) continue;
      if (!actions) actions = [];
      actions.push(action.options.name);
      if (result === false) return actions; //action is asynchronous, stop chain
    }
    if (this.currentActionIndex == chain.length) this.currentActionIndex = -1;
    return actions;
  },
  
  clearChain: function() {
    this.currentActionIndex = -1;
  },
  
  execute: function(command, args) {
    if (command.call && (!(command = command.apply(this, args))));
    else if (command.indexOf) command = {name: command}
    if (command.arguments) {
      var cargs = command.arguments.call ? command.arguments.call(this) : command.arguments;
      args = [].concat(cargs || [], args || []);
    }
    var action = command.action = this.getAction(command.name);
    var targets = command.target;
    if (targets && targets.call && (!(targets = targets.call(this)) || (targets.length === 0))) return true;
    var state = command.state;
    var promise, self = this;
    var perform = function(target) {
      var method = (state == null) ? 'perform' : ((state.call ? state(target, targets) : state) ? 'commit' : 'revert');
      var result = action[method](target, target.options && target.options.states && target.options.states[action.name], args);
      if (result && result.callChain) {
        if (!promise) promise = [];
        promise.push(result);
        result.chain(function() {
          promise.erase(result);
          if (promise.length == 0) self.callChain.apply(self, arguments);
        });
      } else if (result !== false) return;
      return false;
    };
    action.document =  LSD.Module.DOM.findDocument(targets ? (targets.map ? targets[0] : targets) : this)
    action.caller = this;
    var ret = (targets) ? (targets.map ? targets.map(perform) : perform(targets)) : perform(this);
    delete action.caller, action.document;
    return (ret ? ret[0] : ret) !== false;
  },
  
  mixin: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    Class.mixin(this, mixin);
    var options = mixin.prototype.options;
    if (!options) return;
    for (var action in options.actions) this.addAction(Object.clone(action));
    if (options.events) this.addEvents(this.bindEvents(options.events));
  },

  unmix: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    var options = Object.clone(mixin.prototype.options);
    if (options) {
      for (var action in options.actions) this.removeAction(action);
      if (options.events) this.removeEvents(this.bindEvents(options.events));
    };
    Class.unmix(this, mixin);
  }
});

LSD.Module.Actions.attach = function(doc) {
  Object.each(LSD.Mixin, function(mixin, name) {
    var selector = mixin.prototype.behaviour;
    if (!selector) return;
    var watcher = function (widget, state) {
      widget[state ? 'mixin' : 'unmix'](mixin)
    };
    selector.split(/\s*,\s*/).each(function(bit) {
      doc.watch(bit, watcher)
    })
  });
};