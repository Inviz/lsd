/*
---
 
script: Resource.js
 
description: An dynamic collection or link with specific configuration
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct
  - LSD.Group
  - LSD.Array
  - LSD.Document
  - LSD.Element
  - String.Inflections/String.singularize

provides: 
  - LSD.Resource
 
...
*/

/*
  Resources are beautiful abstractions over access to data storages. 
  It leaves all work of building and matching urls to convenient
  defaults of RESTful resource structure. LSD resources are 
  self-sufficent and can do all of the typical resource operations
  in memory. Having resources on client side comes in handy when 
  the back end application also supports resources. But even if
  it doesn't, resources can be defined with each action mapped
  to a custom url.
*/

LSD.Resource = LSD.Struct({
  //Extends: LSD.Properties.Request,
  
  imports: {
    'prefix': '.path',
    'domain': '.domain'
  },
  urls: Object,
  name: '_name',
  _name: function(value, old) {
    this.change('path', this.prefix ? value ? this.prefix + '/' + value : this.prefix : value || '');
    this.change('singular', value ? value.singularize() : value);
    this.change('foreign_key', this.singular + '_id')
  },
  prefix: function(value, old) {
    this.change('path', this._name ? value ? value + '/' + this._name : this._name  : value || '');
  },
  path: function(value, old) {
    this.change('url', this.domain ? value ? this.domain + '/' + value : this.domain : value || '');
  },
  domain: function(value, old) {
    this.change('url', value + (this.path ? '/' + this.path : ''))
  },
  _origin: function() {
    
  }
}, 'Array');
LSD.Resource.prototype.onChange = function(key, value, state, old, memo) {
  if (value != null && value.match === this.match && !this._properties[key])
    value[state ? 'set' : 'unset']('name', key);
  return value;
};
LSD.Resource.prototype.onStore = function(key, value, memo, state, name) {
  if (name == null) {
    var skip = value._skip, property; 
    for (var prop in value)
      if (value.hasOwnProperty(prop) && (skip == null || !skip[prop]))
        if ((property = this._Properties[prop]) != null) 
          property.call(this[key] || this._construct(key), value[prop], state, memo);
  }
  return true;
};
LSD.Resource.prototype._initialize = function() {
  this.attributes = Object.append({}, this.attributes);
  var Struct = new LSD.Model(this.attributes);
  Struct.prototype.constructor = Struct;
  Struct.constructor = LSD.Resource;
  for (var property in this) 
    if (!Struct[property]) 
      Struct[property] = this[property];
  for (var property in LSD.Model.prototype) 
    if (!Struct.prototype[property]) 
      Struct.prototype[property] = LSD.Model.prototype[property];
  delete Struct._parent;
  delete Struct._children;
  return Struct;
};
/*
  A simple resource router that can transform parameters
  to what resource really understand. E.g. it can 
  handle requests with `page` parameter, when resource
  only supports `offset` param. It may also rename
  parameters, e.g. if a resource accept `p` param,
  feeding it `param` will work just as well.
  
  Backend resources may or may not follow naming conventions
  on clientside. If naming backend things is out of control,
  e.g. when using 3d party APIs, one could map real URLs
  on virtual resources and use the mapped schema. 
*/
LSD.Resource.prototype.match = function(url, params) {
  if (!params) params = {};
  if (!params.method) params.method = 'get';
  for (var i = 0, j, k = url.length, bit, id, prev, action, parent = this, resource; (j = url.indexOf('/', i)) > -1 || (j = k); i = j + 1) {
    if ((bit = url.substring(i, j)).length === 0) continue;
    if (j == k && parent._collection[bit] || (id != null && parent._member[bit])) {
      action = bit;
    } else {
      if ((resource = parent.get(bit))) parent = resource;
      if (id != null) {
        params[parent._parent.foreign_key] = id;
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
};
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
  return new this(params);
};
LSD.Resource.prototype.create = function(params) {
  this.local.push(this.build(params));
};
LSD.Resource.prototype.destroy = function(params) {
  if (params.constructor !== this) params = this.find(params);
  this.local.splice(this.local.indexOf(params), 1);
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

/*
  Instance object base structure. Resources are
  initialized on top of constructors made by
  this struct.
*/

LSD.Model = function() {
  return LSD.Struct.apply(this, arguments);
}
LSD.Model.prototype = LSD.Struct();
LSD.Model.prototype.dispatch = function() {
  this.constructor.action()
};
LSD.Model.prototype.reload = function() {
  return this.dispatch('show', arguments);
};
LSD.Model.prototype.save = function() {
  return this.dispatch(this._id ? 'update' : 'create', arguments);
};

/*
  Universal perfect world REST scaffolder. Can be overriden
  to do actions on back end, or emulate them locally.
  
  It's more actions than in usual REST implementations,
  but a developer may stick to regular CRUD and leave
  those extra methods until he needs it.
*/
(LSD.Resource.prototype._collection = {
  index: {
    action: function(params) {
      return this.paginate(params)
    }
  },
  search: {
    url: 'search',
    before: 'index',
    action: function(params, scope) {
      return scope.search(params);
    }
  },
  'new': {
    action: function(params) {
      return this.form(params);
    }
  },
  create: {
    method: 'post',
    before: 'validate',
    action: function(params, object) {
      return this.create(object)
    }
  },
  validate: {
    action: function(params, object) {
      if (this.validate(params) === false) return 'unprocessable_entity';
    }
  },
  sync: {
    action: function(params, object) {
      if (this.validate(params) === false) return 'unprocessable_entity';
    }
  }
});
Object.each((LSD.Resource.prototype._member = {
  show: {
    action: function(params) {
      var object = this.find(params);
      if (object === false) return 'not_found';
      return object;
    }
  },
  edit: {
    before: 'show',
    action: function(params, object) {
      return this.form(params, object);
    }
  },
  update: {
    method: 'put',
    before: ['show', 'validate'],
    action: function(params, object) {
      return object.put(params);
    }
  },
  patch: {
    method: 'patch',
    before: ['show', 'validate'],
    action: function(params, object) {
      return object.patch(params);
    }
  },
  'delete': {
    before: 'show'
  },
  destroy: {
    method: 'delete',
    before: 'show',
    action: function(params, object) {
      return object.destroy(params)
    }
  }
}), function(definition, name) {
  LSD.Model.prototype[name] = function() {
    return this.dispatch(name, arguments);
  };
});

LSD.Resource.prototype.prefix = '';
LSD.Resource.prototype.path = '';
LSD.Resource.prototype.url = '';
LSD.Resource.prototype.domain = null;
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