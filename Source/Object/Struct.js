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
  Struct is an object with a number of setter methods that
  observe changes to values to transform and use in callbacks.
*/

LSD.Struct = function(properties, Base) {
/*
  `new LSD.Struct` creates a constructor, that can be used to
  construct instances of that structure, which bears close 
  resemblance to OOP.
*/
  var Struct = function(object) {
    if (this.Variable) return new Struct(object, arguments[1])
/*
  Inherited properties is an internal concept that allows an instance of a class to 
  recieve its own copy of a private object from prototype without recursive cloning. 
*/
    for (var i = 0, obj = this._inherited, inherited, group, cloned, value; obj && (inherited = obj[i++]);)
      if ((group = this[inherited])) {
        var cloned = this[inherited] = {};
        for (var property in group) {
          value = group[property];
          cloned[property] = typeof value.push == 'function' ? value.slice() : value
        }
      }
/*
  A Struct may have a _preconstruct array defined in a prototype that lists all nested 
  property names that should be initialized right away.
*/
    var preconstruct = this._preconstruct;
    if (preconstruct) for (var i = 0, type, constructors = this._constructors; type = preconstruct[i++];) {
      var constructor = constructors[type] || this._getConstructor(type);
      var obj = this[type] = new constructor;
      if (obj._register) obj._set('_parent', this);
      else obj._parent = this;
    }
    if (this.__initialize) object = this.__initialize.apply(this, arguments);
    if (object != null) this.mix(object);
    if (this.initialize) object = this.initialize.apply(this, arguments);
    if (this._imports) this._link(this._imports, true);
    if (this._exports) this._link(this._exports, true, true);
    if (this._initialize) return this._initialize.apply(this, arguments);
  }
  var constructor = Base || LSD.Object;
  Struct.struct = true;
  Struct.prototype = new constructor;
  Struct.prototype.constructor = constructor;
  Struct.prototype.__constructor = Struct;
  Struct.prototype._constructors = {};
  for (var property in LSD.Struct.prototype) 
    Struct.prototype[property] = LSD.Struct.prototype[property];
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
/*
  Every property defined in a class properties object will be treated like a property,
  unless it is defined in the Mutators object. Mutators are a hooks that allow some 
  DSL functions to be added to handle some sugary class definitions.
*/
LSD.Struct.Mutators = {
/*
  Structs are slightly compatible with mootools 
  classes, and can use Extends property to inherit the prototype 
  from given object.
*/
  Extends: function(Klass) {
    Object.merge(this.prototype, Klass.prototype);
  },
/*
  LSD does not use options itself, but mootools legacy classes use them extensively.
  Objects given in a Struct definitions will be merged into the prototype.
*/
  options: function(options) {
    Object.merge(this.prototype, {options: options})
  },
/*
  Structs allow some mootools-style class events to be defined in a class definition.
*/
  events: 'mix',
/*
  Structs support property skip list to be extended in a class definition. A property
  found in that list will not be iterated over in any of the loops.
*/
  skip: function(methods) {
    this.prototype._skip = Object.append(methods, LSD.Object.prototype._skip)
  },
/*
  Mutators that have value equal to `true`, will copy a given value into prototype
  with a prefixed name. E.g. `imports` object will be saved as `prototype._imports`, 
  so struct instance will have a quick prototype access to them

  A struct can have up to two constructors, private and public, called in that order.
  Most of the predefined LSD structs only use a private constructor leaving a public
  one for third party subclassing.
*/  
  _initialize: true,
  initialize: true,
  imports: true,
  exports: true
};
/*
  The biggest thing about a Struct instance is how it handles
  changes. A single struct instance can have up to two property
  object dictionaries, where properties are being looked up. 
    - An LSD.Object constructor, useful to instantiate nested
      objects with specific class

*/
LSD.Struct.prototype = {
  _onChange: function(key, value, state, old, memo) {
    if (typeof key != 'string') return value;
    var props = this._properties, prop;
    if (props) prop = props[key];
    if (!prop && (props = this.__properties) && !(prop = props[key])) return value;
    var group = this._observed;
    if (group && (group = group[key])) {
      if (state) group[2] = value;
      else delete group[2];
    }
/*
  The found property definition may be of different kind:
*/
    switch (typeof prop) {
/*
  - A function, that will be called whenever property is set,
    changed, or unset.
*/
      case 'function':
        if (prop.prototype._set) {
          if (state && typeof this[key] == 'undefined') this._construct(key, prop, memo)
        } else {
          if (state) return prop.call(this, value, old, memo);
          else return prop.call(this, undefined, value, memo);
        }
        break;
/*        
  - A string, the link to another property in current or 
    a linked object. Works as a one-way setter/getter alias.
    One-way means that the linked property will not update
    the aliased property, unless the property is defined
    circular (there's another alias that links the linked
    property back to original alias). 
*/
      case 'string':
        if (typeof value != 'object') {
          if (state) this.set(prop, value, memo);
          else this.unset(prop, value, memo);
        }
    };
    return value;
  },
/*
  - An LSD.Object constructor, used to instantiate nested
    objects with specific class
*/
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
      if (proto && proto.constructor) var constructor = prop;
    }
    return (this._constructors[key] = (constructor || this._constructor || this.constructor));
  },
  _construct: function(key, property, memo) {
    if (!property) {
      var props = this._properties;
      if (props) property = props[key];
      if (!property && (props = this.__properties)) property = props[key];
    }
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
/*
  There's a way to define dynamic properties and two-way links
  by using `exports` & `imports` object directives. Properties
  defined in those object, will be defined when object is 
  instantiated, unlike property dictionaries that are lazy in the way
  that when object is created, it does not iterate the dictionary and
  only looks it up when actual properties change. 
*/
  _link: function(properties, state, external) {
    for (var name in properties) {
      var alias = properties[name];
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
  },
/*
  Dynamic properties are the ones that are calculated based on other properties
  
  var Struct = new LSD.Struct({
    imports: {
      'total': 'sum * rate * (1 - tax)'
    }
  });
  Struct.prototype.rate = 1;
  Struct.prototype.tax = 0.15;
  var struct = new Struct;
  expect(struct.total).toBeUndefined();
  struct.set('sum', 200);
  expect(struct.total).toBeUndefined();
  struct.set('sum', 85);
  
  LSD.Script is compiled when struct is instantiated and starts observing variables 
  from left to right. It starts by expecting `sum`, and only when it gets it, it starts
  paying attention to `rate`, then `tax`. When all variables are found, the result is
  calculated and assigned to `total` property.
*/
  _script: function(key, expression) {
    (this._scripted || (this._scripted = {}))[key] = LSD.Script(expression, this, key);
  },
  _unscript: function(key, value) {
    this._scripted[key].onValueSet(undefined, null, this._scripted[key].value)
    this._scripted[key].detach();
    delete this._scripted[key]
  },
  _linker: function(call, key, value, old, memo) {
    if (typeof value != 'undefined') 
      this.mix(call.key, value, memo, true);
    if (old != null && (this._stack || typeof value == 'undefined'))
      this.mix(call.key, old, memo, false);
  },
  _inherited: ['_stack', '_stored'],
  _skip: Object.append({
    initialize: true,
    _initialize: true,
    _properties: true,
    _linker: true,
    _exports: true,
    _imports: true,
    _constructors: true,
    __initialize: true,
    __constructor: true
  }, LSD.Object.prototype._skip),
  _simple_property: /^[a-zA-Z._-]+?$/
};