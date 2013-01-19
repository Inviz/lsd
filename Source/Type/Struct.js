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

LSD.Struct = function(properties, Structs, Sub) {
  if (typeof properties == 'string' || properties && properties.push) 
    Sub = Structs, Structs = properties, properties = null;
/*
  `new LSD.Struct` creates a constructor, that can be used to construct
  instances of that structure, which bears close resemblance to OOP.
*/
  var Struct = function() {
    if (!(this instanceof Struct))
      return new Struct(arguments[0], arguments[1])
    Struct.instances.push(this);
    for (var i = 0, obj = this._unlinked, inherited, group, cloned, value; obj && (inherited = obj[i++]);)
      if ((group = this[inherited])) {
        var cloned = this[inherited] = {};
        for (var property in group) {
          value = group[property];
          cloned[property] = typeof value.push == 'function' ? value.slice() : value
        }
      }
    var preconstructed = this._preconstructed;
    if (preconstructed) for (var i = 0, type, constructors = this._constructors; type = preconstructed[i++];) {
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
    var scripted = this._scripted
    if (scripted) for (var i = 0, property; property = scripted[i++];)
      this._watch(this._properties[property].script, property);
    var subject = this._initialize && this._initialize.apply(this, arguments) || this;
    if (typeof object == 'object') 
      subject._set(undefined, object, undefined, undefined, 'over');
    return subject
  }
  if (!Structs) Structs = [];
  if (!Structs.push) Structs = [Structs];
  var Base = Structs[0];
  var constructor = (typeof Base == 'string' ? LSD[Base] : Base) || LSD.Object;
  if (constructor != LSD.Dictionary)
    Structs.unshift(LSD.Object);
  Struct.prototype = LSD.Struct.implement(LSD.Struct.prototype, {});
  if (!Struct.instances) Struct.instances = [];
  for (var other, i = 0; other = Structs[i]; i++) {
    if (typeof other == 'string') other = LSD[other];
    var proto = other.prototype;;
    for (var name in proto) {
      var value = proto[name];
      if (value != Struct.prototype[name]) {
        var p = name;
        if (p.charAt(0) == '_')
          if (p == '_nonenumerable') {
            Struct.prototype[p] = LSD.Struct.implement(Struct.prototype[p], {});
            LSD.Struct.implement(value, Struct.prototype[p]);
          } else if (typeof value == 'function')
            for (; Struct.prototype[p] !== undefined;)
              p = '_' + p;
        Struct.prototype[p] = value;
      }
    }
  }
  Struct.struct = true;
  Struct.implement = LSD.Struct.implement;
  Struct.prototype.constructor = Struct;
  if (!constructor.prototype.push) Struct.prototype._constructor = constructor;
  if (Sub) Struct.prototype.__constructor = typeof Sub == 'string' ? LSD[Sub] : Sub;
  Struct.prototype._constructors = {};
  var Properties = LSD.Struct.Properties;
  if (Properties) {
    var props = new Properties;
    props._struct = Struct;
  } 
  Struct.prototype._properties = Struct.properties = props || properties || {};
  if (properties) {
    var nonenum = properties._nonenumerable;
    for (var name in properties) {
      if (!properties.hasOwnProperty(name) || (nonenum && nonenum[name]))
        continue;
      var val = properties[name];
      if (val === undefined)
        continue;
      var mutator = LSD.Struct.Mutators[name];
      if (mutator)
        mutator.call(Struct, val);
      else if (props)
        props._set(name, val, undefined, undefined, 'over')
    }
  }
  return Struct;
}; 
LSD.Struct.implement = function(object, host, reverse, plain) {
  if (!host) host = this.prototype;
  for (var prop in object) {
    var value = object[prop];
    if (!plain && typeof value == 'object' && value != null && !value.push && !value.exec && prop !== '_owner') {
      var hosted = host[prop];
      if (hosted) {
        if (!host.hasOwnProperty(prop)) 
          hosted = host[prop] = LSD.Struct.implement({}, hosted);
      } else hosted = host[prop] = {}
      LSD.Struct.implement(value, hosted)
    } else if (!reverse || !host[prop] || prop == 'toString') 
      host[prop] = value;
  }
  return host;
}
LSD.Struct.prototype.implement = LSD.Struct.implement;
LSD.Struct.Mutators = {
  Extends: function(Klass) {
    if (Klass.push) return LSD.Struct.Mutators.Implements.call(this, Klass);
    this.implement(Klass.prototype, null, true);
  },
  Implements: function(Klasses) {
    if (!Klasses.push) return LSD.Struct.Mutators.Extends.call(this, Klasses);
    for (var i = 0, j = Klasses.length; i < j; i++)
      this.implement(Klasses[i].prototype, null, true);
  },
  Formulas: function(Formulas) {
    var prototype = this.prototype;
    var formulas = (prototype.formulas || (prototype.formulas = {}))
    var formulasByProperty = (prototype.formulasByProperty || (prototype.formulasByProperty = {}))
    for (var property in Formulas) {
      var expression = Formulas[property];
      var parsed = LSD.Script.parse(expression);
      if (!parsed.push) parsed = [parsed];
      var fn = LSD.Script.toFunction(parsed);
      var variables = LSD.Script.getVariables(parsed);
      for (var i = 0, variable; variable = variables[i++];) {
        var group = (formulasByProperty[variable] || (formulasByProperty[variable] = []));
        group.push(property);
      }
      formulas[property] = fn;
    }
  }
};
LSD.Struct.prototype._hash = function(key, value, old, meta, extra) {
  if (extra == 'get' || (!key && extra == 'watch')) return;
  var stringy = typeof key == 'string';
  var trigger = this._trigger;
  var vscript = value && value[trigger] && !value._ignore;
  var oscript = old && old[trigger] && !old._ignore;
  if (stringy) {
    if (key.charAt(0) == '^')
      key = '.' + key.substring(1);
    if (!this._composite && !/^[a-z0-9-_.]*$/i.test(key))
      key = (this._parse || LSD.Script)(key);
    else if (!vscript && !oscript)
      return;
  }
  if (key[trigger]) {
    if (value)
      this._hash(value, key, undefined, meta, 'watch')
    if (old)
      this._hash(old, undefined, key, meta, 'watch')
    return true;
  }
  if ((vscript || (value = undefined)) == (oscript || (old = undefined)))
    return;
  var node = this.nodeType && this;
  if (trigger != '_calculated') return;
  var scripts = (this._scripts || (this._scripts = {}));
  if (key === 'merged') {
    if (value) {
      var merged = (scripts.merged || (scripts.merged = []));
      for (var i = 0, j = value.length; i < j; i++)
        merged.push(LSD.Script(value, this, this))
    }
    if (old) {
      for (var i = 0, script = scripts.merged, j = script.length; i < j; i++) {
        for (var k = 0, l = old.length; k < l; k++) {
          if (script[i].args[0] === old[k]) {
            script[i].set('attached', undefined, script[i].attached, meta);
            script[i].set('value', undefined, script[i].value, meta)
            script.splice(i--, 1);
            j--;
          }
        }
      }
    }
  } else {
    var literal = this._literal;
    if (literal && literal[key]) return;
    if (old) {
      old.set('attached', undefined, old.attached, meta);
      old.set('value', undefined, old.value, meta)
      if (node)
        node._unwatch('variables', '_scripts.' + key + '.scope');
      if (!value && scripts)
        delete scripts[key]
    }
    if (value)
      if (node) {
        scripts[key] = LSD.Script(value, null, [this, key]);
        node._watch('variables', '_scripts.' + key + '.scope');
      } else if (value)
        scripts[key] = LSD.Script(value, this, [this, key]);
  }
  return true;
}
LSD.Struct.prototype._cast = function(key, value, old, meta, extra) {
  if (typeof key != 'string') return value;
  var props = this._properties, prop;
  if (props) prop = props[key];
  if (!prop && (props = this.__properties)) 
    prop = props[key]
  var group = this._observed;
  if (group && (group = group[key])) {
    if (value !== undefined) group[2] = value;
    else delete group[2];
  }
  if (prop) {
    var set = prop.set;
    if (set)
      value = callback.set.call(this, value);
    var callback = prop.callback || (prop.call && !prop._set && prop);
    if (callback) {
      if (callback.prototype._set) {
        if (value !== undefined && this[key] === undefined)
          this._construct(key, callback, meta)
      } else
        value = callback.call(this, value, old, meta, extra);
    }
    var alias = prop.alias;
    if (alias && typeof value != 'object') {
      var index = alias.indexOf(' ');
      if (index > -1) {
        var fn = alias.substring(index + 1);
        if (!this[fn]) this[fn] = {
          fn: this['_' + fn],
          bind: this
        };
        this._set(alias.substring(0, index) + '.' + value, this[fn], undefined, meta);
        if (old != null && typeof old != 'object')
          this._set(alias.substring(0, index) + '.' + old, undefined, this[fn], meta);
      } else 
        this._set(alias, value, old, meta);
    };
  } else if (this._aggregate && !this._nonenumerable[key]) {
    var storage = (this._stored || (this._stored = {}))
    var group = (storage[key] || (storage[key] = []));
    if (value !== undefined ) 
      group.push([value, key]);
    if (old !== undefined) 
      for (var i = 0, j = group.length; i < j; i++)
        if (group[i][0] === old) {
          group.splice(i, 1);
          break;
        }
    for (var i = 0, j = this.length; i < j; i++)
      this[i].set(key, value, old, meta);
  }
  var formulasByProperty = this.formulasByProperty;
  if (formulasByProperty) {
    var formulasByProperty = formulasByProperty[key];
    if (formulasByProperty) {
      var formulas = this.formulas;
      var formulated = (this.formulated || (this.formulated = {}))
      for (var prop, i = 0; prop = formulasByProperty[i++];) {
        var formula = formulas[prop];
        if (formula) {
          var val = formula.call(this);
          if (val != val) val = undefined;
          this.set(prop, val, formulated[prop], meta, 'change');
          formulated[prop] = val;
        }
      }
    }
  }
  return value;
};
LSD.Struct.prototype._finalize = function(key, value, old, meta, extra, hash) {
  if (!this._nonenumerable[key] && value != null 
  && value[this._trigger] != null && !value._ignore) {
    var literal = this._literal;
    if (literal && literal[key]) return;
    if (hash === undefined) this[key] = old;
    this._watch(value, key, undefined, meta);
    return true;
  }
}
LSD.Struct.prototype._getConstructor = function(key) {
  var prop = this._properties[key];
  if (prop)
    var constructor = prop.constructor;
  if (!constructor && this._Properties) {
    var Key = key.charAt(0).toUpperCase() + key.substring(1);
    var constructor = this._Properties[Key] || this._Properties[key];
  }
  if (constructor)
    return constructor;
  else if (prop) {
    if (prop.alias)
      return null;
    if (prop.callback)
      return false;
  }
  return this._constructor
};
LSD.Struct.prototype._onBeforeConstruct = function(key) {
  var props = this._properties;
  var property = (props && props[key]) || (props = this.__properties) && props[key];
  if (property) {
    if (property.get)
      return property.get.call(this);
    var alias = property.alias;
    if (alias) {
      var observed = (this._observed || (this._observed = {}));
      if (!observed[key])
        this.watch(alias, (observed[key] = [this, key]), undefined, undefined, false);
      if (this[key] !== undefined) 
        return this[key];
      return this.get(alias, true) || null;
    }
  }
};
LSD.Struct.prototype._unlinked = ['_journal', '_stored'];
LSD.Struct.prototype._watchable = /^[a-zA-Z0-9._-]+?$/;
LSD.Struct.prototype._nonenumerable = {
  initialize: true,
  _initialize: true,
  __initialize: true,
  _constructor: true,
  _constructors: true,
  _Properties: true,
  _properties: true,
  _scripted: true
}
!function(proto) {
  for (var property in proto)
    proto._nonenumerable[property] = true;
}(LSD.Struct.prototype);
LSD.Struct.Property = function(callback, object, extra, arg) {
  var property = this;
  if (!property.call || !property._set) {
    var proto = LSD.Struct.Property.prototype;
    var property = function(value, old, meta, extra) {
      if (value !== undefined && property.set)
        value = property.set.call(this, value);
      if (property.callback)
        value = property.callback.call(this, value, old, meta, extra);
      return value;
    }
    for (var prop in proto)
      property[prop] = proto[prop];
  }
  switch (typeof callback) {
    case 'object':
      property._set(undefined, callback, undefined, undefined, 'over');
      break;
    case 'function':
      var props = callback._properties;
      if (props && !props._set)
        return callback;
      else if (callback === Object || callback.prototype._construct)
        property._set('constructor', callback);
      else
        property._set('callback', callback);
      if (object)
        property._set(undefined, object, undefined, undefined, 'over');
      break;
    case 'string':
      property._set('alias', callback);
  }    
  return property;
};

LSD.Struct.Property.prototype = new (LSD.Struct({
  
  get: function() {
    
  },
  
  set: function() {
    
  },
  
  callback: function() {
    
  },
  
  constructor: function() {
    
  },
  
  enumerable: function(value) {
    if (value)
      delete this._owner._struct.prototype._nonenumerable[this._reference];
    else
      this._owner._struct.prototype._nonenumerable[this._reference] = true;
  },
  
  value: function(value) {
    if (value == undefined)
      delete this._owner._struct.prototype[this._reference];
    else
      this._owner._struct.prototype[this._reference] = value;
  },
  
  writable: function() {
    
  },

  chunked: function() {

  },
  
  import: function() {
    
  },
  
  script: function(value, old) {
    this._register('_scripted', value, old, true);
    var instances = this._owner._struct;
    var reference = this._reference;
    for (var i = 0, instance; instance = instances[i++];) {
      if (value)
        instance._watch(value, reference);
      if (old)
        instance._watch(old, undefined, reference);
    }
  },
  
  formula: function() {
    
  },
  
  preconstruct: function() {
    this._register('_preconstructed', value, old, true)
  },
  
  inherit: function() {
    this._register('_inherited', value, old)
  }
  
  
}, 'Dictionary'));

LSD.Struct.Property.prototype._register = function(key, value, old, array) {
  var struct = this._owner._struct.prototype;
  if (array) {
    var object = (struct[key] || (struct[key] = []));
    if (value)
      object.push(this._reference);
    if (old)
      object.splice(object.indexOf(this._reference), 1);
  } else {
    var object = (struct[key] || (struct[key] = {}));
    if (value !== undefined)
      object[key] = value
    else
      delete object[key];
  }
}

LSD.Struct.Property.prototype.enumerable = true;
LSD.Struct.Property.prototype.writable = true;
LSD.Struct.Property.prototype.constructor = undefined;

LSD.Struct.Properties = new LSD.Struct({

}, 'Dictionary');

LSD.Struct.Properties.prototype._nonenumerable = LSD.Struct.implement(LSD.Struct.Properties.prototype._nonenumerable, {
  _struct: true
});
LSD.Struct.Properties.prototype._cast = function(key, value, old, meta) {
  if (value !== undefined)
    return new LSD.Struct.Property(value)
};
LSD.Struct.Properties.prototype._constructor = LSD.Struct.Property;