ART.Widget.Module.Cache = new Class({
  cache: { //flushed on:
    parent: {}, //adoption
    state: {}, //state change
    environment: {} //both
  },
  
  getCached: function(type, key, callback, args) {
    var env = this.cache[type];
    if (!env[key]) env[key] = callback.apply(this, args || []);
    return env[key];
  },

  addClass: function() {
    this.cache.state = {};
    this.cache.environment = {};
    return this.parent.apply(this, arguments);
  },

  removeClass: function() {
    this.cache.state = {};
    this.cache.environment = {};
    return this.parent.apply(this, arguments);
  },

  addPseudo: function() {
    this.cache.state = {};
    this.cache.environment = {};
    return this.parent.apply(this, arguments);
  },

  removePseudo: function() {
    this.cache.state = {};
    this.cache.environment = {};
    return this.parent.apply(this, arguments);
  },
  
  setParent: Macro.onion(function() {
    this.cache.parent = {};
    this.cache.environment = {};
  })  
});
  