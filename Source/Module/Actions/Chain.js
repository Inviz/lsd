LSD.Module.Chain = new Class({
  options: {
    chain: {}
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
    return this.eachChainAction(function(action, i) {
      return true;
    }, Array.prototype.slice.call(arguments, 0), this.chainPhase).actions
  },
  
  callOptionalChain: function() {
    return this.eachChainAction(function(action, i, priority) {
      if (priority > 0) return false;
    }, Array.prototype.slice.call(arguments, 0)).actions
  },
  
  eachChainAction: function(callback, args, index) {
    if (index == null) index = -1;
    var chain = this.getActionChain.apply(this, arguments), action, actions;
    for (var link; link = chain[++index];) {
      action = link.perform ? link : link.name ? this.getAction(link.name) : null;
      if (action) {
        if (callback.call(this, action, index, link.priority || 0) === false) continue;
        var result = this.execute(link, args);
        args = null;
      } else {
        if (link.arguments) args = link.arguments;
        if (link.callback) link.callback.apply(this, args);
      }
      if (!action || result === true) continue;
      if (!actions) actions = [];
      actions.push(action.options.name);
      if (result === false) break;//action is asynchronous, stop chain
    }  
    this.chainPhase = index;
    if (this.chainPhase == chain.length) this.chainPhase = -1;
    return {chain: chain, executed: actions};
  },
  
  clearChain: function() {
    this.chainPhase = -1;
  }
})