/*
---
 
script: Actions.js
 
description: Assign functions asyncronously to any widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
 
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
  
  getActionChain: function() {
    var actions = [];
    for (var name in this.options.chain) {
      var action = this.options.chain[name].call(this);
      if (action) actions.push(action);
    }
    return actions.sort(function(a, b) {
      return (b.push ? (b[2] || 0) : 10) - (a.push ? (a[2] || 0) : 10);
    });
  },
  
  getNextAction: function() {
    var actions = this.getActionChain();
    var index = this.currentActionIndex == null ? 0 : this.currentActionIndex + 1;
    var action = actions[index];
    this.currentActionIndex = action ? index : -1;
    return action;
  },
  
  kick: function() {
    var action = this.getNextAction.apply(this, arguments);
    if (action) return this.execute(action, Array.prototype.splice.call(arguments, 0));
  },
  
  unkick: function() {
    delete this.currentActionIndex;
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
  
  execute: function(action, args) {
    if (action.push) var targets = action[1], action = action[0];
    if (typeof action == 'string') action = this.getAction(action);
    else if (action.call && (!(action = action.call(this, args)))) return;
    if (targets && targets.call && (!(targets = targets.call(this)) || (targets.length === 0))) return;
    var perform = function(target) {
      if (target.indexOf) target = new String(target);
      else if (target.localName) target = Element.retrieve(target, 'widget') || target;
      action.perform(target, target.options && target.options.states && target.options.states[action.name], args);
      delete action.document
    };
    action.document =  LSD.Module.DOM.findDocument(targets ? (targets.map ? targets[0] : targets) : this)
    action.caller = this;
    var result = targets ? (targets.map ? targets.map(perform) : perform(targets)) : perform(this);  
    delete action.caller, action.document;
    if (!action.options.asynchronous) this.kick.apply(this, args);
    return result;
  }
});

LSD.Module.Actions.attach = function(doc) {
  Object.each(LSD.Mixin, function(mixin, name) {
    var selector = mixin.prototype.behaviour;
    if (!selector) return;
    var watcher = function (widget, state) {
      //console.log(selector, widget.tagName)
      widget[state ? 'mixin' : 'unmix'](mixin)
    };
    selector.split(/\s*,\s*/).each(function(bit) {
      doc.watch(bit, watcher)
    })
  });
};