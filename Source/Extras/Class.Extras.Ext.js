//basically, it's chained Extends.


(function() {
  var getInstance = function(klass){
  	klass.$prototyping = true;
  	var proto = new klass;
  	delete klass.$prototyping;
  	return proto;
  };
  
  Class.include = function(klass, klasses) {
    return new Class({
      Includes: Array.from(arguments).flatten()
    });
  }
  
  Class.flatten = function(items) {
    return Array.from(items).filter($defined).map(function(item, i) {
      if (item.parent) {
        return [Class.flatten(item.parent), item]
      } else {
        return item
      }
    }).flatten();
  }

  Class.Mutators.Includes = function(items) {
    var instance = this.parent ? this.parent : items.shift();
  	Class.flatten(items).each(function(parent){
      var baked = new Class;
      if (instance) {
        baked.parent = instance;
        baked.prototype = getInstance(instance);
      }
      var proto = $extend({}, parent.prototype)
      delete proto.$caller;
      delete proto.$constructor;
      delete proto.parent;
      delete proto.caller;
      for (var i in proto) {
        var fn = proto[i];
        if (fn && fn.$owner && (fn.$owner != parent) && fn.$owner.parent) delete proto[i]
      }
      baked.implement(proto);
      instance = baked
  	}, this);
  	this.parent = instance
  	this.prototype = getInstance(instance);
  }
})();



$extend(Class.Mutators, {
  events: function(mixin) {
    this.prototype.events = $mixin(this.prototype.events || {}, mixin);
  },
  shortcuts: function(mixin) {
    this.prototype.shortcuts = $mixin(this.prototype.shortcuts || {}, mixin);
  },
  layered: function(mixin) {
    this.prototype.layered = $mixin(this.prototype.layered || {}, mixin)
  }
});

Class.Stateful = function(states) {
  var proto = {};
  
  $extend(proto, {
    options: {
      states: {}
    },
    setStateTo: function(state, to) {
      return this[this.options.states[state][to ? 'enabler' : 'disabler']]()
    }
  });

  Hash.each(states, function(methods, state) {
    var options = Array.link(methods, {enabler: String.type, disabler: String.type, toggler: String.type, reflect: $defined})
    //enable reflection by default
    if (!$defined(options.reflect)) options.reflect = true;
    
    proto.options.states[state] = options;

    proto[options.enabler] = function() {
      if (this[state]) return false;
      this[state] = true; 

    	if (Class.hasParent(this)) this.parent.apply(this, arguments);
      this.fireEvent(options.enabler, arguments);
      if (this.onStateChange && options.reflect) this.onStateChange(state, true, arguments);
      return true;
    }

    proto[options.disabler] = function() {
      if (!this[state]) return false;
      this[state] = false;

  	  if (Class.hasParent(this)) this.parent.apply(this, arguments);

      this.fireEvent(options.disabler, arguments);
      if (this.onStateChange && options.reflect) this.onStateChange(state, false, arguments);
      return true;
    }

    if (options.toggler) proto[options.toggler] = function() {
      return this[this[state] ? options.disabler : options.enabler].apply(this, arguments)
    }
  });
  
  return new Class(proto)
}

Class.Mutators.States = function(states) {
  this.implement('Includes', [Class.Stateful(states)]);
}



Class.hasParent = function(klass) {
  var caller = klass.$caller;
  return !!(caller.$owner.parent && caller.$owner.parent.prototype[caller.$name]);
}
Macro = {};
Macro.onion = function(callback) {
  return function() {
    if (!this.parent.apply(this, arguments)) return;
    callback.apply(this, arguments);
    return true;
  } 
}

Macro.setter = function(name, callback) {
  return function() {
    if (!this[name]) this[name] = callback.apply(this, arguments);
    return this[name];
  } 
}

Macro.defaults = function(callback) {
  return function() {
    if (Class.hasParent(this)) {
      return this.parent.apply(this, arguments);
    } else {
      return callback.apply(this, arguments);
    }
  }
}