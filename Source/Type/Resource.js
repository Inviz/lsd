/*
---
 
script: Resource.js
 
description: Make various requests to back end
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Resource/*
  - More/URI
  - LSD.Mixin.Request
  
provides: 
  - LSD.Mixin.Resource
 
...
*/

LSD.Mixin.Resource = new Class({
  options: {
    resource: {
      prefix: null,
      name: null
    },
    request: {
      type: 'xhr'
    },
    actions: {
      resource: {
        enable: function() {
          this.pseudos.include('request');
          this.getModel();
        },
        
        disable: function() {
          this.pseudos.erase('request');
        }
      }
    },
    events: {
      self: {
        getCommandAction: function() {
          return 'submit';
        }
      }
    }
  },
  
  constructors: {
    resource: function(options, state) {
      this.pseudos[state ? 'include' : 'erase']('request')
    }
  },
  
  getResource: function(options) {
    if (!options) options = this.options.resource
    if (!this.resource) {
      var name = options.name;
      var prefix = options.prefix;
      if (!name || !prefix) {
        var uri = this.attributes.itemtype.split(/\s+/).getLast();
        if (uri) {
          if (uri.toURI) uri = uri.toURI();
          prefix = uri.get('directory');
          name = uri.get('file');
          /*
            Parses the last URL bit that can be singularized 
          */
          while (!name || !(name = name.singularize())) {
            var dirs = prefix.split('/');
            name = dirs.pop();
            prefix = dirs.join('/')
          }
        }
      }
      var options = Object.clone(this.options.resource);
      if (prefix) options.prefix = prefix;
      options.getRequest = this.bind('getRequest');
      this.resource = new Resource(name, options);
    }
    return this.resource;
  },
  
  getResourceID: function() {
    return this.attributes.itemid;
  },
  
  getModel: function() {
    if (this.model) return this.model
    this.model = this.getResource().init(this.getResourceID() || this.element);
    var url = this.resource.getFormattedURL(this.model.id ? 'show' : 'index', this.model);
<<<<<<< Updated upstream:Source/Properties/Resource.js
    //this.setAttribute('href', url);
=======
    this.attributes.set('href', url)
>>>>>>> Stashed changes:Source/Mixin/Resource.js
    return this.model;
  },
  
  submit: function() {
    var model = this.getModel();
    return model.save.apply(model, arguments);
  },
  
  'delete': function() {
    return this.getModel().destroy(function() {
      this.destroy();
    }.bind(this));
  }
});

LSD.Behavior.define(':resource, [itemscope]', 'resource');