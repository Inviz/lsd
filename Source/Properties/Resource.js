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
  Implements: LSD.URL,
  urls: Object,
  title: function(value, old) {
    this.change('singular', value ? value.singularize() : value);
    this.change('exportKey', this.singular + '_id')
    this.change('directory', this.prefix ? value ? this.prefix + '/' + value : this.prefix : value || '');
  },
  prefix: function(value, old) {
    this.change('directory', this.title ? value ? value + '/' + this.title : this.title  : value || '');
  },
  exportKey: function(value, old, meta) {
    var associated = this._associated;
    if (associated) 
      for (var association, i = 0; association = associated[i++];)
        association.set('foreignKey', value, old, meta, true);
  },
  singular: function(value, old, meta) {
    var associated = this._associated;
    if (associated) 
      for (var association, i = 0; association = associated[i++];)
        association.set('as', value, old, meta, true);
  }
}, ['Journal', 'Array']);
LSD.Resource.prototype.onChange = function(key, value, old, meta) {
  if (this._properties[key]) return;
  var associations = this._associations, keys = this._foreignKeys;
  if (value != null && value.match === this.match) {
    if (!associations) associations = this._associations = {};
    if (typeof value != 'undefined') {
      value.parent = this;
      value.set('title', key);
      associations[key] = value;
    }
    if (typeof old != 'undefined') {
      delete old.parent;
      old.set('title', undefined, key);
      if (!value) delete associations[key];
    }
  } else {
    if (this._parts.indexOf(key) > -1 && meta !== 'composed') {
      var url = this.toString();
      this.change('url', url, 'composed', this._composedURL);
      this._composedURL = url;
    }
  }
};
LSD.Resource.prototype.key = 'id';
LSD.Resource.prototype.onStore = true;
LSD.Resource.prototype._initialize = function() {
  this.attributes = LSD.Struct.implement(this.attributes, {});
  var Struct = new LSD.Model(this.attributes), proto = Struct.prototype;
  proto.constructor = Struct;
  Struct.constructor = Struct._constructor = LSD.Resource;
  Struct.resource = Struct;
  for (var property in this)
    if (!Struct[property] || property == 'toString')
      Struct[property] = this[property];
  for (var property in LSD.Model.prototype)
    if (!proto[property])
      proto[property] = LSD.Model.prototype[property];
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
  if (!params) params = {};
  if (!params.method) params.method = 'get';
  var bit, id, prev, action, resource, parent = this;
  for (var i = 0, j, k = url.length; (j = url.indexOf('/', i)) > -1 || (j = k); i = j + 1) {
    if ((bit = url.substring(i, j)).length === 0) continue;
    if (j == k && parent._collection[bit] || (id != null && parent._member[bit])) {
      action = bit;
    } else {
      if ((resource = parent.get(bit))) parent = resource;
      if (id != null) {
        params[parent._owner.exportKey] = id;
        id = null;
      }
      if (!resource) {
        id = parseInt(bit);
        if (id != bit) id = bit;
      }
    }
    if (j == k) break;
  }
  if (parent) {
    if (id && !resource) params.id = id;
    if (!action) switch(params.method) {
      case 'post':
        action = 'create';
        break;
      case 'get':
        action = params.id ? 'show' : 'index';
        break;
      case 'delete':
        action = 'destroy';
        break;
      case 'put':
        action = 'update';
        break;
      case 'patch':
        action = 'patch';
    }
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
LSD.Resource.prototype.dispatch = function(params, object) {
  if (typeof params == 'string') params = this.match(params, object);
  if (!params.resource) return false;
  return params.url ? params : params.resource.execute(params.action, params);
};
LSD.Resource.prototype.execute = function(name, params) {
  var method = this._collection[name];
  if (method.action) {
    return method.action.call(this, params);
  }
};
LSD.Resource.prototype.register = function(resource, object, name) {
  (this._associated || (this._associated = [])).push(resource);
  var key = resource.key;
  var foreign = (object._foreign || (object._foreign = {}));
  (foreign[key] || (foreign[key] = [])).push(resource);
  resource.set('object', object);
  if (this.exportKey) resource.set('foreignKey', this.exportKey)
  if (this.singular) resource.set('as', this.singular, undefined, undefined, true)
  object.set(name, resource);
}
LSD.Resource.prototype.unregister = function(resource, object, name) {
  var index = this._associated.indexOf(resource);
  var key = resource.key;
  if (index > -1) this._associated.splice(index, 1);
  var index = object._associated[key].indexOf(resource);
  if (index > -1) object._associated[key].splice(index, 1);
  if (this.exportKey) resource.set('foreignKey', undefined, this.exportKey, undefined, true)
  if (this.singular) resource.set('as', undefined, this.singular, undefined, true)
  association.set('object', undefined, object);
  object.set(name, undefined, resource);
}
LSD.Resource.prototype._Properties = {
  urls: function(value, state) {
    
  },
  actions: function() {

  },
  collection: function() {

  },
  member: function() {

  }
};
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
    collection._set('_limit', number);
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
  collection._set('_offset', offset);
  return collection;
};
LSD.Resource.prototype.paginate = function(params) {
  var page = this.page(params);
  if (page !== this)
    return this.offset(this.limit(params)._limit * page);
  return this;
};
LSD.Resource.prototype.page = function(params) {
  for (var param in this._dictionary.page) if (params[param]) {
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
  var model = new this.resource(params);
  if (this.resource != this) this.push(model)
  return model;
};
LSD.Resource.prototype.create = LSD.Resource.prototype.post = function(params) {
  this.resource.push(params);
};
LSD.Resource.prototype.destroy = LSD.Resource.prototype['delete'] = function(params) {
  this.resource.splice(params, 1);
};
LSD.Resource.prototype.update = LSD.Resource.prototype.patch = function(params, update) {
  this.resource.splice(params, 1, update);
};
LSD.Resource.prototype.replace = LSD.Resource.prototype.put = function(params, update) {
  this.resource.splice(params, 1, update);
};
LSD.Resource.prototype.validate = function(params) {
  return true;
};
LSD.Resource.attributes = {
  _id: function(value) {
    this.change('url', this.constructor.url + '/' + value);
  },
  'id': '_id'
};
LSD.Resource.prototype.onSet = function(value, index, state, meta) {
  if (meta & 0x1) return;
  if (state && !value.set) return this(value);
}
/*
  Instance object base structure.
*/

LSD.Model = function() {
  return LSD.Struct.apply(this, arguments);
}
LSD.Model.prototype = LSD.Struct('Journal');
LSD.Model.prototype._initialize = function() {
  var associatee = this, resource = this.constructor;
  var associations = resource._associations;
  if (associations) for (var name in associations)
    this.set(name, new LSD.Association(associations[name]))
};
LSD.Model.prototype.onChange = function(key, value, old, meta) {
  var resource = this.constructor
  var valueResource = value && value.resource;
  if (valueResource) resource.register(value, this, key);
  var oldResource = old && old.resource;
  if (oldResource) resource.unregister(value, this, key);
  
  var foreign = this._foreign && this._foreign[key];
  if (foreign)
    for (var i = 0, foreigner; foreigner = foreign[i++];)
      for (var j = 0, model; model = foreigner[j++];)
        model.set(foreigner.foreignKey, value, old, meta, true);
};
LSD.Model.prototype.dispatch = function(action, params, options) {
  return this.constructor[action](params, options)
};
LSD.Model.prototype.reload = function() {
  return this.dispatch('show', arguments);
};
LSD.Model.prototype.save = function() {
  return this.dispatch(this._id ? 'update' : 'create', arguments);
};
LSD.Model.prototype.toJSON = function() {
  
};
LSD.Model.prototype.toXML = function() {
  
};
LSD.Model.prototype.toHTML = function() {
  
};
LSD.Association = function(resource) {
  if (!(this instanceof LSD.Association))
    return new LSD.Association(resource)
  this.resource = resource;
}
LSD.Association.prototype = new LSD.Resource;
LSD.Association.prototype._properties = {
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
}
LSD.Association.prototype.onSet = function(value, index, state, meta) {
  if (meta & 0x1) return;
  var resource = this.resource, object = this.object, origin = object.constructor;
  if (state && !value.set) value = new resource(value);
  var key = origin.key, link = this.as;
  if (state) {
    if (link != null) value.set(link, object);
    if (key != null) value.set(this.foreignKey, object[key]);
  } else {
    if (link != null) value.set(link, undefined, object);
    if (key != null) value.set(this.foreignKey, undefined, object[key]);
  }
  return value;
};
/*
  Universal perfect world REST scaffolder. Can be overriden to do actions
  on back end, or emulate them locally.

   It's more actions than in usual REST implementations, but a developer
  may stick to regular CRUD and leave those extra methods until he needs
  it.
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
    before: 'validate'
  },
  validate: {
    action: function(params, object) {
      if (this.validate(params) === false)
        return 'unprocessable_entity';
    }
  },
  sync: {
    action: function(params, object) {
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
    }
  },
  edit: {
    before: 'show',
    action: 'form'
  },
  update: {
    method: 'put',
    before: ['show', 'validate']
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
    LSD.Model.prototype[name] = function() {
      return this.dispatch(name, arguments);
    };
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