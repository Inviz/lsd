/*
---
 
script: Resource.js
 
description: An dynamic collection or link with specific configuration
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct.Group.Array
  - LSD.Document
  - String.Inflections/String.singularize

provides: 
  - LSD.Resource
 
...
*/

LSD.Resource = new LSD.Struct.Array({
  //Extends: LSD.Properties.Request,
  
  imports: {
    'prefix': '.path',
    'domain': '.domain'
  },
  name: '_name',
  _name: function(value, old) {
    this.reset('path', this.prefix ? value ? this.prefix + '/' + value : this.prefix : value || '');
    this.reset('singular', value ? value.singularize() : value);
    this.reset('foreign_key', this.singular + '_id')
    return typeof value == 'undefined' ? old : value;
  },
  prefix: function(value, old) {
    this.reset('path', this._name ? value ? value + '/' + this._name : this._name  : value || '');
    return typeof value == 'undefined' ? old : value;
  },
  path: function(value, old) {
    this.reset('url', this.domain ? value ? this.domain + '/' + value : this.domain : value || '');
    return typeof value == 'undefined' ? old : value;
  },
  domain: function(value, old) {
    this.reset('url', value + '/' + (this.path || ''))
    return typeof value == 'undefined' ? old : value;
  }
});
LSD.Properties.Resource = LSD.Resource;
LSD.Resource.prototype.prefix = '';
LSD.Resource.prototype.path = '';
LSD.Resource.prototype.onChange = function(key, value, state, old, memo) {
  if (value._constructor === LSD.Resource) {
    value[state ? 'set' : 'unset']('name', key);
  }
  return value;
};
LSD.Resource.prototype.onStore = function(key, value, memo, state, name) {
  if (name == null) {
    var skip = value._skip; 
    for (var prop in value) {
      if (value.hasOwnProperty(prop) && (skip == null || !skip[prop])) {
        var property = this._Properties[prop];
        if (property != null) property.call(this, key, value[prop], state);
      }
    }
  }
  return true;
};
LSD.Resource.prototype._per_page = 20;
LSD.Resource.prototype._constructor = LSD.Resource;
LSD.Resource.prototype._initialize = function() {
  this.attributes = Object.append({}, this.attributes);
  var Struct = new LSD.Model(this.attributes);
  Struct.prototype.constructor = Struct;
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
LSD.Resource.prototype.all = function(params) {
  
};
LSD.Resource.prototype.where = function(params) {
  switch (this.implementation.where) {
    
  }
  //if (this.indexOf())
};
LSD.Resource.prototype.find = function() {

};
LSD.Resource.prototype.limit = function(params) {
  var limit = params.per_page || params.count || params.limit || params.number || params.n || this._per_page;
  if (this.implementation.limit) {
    
    return this;
  }
  return limit;
};
LSD.Resource.prototype.offset = function(params) {
  var offset = params.offset || params.skip || params.after;
  if (this.implementation.offset) {
    
    return this;
  }
  return offset;
};
LSD.Resource.prototype.paginate = function(params) {
  var page = this.page(params);
  if (page !== this) 
    this.offset(this.limit(params) * page);
  return this;
};
LSD.Resource.prototype.page = function(params) {
  var page = params.page || params.p || params.page_number || 1;
  if (this.implementation.page) {
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
      case 'patch':
        action = 'patch';
    }
    params.action = action;
    params.resource = parent;
  }
  return params;
}
LSD.Resource.prototype.dispatch = function(params) {
  
}

/*
LSD.Resource.Implementation = function() {
};
LSD.Resource.Implementation.prototype = {
  limit: false,
  offset: false,
  search: false,
  validate: false,
  sort: false,
  update: false,
  patch: false,
  destroy: false,
  show: false,
  index: false
}
*/

LSD.Resource.prototype._Properties = {
  urls: function() {
    
  },
  actions: function() {
    
  },
  collection: function() {
    
  },
  member: function() {
    
  }
};

LSD.Model = function() {
  return LSD.Struct.apply(this, arguments);
}
LSD.Model.prototype = new LSD.Struct;
LSD.Model.prototype.dispatch = function() {
  this.constructor.action()
};
LSD.Model.prototype.reload = function() {
  return this.dispatch('show', arguments);
};
LSD.Model.prototype.save = function() {
  return this.dispatch(this._id ? 'update' : 'create', arguments);
};
LSD.Resource.attributes = {
  _id: function(value) {
    this.set('url', this.constructor.url + '/' + value);
  },
  'id': '_id'
};


/*
  Universal perfect world REST scaffolder. Can be overriden
  to do actions on back end, or emulate them locally.
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
})
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



LSD.Resource.Attributes = 
LSD.Resource.prototype._properties.attributes = new LSD.Struct({
  
});


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
//         index: '/statuses/user_timeline?screen_name&user_id',
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