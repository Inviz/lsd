/*
---

script: Resource.js

description: An dynamic collection or link with specific configuration

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Struct
  - LSD.Group
  - LSD.Array
  - LSD.Document
  - LSD.Element
  - LSD.Request
  - String.Inflections/String.prototype.singularize

provides:
  - LSD.Resource

...
*/

/*
  Resources are beautiful abstractions over access to data storages. It
  leaves all work of building and matching urls to convenient defaults of
  RESTful resource structure. LSD resources are self-sufficent and can do all
  of the typical resource operations in memory. Having resources on client
  side comes in handy when the back end application also supports resources.
  But even if it doesn't, resources can be defined with each action mapped to
  a custom url.
*/

LSD.Resource = LSD.Struct({
/*
  Resource implements URL properties like `domain`, `directory`, `schema`
  and others. There's also a composite property named `url` and an
  overloaded `toString` method
*/
  Implements: LSD.URL,
/*
  urls property is a simple map that contains action URL customizations
*/
  urls: Object,
  
  attributes: Object,
/*
  Name of a resource in plural form
*/
  plural: function(value, old, meta) {
    if (value) value = value.toLowerCase();
    if (meta !== 'singular')
      this.set('singular', value && value.singularize(), old && old.singularize(), 'plural');
    this.change('exportKey', this.singular + '_id')
    this.change('directory', this.prefix ? value ? this.prefix + '/' + value : this.prefix : value || '');
    if (this.collection)
      this.set('through', this.getThroughName(value, this.collection), this.getThroughName(old, this.collection), meta, true)
    return value;
  },
/*
  Name of a resource in singular form
*/
  singular: function(value, old, meta) {
    var associated = this._associated;
    if (associated) 
      for (var association, i = 0; association = associated[i++];)
        association.set('as', value, old, meta, true);
    if (meta !== 'plural')
      this.set('plural', value && value.pluralize(), old && old.pluralize(), 'plural')
  },
/*
  Directory location of a resource
*/
  prefix: function(value, old) {
    this.change('directory', this.plural ? value ? value + '/' + this.plural : this.plural  : value || '');
  },
/*
  Name of the attribute that is used as an indetifier
*/
  key: function(value, old) {
    
  },
/*
  A key that is used to refer the instantiated resource in associations
*/
  exportKey: function(value, old, meta) {
    var associated = this._associated;
    if (associated) 
      for (var association, i = 0; association = associated[i++];)
        association.set('foreignKey', value, old, meta, true);
  },
/*
  Parent resource
*/
  parent: function(value, old) {
    this.set('root', value && value.root || value, old && old.root || old);
  },
/*
  Topmost parent resource
*/
  root: function(value, old) {
    for (var key in this._associations)
      this._associations[key].set('root', value || this, old || this);
    var through = this.through;
    if (through)
      this.set('intermediate', this.getIntermediate(value, through), this.getIntermediate(old, through));
  },
/*
  Name of a collection that will contain associated models. 
  Setting this property makes association many-to-many.
*/
  collection: function(value, old, meta) {
    var plural = this.plural;
    if (plural)
      this.set('through', this.getThroughName(value, plural), this.getThroughName(old, plural), meta, true)
  },
/*
  Name of a resource that links models in a M:M association
*/
  through: function(value, old, meta) {
    var root = this.root;
    if (root) {
      this.set('intermediate', this.getIntermediate(root, value), this.getIntermediate(root, old));
    }
  },
/*
  Resource instance that links models in a M:M association
*/
  intermediate: function(value, old) {
  },
/*
  First resource in a M:M association
*/
  left: function(value, old) {
    this.set('leftKey', value && value.exportKey, old && old.exportKey);
    this.set('leftName', value && value.singular, old && old.singular);
  },
/*
  Second resource in a M:M association
*/
  right: function(value, old) {
    this.set('rightKey', value && value.exportKey, old && old.exportKey);
    this.set('rightName', value && value.singular, old && old.singular);
  }
}, ['Array', 'Journal']);
LSD.Resource.prototype.__cast = function(key, value, old, meta) {
  if (this._properties[key]) return;
  var associations = this._associations, keys = this._foreignKeys;
  if (value != null && value.match === this.match) {
    if (!associations) associations = this._associations = {}
    if (typeof value != 'undefined') {
      value.set('parent', this);
      var plural = key.pluralize();
      value.set('multiple', key === plural);
      value.set(key === plural ? 'plural' : 'singular', key);
      if (key !== plural) this.prototype._constructors[key] = value;
      associations[key] = value;
    }
    if (typeof old != 'undefined') {
      value.set('parent', undefined, this);
      old.set('plural', undefined, key);
      if (!value) delete associations[key];
    }
  } else {
    LSD.URL.prototype.__cast.apply(this, arguments);
  }
};
LSD.Resource.prototype.key = 'id';
LSD.Resource.prototype._initialize = function(name) {
  if (typeof name == 'string') this.set('plural', name);
  this.attributes = LSD.Struct.implement(this.attributes, {});
  var Struct = new LSD.Resource.Model(LSD.Resource.Model.prototype.properties)
  var proto = Struct.prototype;
  proto.constructor = Struct;
  Struct.constructor = Struct._constructor = LSD.Resource;
  Struct.resource = Struct;
  for (var property in this)
    if (!Struct[property] || property == 'toString')
      Struct[property] = this[property];
  var Model = LSD.Resource.Model.prototype;
  for (var property in Model)
    if (!proto[property] || property == 'toString' || property == '_nonenumerable')
      proto[property] = Model[property];
  delete Struct._owning;
  delete Struct._ownable;
  return Struct;
};
/*
  A simple resource router that can transform parameters to what resource
  really understand. E.g. it can handle requests with `page` parameter, when
  resource only supports `offset` param. It may also alias parameters, e.g.
  if a resource accept `p` param, feeding it `page` will work just as well.

   Backend resources may or may not follow naming conventions on clientside.
  If naming backend things is out of control, e.g. when using 3d party APIs,
  one could map real URLs on virtual resources and use the mapped schema.
*/
LSD.Resource.prototype.match = function(url, params) {
  var bit, id, prev, action, resource, parent = this;
  for (var i = 0, j, k = url.length; (j = url.indexOf('/', i)) > -1 || (j = k); i = j + 1) {
    if ((bit = url.substring(i, j)).length === 0) continue;
    var definition = j == k && parent._collection[bit] || ((id != null || bit === url) && parent._member[bit]);
    if (definition) {
      action = bit;
    } else {
      if ((resource = parent.get(bit))) parent = resource;
      if (id != null) {
        (params || (params = {}))[parent._owner.exportKey] = id;
        id = null;
      }
      if (!resource) {
        id = parseInt(bit);
        if (id != bit) id = bit;
      }
    }
    if (j == k) break;
  }
  if (parent && parent.resource) {
    if (!params) params = {};
    if (id && !resource) params.id = id;
    if (!action) switch(params.method) {
      case 'post':
        action = 'create';
        break;
      case 'delete':
        action = 'destroy';
        break;
      case 'put':
        action = 'update';
        break;
      case 'patch':
        action = 'patch';
      case 'options':
        action = 'options';
        break;
      default:
        action = params.id ? 'show' : 'index';
    }
    if (!params.method) params.method = 'get';
    params.action = action;
    params.resource = parent;
    var url = parent.urls;
    if (url && (url = url[action])) {
      var index = url.indexOf(' ');
      if (index > -1) {
        params.method = url.substring(0, index).toLowerCase();
        url = url.substring(index + 1);
      }
    }
    if (url) {
      var index = url.indexOf('?');
      if (index > -1) {
        var query = url.substring(index + 1);
        for (var i = -1, j, k, bit, val; ;) {
          if ((j = query.indexOf('&', i)) == -1) j = undefined;
          bit = query.substring(i, j);
          if ((k = bit.indexOf('=')) > -1) {
            val = bit.substring(k + 1);
            bit = bit.substring(0, k);
          }
          var section = this._params[bit];
          if (section) {
            var group = this._dictionary[section]
            for (var param in group) {
              if (params[param]) {
                params[bit] = params[param];
                break;
              }
            }
          } else {
            if (i == -1 && val == null) params[bit] = params.id;
            else switch (val) {
              case 'string': case 'number': case 'object':
                if (typeof params.id == val)
                  params[bit] = params.id
                break;
              default:
                if (val == null) {
                  console.error(bit)
                } else params[bit] = val;
            }
          }
          if (j == null) break;
          else i = j + 1;
        }
        url = url.substring(0, index);
      }
      params.url = url;
    }
  }
  return params;
}
LSD.Resource.prototype.dispatch = function(request, options, model, arg) {
  if (typeof request == 'string')
    request = this.match(request, options) || request;
  return (request.resource || this).execute(request, model, arg);
};
LSD.Resource.prototype.execute = function(params, model, arg) {
  var name = typeof params == 'string' ? params : params.action;
  var collection = this._collection[name];
  var definition = collection || this._member[name];
  if (definition) {
    if (model) model.saving = true;
    if (definition.before) {
      //if (this.execute(definition.before, model)) {}
    }
    var action = definition.action || this[name];
    if (typeof action == 'string') action = this[action];
    if (action) var result = action.call(this, model, arg);
    if (definition.after) {
      if (this.dispatch(definition.after, undefined, model)) {
        
      }
    }
    if (model) delete model.saving;
  } else if (model && typeof model[name] == 'function') {
    model[name](arg)
  }
  return params;
};
LSD.Resource.prototype.associate = function(association, object, name) {
  (this._associated || (this._associated = [])).push(association);
  var key = association.resource.key;
  var foreign = (object._foreign || (object._foreign = {}));
  (foreign[key] || (foreign[key] = [])).push(association);
  association.set('object', object);
  if (this.exportKey)
    association.set('foreignKey', this.exportKey)
  if (this.singular)
    association.set('as', this.singular, undefined, undefined, true)
  object.set(name, association, undefined, 'associate');
}
LSD.Resource.prototype.deassociate = function(association, object, name) {
  var index = this._associated.indexOf(association);
  var key = association.resource.key;
  if (index > -1) this._associated.splice(index, 1);
  var index = object._associated[key].indexOf(association);
  if (index > -1) object._associated[key].splice(index, 1);
  if (this.exportKey)
    association.set('foreignKey', undefined, this.exportKey, undefined, true)
  if (this.singular)
    association.set('as', undefined, this.singular, undefined, true)
  association.set('object', undefined, object);
  object.set(name, undefined, association, 'associate');
}
LSD.Resource.prototype.all = function(params) {

};
LSD.Resource.prototype.where = function(params) {
  switch (this.implementation && this.implementation.where) {

  }
};
LSD.Resource.prototype.find = function() {

};
LSD.Resource.prototype._dictionary = {
  limit: {per_page: 1, count: 1, limit: 1, number: 1, n : 1},
  offset: {max_id: 'id', offset: 1, skip: 1, after: 1},
  page: {p: 1, page: 1, page_no: 1},
  sort: {sort_by: 1, sort_field: 1, sort: 1},
  order: {order_by: 1, order_direction: 1, sort_direction: 1, order: 1},
  methods: {post: 1, get: 1, put: 1, 'delete': 1, patch: 1, options: 1}
};
LSD.Resource.prototype._params = (function(params) {
  var proto = LSD.Resource.prototype;
  for (var type in proto._dictionary)
    for (var name in proto._dictionary[type])
      params[name] = type;
  return params;
})({})

LSD.Resource.prototype.limit = function(params) {
  if (typeof params != 'object') var limit = parseInt(params)
  else for (var param in this._dictionary.limit) if (params[param]) {
    var limit = params[param];
    break;
  }
  if (this.source || (this.implementation && this.implementation.limit)) {
    collection.set('_limit', number);
  }
  return LSD.Array.prototype.limit.call(this, limit || this._per_page, params)
};
LSD.Resource.prototype.offset = function(params) {
  if (typeof params != 'object') var offset = parseInt(params)
  else for (var param in this._dictionary.offset) if (params[param]) {
    var offset = params[param];
    break;
  }
  var collection = this.source || (this.implementation && this.implementation.offset) ? this : new this.constructor;
  if (collection !== this) collection.origin = this;
  collection.set('_offset', offset);
  return collection;
};
LSD.Resource.prototype.paginate = function(params) {
  var page = this.page(params);
  if (page !== this)
    return this.offset(this.limit(params)._limit * page);
  return this;
};
LSD.Resource.prototype.page = function(params) {
  if (params) for (var param in this._dictionary.page) if (params[param]) {
      var page = params[param];
      break;
    }
  if (this.implementation && this.implementation.page) {
    return this;
  };
  return page;
};
LSD.Resource.prototype.search = function(params) {
  var query = params.q || params.query || params.search_query || params.search;
  if (this.implementation.search) {

  } else {

  }
  return this;
};
LSD.Resource.prototype.form = function(params) {
  for (var name in this.attributes) {
    switch (this.attributes[name].type) {
      case Boolean:

        break;
      case String:

        break;
    }
  }
};
LSD.Resource.prototype.build = function(params) {
  return new this.resource(params);
};
LSD.Resource.prototype.create = LSD.Resource.prototype.post = function(params) {
  this.resource.push(params);
};
LSD.Resource.prototype.destroy = LSD.Resource.prototype['delete'] = function(params) {
  this.resource.splice(this.resource.indexOf(params), 1);
};
LSD.Resource.prototype.update = LSD.Resource.prototype.patch = function(params, update) {
  this.resource.splice(this.resource.indexOf(params), 1, params);
};
LSD.Resource.prototype.replace = LSD.Resource.prototype.put = function(params, update) {
  this.resource.splice(this.resource.indexOf(params), 1, update);
};
LSD.Resource.prototype.validate = function(params) {
  return true;
};
LSD.Resource.prototype.onSet = function(index, value, old, meta) {
  if (meta & 0x1 || !value) return;
  var subject = value.set ? value : new this(value);
  if (subject.isNew()) subject.setTemporalKey();
  return subject;
};
LSD.Resource.prototype.getTemporalKey = function() {
  return Math.random();
}
LSD.Resource.prototype.getIntermediate = function(root, name) {
  if (root == null || name == null) return;
  if (root[name]) return root[name];
  var resource = root._construct(name, true);
  resource.set('left', this);
  resource.set('right', this.parent);
  resource._intermediate = true;
  return resource;
}
LSD.Resource.prototype.getThroughName = function(left, right) {
  if (left == null || right == null) return;
  if (left > right) {
    var memo = left;
    left = right;
    right = memo;
  }
  return left + '_' + right;
};
LSD.Resource.Property = function(from, to) {
  var def = Object.prototype.toString;
  var property = function(value) {
    if (arguments.length == 0) value = this;
    for (var i = 0, fn, own; fn = from.push ? from[i++] : (i++ == 0 && from); ) {
      if (typeof fn == 'string')
        fn = value && (own = value[fn]) && own !== def && own || property[fn];
      if (fn == property.fromString)
        fn = property._fromString;
      if (fn)
        if (fn == Array && typeof value == 'number')
          return [value];
        else if (!(value instanceof fn))
          value = fn.call(this, value);
    }
    return value;
  };
  var proto = LSD.Resource.Property.prototype;
  for (var name in proto)
    property[name] = proto[name];
  property.fromString = property;
  if (to) {
    property.toString = function(value) {
      if (arguments.length == 0) value = this;
      for (var i = 0, fn, own; fn = to.push ? to[i++] : (i++ == 0 && to); ) {
        if (typeof fn == 'string')
          fn = value && (own = value[fn]) && own !== def && own || property[fn];
        if (fn == property.toString)
          fn = property._toString;
        if (fn && !(value instanceof fn))
          value = fn.call(this, value);
      }
      return value;
    };
  }
  return property;
};
LSD.Resource.Property.prototype.toJSON = function(object, options) {
  if (this instanceof LSD.Resource.Model)
    options = object;
  if (arguments.length == 0 || this instanceof LSD.Resource.Model)
    object = this;
  var skip = object && object._nonenumerable;
  switch (typeof object) {
    case 'string':
      return '"' + object + '"';
    case 'number': case 'undefined': case 'boolean':
      return object;
    case 'object':
      if (object == null) return 'null';
      var bits = [];
      if (object.push) {
        for (var i = 0, j = object._length || object.length; i < j; i++) {
          bits.push(LSD.Resource.Model.prototype.toJSON(object[i], options));
        }
        return '[' + bits.join(', ') + ']';
      } else {
        for (var property in object)
          if (object.hasOwnProperty(property) && (!skip || !skip[property])) {
            var value = object[property];
            if (typeof value == 'object') {
              if (!options) continue;
              if (options.push) {
                if (options.indexOf(property) == -1) return;
              } else if (typeof options == 'string') {
                if (options != property) return;
              } else if (!options[property])
                return;
            }
            bits.push('"' + property + '": ' + LSD.Resource.Model.prototype.toJSON(value, options && options[property]))
          }
        return '{' + bits.join(', ') + '}'
      }
  }
};
LSD.Resource.Property.prototype.fromJSON = function(value) {
  if (typeof value == 'string')
    return JSON.parse(value);
  return value;
};
LSD.Resource.Property.prototype._toString = 
LSD.Resource.Property.prototype.toString = LSD.Resource.Property.prototype.toJSON;
LSD.Resource.Property.prototype._fromString = 
LSD.Resource.Property.prototype.fromString = LSD.Resource.Property.prototype.fromJSON;

LSD.Resource.Property.Integer = new LSD.Resource.Property(parseInt);
LSD.Resource.Property.Number  = new LSD.Resource.Property(parseFloat);
LSD.Resource.Property.Float   = new LSD.Resource.Property(parseFloat);
LSD.Resource.Property.String  = new LSD.Resource.Property(String);
LSD.Resource.Property.Object  = new LSD.Resource.Property(['fromString', Object]);
LSD.Resource.Property.Date    = new LSD.Resource.Property(['fromString', Date]);
LSD.Resource.Property.Array   = new LSD.Resource.Property(['fromString', Array])
LSD.Resource.Property.Boolean = new LSD.Resource.Property(['fromString', Boolean]);
LSD.Resource.Property.JSON    = new LSD.Resource.Property('fromJSON', 'toJSON');
LSD.Resource.Property.XML     = new LSD.Resource.Property('fromXML', 'toXML');


LSD.Resource.Validation = function(condition, validator) {
  var validation = function(value, limit) {
    if (this.validate)
      return this.validate(value, limit == null ? validator : limit)
  }
  if (condition) validation.validate = condition;
  return condition;
};
LSD.Resource.Validation.Min = new LSD.Resource.Validation(function(value, validator) {
  if (typeof value == 'string') {
    if (validator > value.length)
      return null;
  } else {
    if (validator > value)
      return validator;
  }
});
LSD.Resource.Validation.Max = new LSD.Resource.Validation(function(value, validator) {
  if (typeof value == 'string') {
    if (validator < value.length)
      return value.substring(0, validator);
  } else {
    if (validator < value)
      return validator;
  }
});
LSD.Resource.Validation.Format = new LSD.Resource.Validation(function(value, validator) {
  if (!String(value).match(validator))
    return null;
});
LSD.Resource.Validation.Enum = new LSD.Resource.Validation(function(value, validator) {
  if (validator.indexOf(value) == -1)
    return null;
});
LSD.Resource.Validation.Truthy = new LSD.Resource.Validation(function(value, validator) {
  if (value == validator)
    return null;
});
LSD.Resource.Validation.Present = new LSD.Resource.Validation(function(value, validator) {
  if (value == null ^ validator)
    return null;
});

/*
  Instance object base structure.
*/

LSD.Resource.Model = function(argument) {
  return LSD.Struct.call(this, argument);
}
LSD.Resource.Model.prototype = LSD.Struct({
  _id: function(value) {
    this.change('url', this.constructor.url + '/' + value);
  },
  'id': '_id'
}, 'Journal');
LSD.Resource.Model.prototype._owning = false;
LSD.Resource.Model.prototype.__initialize = function(object) {
  if (typeof object == 'string') object = this.fromString(object);
  var associatee = this, resource = this.constructor;
  var associations = resource._associations;
  if (associations) for (var name in associations) {
    var association = associations[name];
    if (association.multiple)
      this.set(name, new LSD.Resource.Association(association))
  }
  return object;
};
LSD.Resource.Model.prototype.__cast = function(key, value, old, meta) {
  var resource = this.constructor, association = resource._associations;
  if (association && (association = association[key])) {
    if (!association.multiple) {
      if (value) {
        value.set(this.constructor.singular, this);
        this.watch(this.constructor.key, [value, this.constructor.exportKey])
      }
      if (old) {
        old.unset(this.constructor.singular, this);
        this.unwatch(this.constructor.key, [old, this.constructor.exportKey])
      }
    }
  }
  if (meta !== 'associate') {
    var valueResource = value && value.resource;
    var oldResource = old && old.resource;
    if (valueResource) 
      resource.associate(value, this, key);
    else if (oldResource && value && value.push) {
      old.push[value.push ? 'apply' : 'call'](old, value);
      return this._nonenumerable;
    }
    if (oldResource)
      oldResource.deassociate(value, this, key);
  }
  var foreign = this._foreign && this._foreign[key], fKey
  if (foreign) for (var i = 0, foreigner; foreigner = foreign[i++];) {
    if ((fKey = foreigner.foreignKey))
      for (var j = 0, model; model = foreigner[j++];)
        model.set(fKey, value, old, meta, true);
  } else {
    var attributes = this.constructor.attributes;
    var attribute = attributes && attributes[key];
    if (attribute) 
      value = this.cast(key, value, attribute);
  }
  return value;
};
/*
  Save associated models
*/
LSD.Resource.Model.prototype.associate = function() {
  var skip = this._nonenumerable;
  for (var property in this) 
    if (this.hasOwnProperty(property) && !skip[property]) {
      var value = this[property];
      if (value.set) {
        if (value.push)
          for (var i = 0, j = value.length; i < j; i++) {
            var val = value[i];
            if (!val.saving && val.save)
              val.save()
          }
        else
          if (!value.saving && value.save)
            value.save()
      }
    }
}
/*
  Transform and validate value of a property according to its definition
*/
LSD.Resource.Model.prototype.cast = function(key, value, property) {
  switch (property) {
    case Boolean:
      property = 'Boolean';
      break;
    case Number:
      property = 'Number';
      break;
    case Object: case Array:
      property = 'Object';
      break;
    case Date:
      property = 'Date';
  }
  switch (typeof property) {
    case 'string':
      property = LSD.Resource.Property[property];
      break;
    case 'object':
      var validations = property;
      property = property.type;
      if (typeof property == 'string')
        property = LSD.Resource.Property[property];
  }
  if (property)
    value = property(value);
  if (validations) {
    var all = LSD.Resource.Validation;
    for (var name in validations) {
      if (name == 'type') continue;
      var validation = all[name];
      if (validation === undefined) {
        var cap = name.charAt(0).toUpperCase() + name.substring(1);
        validation = all[name] = all[cap] || null;
      }
      if (validation) {
        var validated = validation.call(this, value, validations[name]);
        if (validated !== undefined) value = validated;
      }
    }
  }
  return value;
}
LSD.Resource.Model.prototype.save = function() {
  return this.constructor.dispatch(this.isNew() ? 'create' : 'update', undefined, this, arguments);
};
LSD.Resource.Model.prototype.setTemporalKey = function() {
  this.set(this.constructor.key, this.constructor.getTemporalKey())
}
LSD.Resource.Model.prototype.isNew = function() {
  return this._id == null;
}
LSD.Resource.Model.prototype.toHTML = function() {
  
};
['toXML', 'fromXML', 'toJSON', 'fromJSON', 'toString', 'fromString'].forEach(function(name) {
  LSD.Resource.Model.prototype[name] = LSD.Resource.Property.prototype[name];
})
LSD.Resource.Model.prototype._nonenumerable = LSD.Struct.implement(LSD.Journal.prototype._nonenumerable, {
  resource: true
})
LSD.Resource.Association = function(resource) {
  if (!(this instanceof LSD.Resource.Association))
    return new LSD.Resource.Association(resource)
  this.resource = resource;
  this.constructor = LSD.Resource.Association;
};
LSD.Resource.Association.prototype = new (LSD.Struct({
  as: function(value, old) {
    if (this.object) for (var model, i = 0; model = this[i++];) {
      if (value != null) model.set(value, this.object);
      if (old != null) model.set(old, undefined, this.object);
    }
  },
  foreignKey: function(value, old) {
    var key = this.resource.key;
    var id = key && this.object[key]
    if (id != null) for (var model, i = 0; model = this[i++];) {
      if (value != null) model.set(value, id);
      if (old != null) model.set(old, undefined, id);
    }
  },
  object: function(value, old) {
    
  }
}, 'Array'));

LSD.Resource.Association.prototype.build = function() {
  var model = this.resource.build.apply(this.resource, arguments);
  this.push(model)
  return model;
};

LSD.Resource.Association.prototype.onSet = function(index, value, old, meta) {
  if (meta & 0x1) return;
  var resource = this.resource, object = this.object, origin = object.constructor;
  var model = value ? (value.set ? value : new resource(value)) : old;
  var key = origin.key, link = this.as, ref = resource.collection;
  if (ref) {
    var collection = model[ref];
    var intermediate = resource.intermediate;
    var lefty = intermediate.left == this.resource;
    var left = intermediate[lefty ? 'left' : 'right'];
    var right = intermediate[lefty ? 'left' : 'right'];
    var leftName = intermediate[lefty ? 'leftName' : 'rightName'];
    var leftKey = intermediate[lefty ? 'leftKey' : 'rightKey'];
    var rightName = intermediate[lefty ? 'rightName' : 'leftName'];
    var rightKey = intermediate[lefty ? 'rightKey' : 'leftKey'];
  }
  if (value) {
    if (ref) {
      if (collection.indexOf(object) == -1) {
        collection.push(object)
        if (intermediate) {
          var linker = new intermediate;
          linker.set(leftName, model);
          linker.set(rightName, object);
          model.watch(left.key, [linker, leftKey]);
          object.watch(right.key, [linker, rightKey]);
          intermediate.push(linker);
        }
      }
    } else {
      if (link)
        model.set(link, object);
      if (key)
        model.set(this.foreignKey, object[key]);
    }
  } else {
    if (ref) {
      var i = collection.indexOf(object);
      if (i > -1) {
        collection.splice(i, 1);
        for (var i = 0, j = intermediate._length, linker; i < j; i++) {
          var linker = intermediate[i];
          if (linker && linker[leftName] == model && linker[rightName] == object) {
            intermediate.splice(i, 1);
            linker.unset(leftName, model);
            linker.unset(rightName, object);
            model.unwatch(left.key, [linker, leftKey]);
            object.unwatch(right.key, [linker, rightKey]);
            break;
          }
        }
      }
    } else {
      if (link)
        model.set(link, undefined, object);
      if (key)
        model.set(this.foreignKey, undefined, object[key]);
    }
  }
  return model;
};
/*
  Universal perfect world REST scaffolder. Can be overriden to do actions
  on back end, or emulate them locally.

   It's more actions than in usual REST implementations, but a developer
  may stick to regular CRUD and leave those extra methods alone.
*/
LSD.Resource.prototype._collection = {
  index: {
    action: function(params) {
      return this.paginate(params)
    }
  },
  search: {
    before: 'index',
    action: function(params, scope) {
      return scope.search(params);
    }
  },
  'new': {
    action: 'form'
  },
  create: {
    method: 'post',
    before: 'validate',
    after: 'associate'
  },
  validate: {
    action: function(params) {
      if (this.validate(params) === false)
        return 'unprocessable_entity';
    }
  },
  sync: {
    action: function(params) {
      if (this.validate(params) === false)
        return 'unprocessable_entity';
    }
  }
};
LSD.Resource.prototype._member = {
  show: {
    action: function(params) {
      var object = this.find(params);
      if (object === false) 
        return 'not_found';
      return object;
    },
    alias: 'reload'
  },
  edit: {
    before: 'show',
    action: 'form'
  },
  update: {
    method: 'put',
    before: ['show', 'validate'],
    after: 'associate'
  },
  patch: {
    method: 'patch',
    before: ['show', 'validate']
  },
  'delete': {
    before: 'show'
  },
  destroy: {
    method: 'delete',
    before: 'show'
  }
};
!function(members) {
  for (var name in members) !function(name) {
    LSD.Resource.Model.prototype[name] = function() {
      return this.constructor.dispatch(name, undefined, this, arguments);
    };
    var alias = members[name].alias;
    if (alias) LSD.Resource.Model.prototype[alias] = LSD.Resource.Model.prototype[name];
  }(name);
}(LSD.Resource.prototype._member);

LSD.Resource.prototype._per_page = 20;
LSD.Resource.prototype._object = true;

LSD.Properties.Resource = LSD.Resource;

// var Customer = new LSD.Resource('customers', {
//   domains: {
//     member: {
//       mark: 'PUT'
//     }
//   }
// });
// var Customer = LSD.Resource('customers');
// var Customer = LSD.document.createResource('customers');
//
// )
//
// LSD.Resource('customers/placements');
//
// Customer.create({name: 'Goe Doe'};
// new Customer({name: 'John Doe'})
//
// Customer.filter({name: 'Goe Doe'});
// Customer.filter({name: 'Goe Doe'}).sort('created_at');
// Customer.limit(10).filter({'$or': [{name: 'Goe Doe'}, {name: 'Goe Dow'}]}).sort('created_at');
// Customer.filter('{|customer| customer.name == "John Doe" && customer.age > 15}')
// Customer('SELECT * WHERE name == "John Doe"')
// Customer.all.filter({name: 'Goe Doe'}).sort('created_at')
//
//
//
// new Resource('/customers/willy/placements')
//
//
// new Resource('facebook', {
//
// });
//
// new Resource('twitter', {
//   domain: 'twitter.com',
//
//   users: {
//     urls: {
//       index: '/users/lookup',
//       show: '/users/show?screen_name&user_id',
//       search: '/users/search?q&page&per_page'
//     },
//     picture: {
//       urls: {
//         show: 'users/profile_image/:screen_name'
//       }
//     },
//     statuses: {
//       urls: {
//         index: '/statuses/user_timeline?screen_name=string&user_id=id',
//       },
//       favorite: {
//         urls: {
//           create: 'POST /favorites/create/:id',
//           destroy: 'POST /favorites/destroy/:id'
//         }
//         favorite: 'PUT'
//       }
//     },
//     favourites: {
//       urls: {
//         favourite: 'favorites/create/:id'
//       }
//     }
//   },
//   current_user: {
//     urls: {
//       show:
//     },
//     statuses: {
//       urls: {
//         index: '/statuses/user_timeline',
//         create: '/statuses/update'
//       }
//     }
//   },
//   statuses: {
//     urls: {
//       index: '/search',
//       search: '/search?q'
//     }
//   }
// })
//
//