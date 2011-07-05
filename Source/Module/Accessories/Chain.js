/*
---
 
script: Chain.js
 
description: A dynamic state machine with a trigger
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module.Actions

provides: 
  - LSD.Module.Chain
 
...
*/

!function() {

LSD.Module.Chain = new Class({
  constructors: {
    chain: function() {
      this.chains = {};
      this.chainPhase = -1;
      this.chainPhasing = [];
    }
  },
  
  addChain: function(name, chain) {
    if (!chain.name) chains = name;
    this.chains[name] = chain;
  },
  
  removeChain: function(name, chain) {
    if (this.chains[name] == chain) delete this.chains[name];
  },
  
  getActionChain: function() {
    var actions = [];
    for (var name in this.chains) {
      var chain = this.chains[name]
      var action = (chain.indexOf ? this[chain] : chain).apply(this, arguments);
      if (action) actions.push[action.push ? 'apply' : 'call'](actions, action);
    }
    return actions.sort(function(a, b) {
      return (b.priority || 0) - (a.priority || 0);
    });
  },
  
  callChain: function() {
    return this.eachLink('regular', arguments, true)
  },
  
  uncallChain: function() {
    return this.eachLink('regular', arguments, false, true);
  },
  
  eachLink: function(filter, args, ahead, revert, target) {
    if (filter && filter.indexOf) filter = Iterators[filter];
    if (args != null && !args.push) args = LSD.slice(args); 
    
    var chain = this.currentChain || (this.currentChain = this.getActionChain.apply(this, args));
    if (!chain.length) return this.clearChain();
    var index = this.chainPhase;
    if (ahead) index += +ahead;
    if (ahead == 1 && index == chain.length) {
      this.clearChain();
      index = 0;
    }
    var action, phases = revert ? revert.length ? revert : this.chainPhasing : [];
    for (var link; link = chain[index]; index += (revert ? -1 : 1)) {
      action = link.action ? this.getAction(link.action) : null;
      if (filter) {
        var filtered = filter.call(this, link, chain, index);
        if (filtered == null) return phases;
        else if (filtered === false) continue;
      };
      if (action) {
        if (revert) {
          var last = phases.getLast();
          if (last && last.asynchronous && last.index < this.chainPhase) break;
          phases.pop();
          if (!phases.length) revert = true;
        }
        var result = this.execute(link, args, last ? last.state : null, last ? true : revert, index - this.chainPhase);
        if (link.keep === true) args = null;
      } else if (!revert) {
        if (link.arguments != null) args = link.arguments;
        if (link.callback) link.callback.apply(this, args);
      }
      if (!revert) phases.push({index: index, state: result, asynchronous: result == null, action: link.action});
      if (action && result == null) break; //action is asynchronous, stop chain
    }
    if (index >= chain.length) index = chain.length - 1;
    if (index > -1) {
      this.chainPhase = index;
      if (!revert) this.chainPhasing.push.apply(this.chainPhasing, phases);
    } else this.clearChain();
    return phases;
  },
  
  clearChain: function() {
    this.chainPhase = -1;
    this.chainPhasing = [];
    delete this.currentChain;
    return this;
  },
    
  execute: function(command, args, state, revert, ahead) {
    if (command.call && (!(command = command.apply(this, args))));
    else if (command.indexOf) command = {action: command}
    var action = this.getAction(command.action);
    var targets = command.target;
    if (targets && targets.call && (!(targets = targets.call(this)) || (targets.length === 0))) return true;
    if (command.arguments != null) {
      var cargs = command.arguments && command.arguments.call ? command.arguments.call(this) : command.arguments;
      args = [].concat(cargs == null ? [] : cargs, args || []);
    }
    if (state == null && command.state != null) state = command.state;
    var promised = [], succeed = [], failed = [], self = this;
    var perform = function(target) {
      var value = self.getActionState(action, [target].concat(args), state, revert);
      var method = value ? 'commit' : 'revert';
      var result = action[method](target, args);
      if (result && result.callChain && (command.promise !== false)) {
        if (value) var phases = self.eachLink('success', arguments, ahead + 1);
        promised.push(result);
        // waits for completion
        var callback = function(args, state) {
          (state ? succeed : failed).push([target, args]);
          result.removeEvents(events);
          // Try to fork off execution if action lets so 
          if (state && (self != target) && command.fork) {
            if (target.chainPhase == -1) target.callChain.apply(target, args);
            else target.eachLink('optional', args, true);
          };
          if (failed.length + succeed.length != promised.length) return;
          if (failed.length) self.eachLink('alternative', args, true, false, succeed);
          if (self.currentChain && self.chainPhase < self.currentChain.length - 1)
            if (succeed.length) self.eachLink('regular', args, true, false, succeed);
        }
        var events = {
          complete: function() {
            callback(arguments, true);
          },
          cancel: function() {
            self.eachLink('success', arguments, ahead + phases.length - 1, phases || true);
            self.eachLink('failure', arguments, ahead + 1);
            callback(arguments, false);
          }
        }
        // If it may fail, we should not simply wait for completion
        if (result.onFailure) {
          events.failure = events.cancel;
          events.success = events.complete;
          delete events.complete;
        }
        result.addEvents(events);
        return;
      } else if (result === false) return;
      return value;
    };
    action.invoker = this;
    var ret = (targets) ? (targets.map ? targets.map(perform) : perform(targets)) : perform(this);
    delete action.invoker;
    return (ret && ret.push) ? ret[0] : ret;
  }
});

var Iterators = LSD.Module.Chain.Iterators = {
  regular: function(link) {
    if (!link.action) return true;
    switch (link.keyword) {
      case 'or': case 'and': return false;
      default: return true;
    }
  },
  
  optional: function(link) {
    return link.priority == null || link.priority < 0;
  },
  
  success: function(link, chain, index) {
    if (!link.action) return false;
    if (index < chain.length - 1 && link.keyword == 'and') return true;
  },
  
  failure: function(link, chain, index) {
    if (!link.action) return false;
    switch (link.keyword) {
      case 'or': return true;
      case 'and':
        for (var i = index, other; other = chain[--i];) 
          switch (other.keyword) {
            case "or": return true;
            case "and": continue;
            default: break;
          }
        for (var i = index, other; other = chain[++i];) 
          switch (other.keyword) {
            case "or": return false;
            case "and": continue;
            default: break;
          }
    }
  },
  
  alternative: function(link, chain, index) {
    if (!link.action) return false;
    switch (link.keyword) {
      case 'else': return true;
      case 'and': case 'or': case 'then':
        for (var i = index, other; other = chain[++i];)
          switch (other.keyword) {
            case 'else': return true;
            case 'and': case 'or': continue;
            default: return;
          }
    }
  }
}

LSD.Options.chain = {
  add: 'addChain',
  remove: 'removeChain',
  iterate: true
}

}();