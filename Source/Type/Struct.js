/*
---

script: Struct.js

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
  Struct is a class builder and a combinator of objects. It generates a
  constructor with an observable object prototype. The function recieves
  additional arguments that specify the base type of object, it builds classes
  based on LSD.Object by default. A struct class may define its own set of
  observable property setters, callbacks or data transformers.
*/

LSD.Struct = function(properties, Base, Sub) {
  if (typeof properties == 'string') Sub = Base, Base = properties, properties = null;
/*
  `new LSD.Struct` creates a constructor, that can be used to construct
  instances of that structure, which bears close resemblance to OOP.
*/
  var Struct = function() {
    if (this.Variable || !this._construct) return new Struct(arguments[0], arguments[1])
/*
  Inherited properties is an internal concept that allows an instance of a
  class to recieve its own copy of a private object from prototype without
  recursive cloning.
*/
    for (var i = 0, obj = this._unlinked, inherited, group, cloned, value; obj && (inherited = obj[i++]);)
      if ((group = this[inherited])) {
        var cloned = this[inherited] = {};
        for (var property in group) {
          value = group[property];
          cloned[property] = typeof value.push == 'function' ? value.slice() : value
        }
      }
/*
  A Struct may have a _preconstruct array defined in a prototype that lists
  all nested property names that should be initialized right away.
*/
    var preconstruct = this._preconstruct;
    if (preconstruct) for (var i = 0, type, constructors = this._constructors; type = preconstruct[i++];) {
      var constructor = constructors[type] || (constructors[type] = this._getConstructor(type));
      var obj = this[type] = new constructor;
      obj._owner = this;
      var properties = obj._properties;
      if (properties && typeof properties._owner == 'function')
        properties._owner.call(obj, this)
    }
    var object = arguments[0];
    if (this.__initialize)
      object = this.__initialize.apply(this, arguments);
    if (this.initialize)
      object = this.initialize.apply(this, arguments);
    if (this._imports)
      this._link(this._imports, true);
    if (this._exports)
      this._link(this._exports, true, true);
    var subject = this._initialize && this._initialize.apply(this, arguments) || this;
    if (typeof object == 'object')
      subject.mix(object);
    return subject
  }
  if (Base && Base.push) {
    var Chain = Array.prototype.slice.call(Base, 1);
    Base = Base[0];
  }
  var constructor = (typeof Base == 'string' ? LSD[Base] : Base) || LSD.Object;
  Struct.prototype = new constructor;
  if (Chain) for (var other, i = 0; other = Chain[i]; i++) {
    if (typeof other == 'string') other = LSD[other];
    if (i) var F = function() {};
    Struct.prototype = i ? (F.prototype = new F) : Struct.prototype;
    var proto = other.prototype, def = LSD.Object.prototype;;
    for (var name in proto) {
      var value = proto[name];
      if (value != def[name])
        Struct.prototype[name] = proto[name];
    }
  }
  Struct.struct = true;
  Struct.implement = LSD.Struct.implement;
  Struct.implement(LSD.Struct.prototype);
  Struct.prototype.constructor = Struct;
  if (!constructor.prototype.push) Struct.prototype._constructor = constructor;
  if (Sub) Struct.prototype.__constructor = typeof Sub == 'string' ? LSD[Sub] : Sub;
  Struct.prototype._constructors = {};
  if (properties) {
    Struct.prototype._properties = properties;
    for (var name in properties) {
      var mutator = LSD.Struct.Mutators[name];
      if (typeof properties[name] != 'undefined' && mutator) {
        if (typeof mutator == 'function') {
          LSD.Struct.Mutators[name].call(Struct, properties[name]);
        } else Struct.prototype[mutator === true ? 'set' : mutator]('_' + name, properties[name]);
      }
    }
  }
  return Struct;
};
LSD.Struct.implement = function(object, host, reverse) {
  if (!host) host = this.prototype;
  for (var prop in object) {
    var value = object[prop];
    if (typeof value == 'object' && value != null && !value.push && !value.exec) {
      var hosted = host[prop];
      if (hosted) {
        if (!host.hasOwnProperty(prop)) 
          hosted = host[prop] = LSD.Struct.implement({}, hosted);
      } else hosted = host[prop] = {}
      LSD.Struct.implement(value, hosted)
    } else if (!reverse || !host[prop] || prop == 'toString') host[prop] = value;
  }
  return host;
}
LSD.Struct.prototype.implement = LSD.Struct.implement;
/*
  Every property defined in a class properties object will be treated like a
  property, unless it is defined in the Mutators object. Mutators are a hooks
  that allow some DSL functions to be added to handle some sugary class
  definitions.
*/
LSD.Struct.Mutators = {
/*
  Structs are slightly compatible with mootools classes, and can use Extends 
  property to inherit the prototype from given object.
*/
  Extends: function(Klass) {
    if (Klass.push) return LSD.Struct.Mutators.Implements.call(this, Klass);
    this.implement(Klass.prototype, null, true);
  },
/*
  Implements directive mixes in multiple object prototypes in order.
*/
  Implements: function(Klasses) {
    if (!Klasses.push) return LSD.Struct.Mutators.Extends.call(this, Klasses);
    for (var i = 0, j = Klasses.length; i < j; i++)
      this.implement(Klasses[i].prototype, null, true);
  },
/*
  LSD does not use options convention, but mootools legacy classes use them
  extensively. Objects given in a Struct definitions will be merged into the
  prototype.
*/
  options: function(options) {
    this.implement({options: options})
  },
/*
  Structs allow some mootools-style class events to be defined in a class 
  definition.
*/
  events: 'mix',
/*
  Structs support property skip list to be extended in a class definition. 
  A property found in that list will not be iterated over in any of the loops.
*/
  skip: function(methods) {
    LSD.Struct.merge({_skip: methods})
  },
  constructor: function(constructor) {
    this._constructor = constructor === true ? this : constructor;
  },
/*
  Mutators that have value equal to `true`, will copy a given value into
  prototype with a prefixed name. E.g. `imports` object will be saved as
  `prototype._imports`, so struct instance will have a quick prototype access
  to them

   A struct can have up to two constructors, private and public, called in that
  order. Most of the predefined LSD structs only use a private constructor
  leaving a public one for third party subclassing.
*/
  _initialize: true,
  initialize: true,
  construct: true,
  imports: true,
  exports: true,
  shared: true,
  get: true
};
/*
  The biggest thing about a Struct instance is how it handles property changes.
  A single struct instance can have one or two property dictionaries, where 
  properties are being looked up.
*/
LSD.Struct.prototype._onChange = function(key, value, meta, old) {
  if (typeof key != 'string') return value;
  var props = this._properties, prop;
  if (props) prop = props[key];
  if (!prop && (props = this.__properties) && !(prop = props[key])) return value;
  var group = this._observed, vdef = typeof value != 'undefined';
  if (group && (group = group[key])) {
    if (vdef) group[2] = value;
    else delete group[2];
  }
/*
  The found property definition may be of different kind:
*/
  switch (typeof prop) {
/*
  - A function, that will be called whenever property is set, changed, or 
  unset. If it returns value, that value is passed to all following callbacks
  and assigned to object instead of the original value.
*/
    case 'function':
      if (prop.prototype._set) {
        if (vdef && typeof this[key] == 'undefined')
          this._construct(key, prop, meta)
      } else return prop.call(this, value, old, meta);
      break;
/*
  - A string, the link to another property in current or a linked object.
    Works as a one-way setter/getter alias. It means that the if a linked
    property is changed by another callback, the original proeprty will
    not be updated, unless the linked property is linked back to the original
    property explicitly.
*/
    case 'string':
      if (typeof value != 'object') {
        var index = prop.indexOf(' ');
        if (index > -1) {
          var fn = prop.substring(index + 1);
          if (!this[fn]) this[fn] = {
            fn: this['_' + fn],
            bind: this
          };
          this.mix(prop.substring(0, index) + '.' + value, this[fn], meta);
          if (old != null && typeof old != 'object')
            this.mix(prop.substring(0, index) + '.' + old, undefined, meta, this[fn]);
        } else this.mix(prop, value, meta, old);
      }
      break;
    case 'undefined':  
      if (this._aggregate && !this._skip[key]) {
        var odef = typeof old != 'undefined'
        var storage = (this._stored || (this._stored = {})), group = storage[key];
        if (!group) group = storage[key] = [];
        if (vdef) group.push([value, key]);
        if (odef) for (var i = 0, j = group.length; i < j; i++)
          if (group[i][1] === old) {
            group.splice(i, 1);
            break;
          }
        for (var i = 0, j = this.length; i < j; i++)
          this[i].set(key, value, meta, old);
      }
  };
  return value;
};
/*
  - An LSD.Object constructor, used to instantiate nested objects with specific
  class
*/
LSD.Struct.prototype._getConstructor = function(key) {
  if (this._properties) {
    var Key = key.charAt(0).toUpperCase() + key.substring(1);
    var prop = this._properties[Key] || this._properties[key];
  }
  if (prop == null && this.__properties) prop = this.__properties[key];
  if (prop) {
    if (prop === Object) return prop;
    var type = typeof prop;
    if (type == 'function' && prop.prototype._construct) return prop;
    else return (type == 'string') ? null : false;
  }
  return this._constructor
};
LSD.Struct.prototype.onBeforeConstruct = function(key) {
  var props = this._properties;
  var property = (props && props[key]) || (props = this.__properties) && props[key];
  if (typeof property == 'string') {
    if (!(this._observed || (this._observed = {}))[key])
      this.watch(property, (this._observed[key] = [this, key]), false);
    return typeof this[key] == 'undefined' ? this.get(property, true) || null: this[key]
  }
};
/*
  There's a way to define dynamic properties and two-way references by using
  `exports` & `imports` object directives. Properties defined in those objects
  will be defined when object is instantiated, unlike property dictionaries
  that are lazy in the way that when object is created, it does not iterate the
  dictionary and only looks it up when actual properties change.

    var Struct = new LSD.Struct({
      imports: {
        'total': 'sum * rate * (1 - tax)'
      }
    });
    Struct.prototype.rate = 1;
    Struct.prototype.tax = 0.2
    var struct = new Struct;
    expect(struct.total).toBeUndefined();
    struct.set('sum', 200);
    expect(struct.total).toBe(200 * 0.85);
    struct.set('sum', 85);
    expect(struct.total).toBe(85 * 0.85);
    struct.set('tax', 0.2);
    expect(struct.total).toBe(85 * 0.8);

  LSD.Script is compiled when struct is instantiated. It starts observing
  variables in expression from left to right. In example above it starts 
  by observing `sum`, and only when it gets it, it starts observing `rate`
  and after that `tax` variables. When all variables are found, the result 
  is calculated and assigned to a property named `total`. 
*/
LSD.Struct.prototype._link = function(properties, state, external) {
  for (var name in properties) {
    var alias = properties[name]
    if (alias.match(this._simple_property)) {
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
    } else {
      this[state === false ? '_unscript' : '_script'](name, alias)
    }
  }
};
LSD.Struct.prototype._linker = function(call, key, value, old, meta) {
  this.mix(call.key, value, meta, old);
};
LSD.Struct.prototype._unlinked = ['_journal', '_stored'];
LSD.Struct.prototype._skip = {
  initialize: true,
  _initialize: true,
  __initialize: true,
  _properties: true,
  _linker: true,
  _exports: true,
  _imports: true
}
LSD.Struct.prototype._simple_property = /^[a-zA-Z._-]+?$/;