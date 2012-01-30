/*
---

script: Object.Struct.js

description: An observable object with setters

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Object

provides:
  - LSD.Struct

...
*/

/*
  Struct is an object with a number of setter methods that
  observe changes to values to transform and use in callbacks
*/

LSD.Struct = function(properties, Base) {
  var Struct = function(object) {
    for (var i = 0, obj = this._inherited, inherited, group, cloned, value; obj && (inherited = obj[i++]);)
      if ((group = this[inherited])) {
        var cloned = this[inherited] = {};
        for (var property in group) {
          value = group[property];
          cloned[property] = typeof value.push == 'function' ? value.slice() : value
        }
      }
    var preconstruct = this._preconstruct;
    if (preconstruct) for (var i = 0, type, constructors = this._constructors; type = preconstruct[i++];) {
      var constructor = (constructors || (constructors = this._constructors = {}))[type] || this._getConstructor(type);
      this[type] = new constructor;
      this[type].set('_parent', this);
    }
    if (this.__initialize) object = this.__initialize.apply(this, arguments);
    if (object != null) this.mix(object)
    if (this._imports) this._link(this._imports, true);
    if (this._exports) this._link(this._exports, true, true);
    if (this._initialize) this._initialize.apply(this, arguments);
  }
  var constructor = Base || LSD.Object;
  Struct.prototype = new constructor;
  Struct.prototype._constructor = constructor;
  Struct.prototype.__constructor = Struct;
  for (var property in LSD.Struct.prototype) 
    Struct.prototype[property] = LSD.Struct.prototype[property];
  if (properties) {
    Struct.prototype._properties = properties;
    for (var name in properties) {
      var mutator = LSD.Struct.Mutators[name];
      if (typeof properties[name] == 'object' && mutator) {
        if (typeof mutator == 'function') LSD.Struct.Mutators[name].call(Struct, properties[name]);
        else Struct.prototype[mutator === true ? 'set' : mutator]('_' + name, properties[name]);
      }
    }
  }
  return Struct;
};

LSD.Struct.Mutators = {
  Extends: function(Klass) {
    Object.merge(this.prototype, Klass.prototype);
  },
  options: function(options) {
    Object.merge(this.prototype, {options: options})
  },
  skip: function(methods) {
    this.prototype._skip = Object.append(methods, LSD.Object.prototype._skip)
  },
  events: 'mix',
  _initialize: true,
  initialize: true,
  imports: true,
  exports: true
};

LSD.Struct.prototype = {
  _onChange: function(key, value, state, old, memo) {
    if (typeof key == 'string') {
      switch (key) {
        case 'initialized':
          
        default:
          if (this._properties) {
            var prop = this._properties[key];
            if (prop == null) {
              var Key = key.charAt(0) + key.substring(1);
              var prop = this._properties[Key]; 
            }
          }
          if (prop == null && this.__properties) prop = this.__properties[key];
          if (prop) {
            var group = this._observed && this._observed[key]
            if (group) {
              if (state) group[2] = value;
              else delete group[2];
            }
            switch (typeof prop) {
              case 'function':
                var constructor = prop.prototype && prop.prototype._constructor;
                if (constructor) {
                  if (state && typeof this[key] == 'undefined') this._construct(key, prop, memo)
                } else {
                  if (state) return prop.call(this, value, old, memo);
                  else return prop.call(this, undefined, value, memo);
                }
                break;
              case 'string':
            };
          }
      }
    }
    return value;
  },
  _construct: function(key, property, memo) {
    var property = (this._properties && this._properties[key]) || (this.__properties && this.__properties[key]);
    if (typeof property == 'string') {
      if (!this._observed) this._observed = {};
      if (!this._observed[key]) {
        this._observed[key] = [this, key];
        this.watch(property, this._observed[key], false)
      }
      var value = this[key];
      if (typeof value == 'undefined') this.set('key', this.get(property, true));
      return this[key];
    }
    if (this._delegate && !memo) memo = this;
    return LSD.Object.prototype._construct.call(this, key, property, memo);
  },
  _getConstructor: function(key) {
    if (this._properties) {
      var prop = this._properties[key];
      if (prop == null) {
        var Key = key.charAt(0).toUpperCase() + key.substring(1);
        var prop = this._properties[Key]; 
      }
    }
    if (prop == null && this.__properties) prop = this.__properties[key];
    if (prop) {
      var proto = prop.prototype;
      if (proto && proto._constructor) var constructor = prop;
    }
    return (this._constructors[key] = (constructor || this._constructor));
  },
  _link: function(properties, state, external) {
    for (var name in properties) {
      if (state === false) {
        this._unwatch(properties[name], this);
      } else {
        this._watch(properties[name], {
          fn: this._linker,
          bind: this,
          callback: this,
          key: external ? '.' + name : name
        });
      }
    }
  },
  _linker: function(call, key, value, old, memo) {
    if (typeof value != 'undefined') 
      this.mix(call.key, value, memo, true);
    if (old != null)
      this.mix(call.key, old, memo, false);
  },
  _inherited: ['_stack', '_stored'],
  _skip: Object.append({
    _initialize: true,
    _properties: true,
    _linker: true,
    _exports: true,
    _imports: true,
    __initialize: true,
    __constructor: true
  }, LSD.Object.prototype._skip)
};