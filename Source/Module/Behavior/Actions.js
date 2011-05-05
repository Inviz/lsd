/*
---
 
script: Actions.js
 
description: Assign functions asyncronously to any widget
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module
  - LSD.Action

provides: 
  - LSD.Module.Actions
 
...
*/

LSD.Module.Actions = new Class({
  options: {
    actions: {}
  },
  
  initializers: {
    actions: function() {
      this.actions = {}
    }
  },
  
  addAction: function() {
    this.getAction.apply(this, arguments).attach(this);
  },
  
  removeAction: function() {
    this.getAction.apply(this, arguments).detach(this);
  },
  
  getAction: function(name, action) {
    if (this.actions[name]) return this.actions[name];
    if (!action) {
      action = {name: name};
      var actions = this.options.actions;
      if (actions && actions[name]) Object.append(action, actions[name]);
    }
    return (this.actions[name] = new (LSD.Action[LSD.capitalize(name)] || LSD.Action)(action, name))
  },
  
  execute: function(command, args) {
    if (command.call && (!(command = command.apply(this, args))));
    else if (command.indexOf) command = {action: command}
    if (command.arguments) {
      var cargs = command.arguments.call ? command.arguments.call(this) : command.arguments;
      args = [].concat(cargs || [], args || []);
    }
    var action = this.getAction(command.action);
    var targets = command.target;
    if (targets && targets.call && (!(targets = targets.call(this)) || (targets.length === 0))) return true;
    var state = command.state;
    var promise, self = this;
    var perform = function(target) {
      var method = (state == null) ? 'perform' : ((state.call ? state(target, targets) : state) ? 'commit' : 'revert');
      var result = action[method](target, target.$states && target.$states[action.name], args);
      if (result && result.callChain && (command.promise !== false)) {
        if (!promise) promise = [];
        promise.push(result);
        result.chain(function() {
          promise.erase(result);
          if (promise.length == 0) self.callChain.apply(self, arguments);  
        });
      } else if (result !== false) return;
      return false;
    };
    var probe = targets ? (targets.map ? targets[0] : targets) : this;
    if (probe.nodeType) action.document =  LSD.Module.DOM.findDocument(probe);
    action.caller = this;
    var ret = (targets) ? (targets.map ? targets.map(perform) : perform(targets)) : perform(this);
    delete action.caller, delete action.document;
    return (ret ? ret[0] : ret) !== false;
  },
  
  mixin: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    var options = mixin.prototype.options;
    Class.mixin(this, mixin);
    if (options) {
      Object.merge(this.options, options); //merge!
      this.setOptions(options);
    }
    var initializers = mixin.prototype.initializers;
    if (initializers) for (var name in initializers) initializers[name].call(this);
  },

  unmix: function(mixin) {
    if (typeof mixin == 'string') mixin = LSD.Mixin[LSD.capitalize(mixin)];
    this.unsetOptions(mixin.prototype.options);
    Class.unmix(this, mixin);
  }
});

LSD.Module.Actions.attach = function(doc) {
  LSD.Mixin.each(function(mixin, name) {
    var selector = mixin.prototype.behaviour;
    if (!selector) return;
    var attached = {};
    var watcher = function (widget, state) {
      if (state) {
        if (attached[widget.lsd]) return;
        else attached[widget.lsd] = true;
        widget.mixin(mixin);
      } else if (attached[widget.lsd]) {
        delete attached[widget.lsd];
        widget.unmix(mixin);
      }
    };
    selector.split(/\s*,\s*/).each(function(bit) {
      doc.watch(bit, watcher)
    })
  });
};

LSD.Options.actions = {
  add: 'addAction',
  remove: 'removeAction',
  iterate: true
};