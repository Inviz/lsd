/*
---
 
script: Resource.js
 
description: Make various requests to back end
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Resource/*
  - More/URI
  
provides: 
  - LSD.Mixin.Resource
 
...
*/

LSD.Mixin.Resource = new Class({
  behaviour: ":resourceful, [itemscope]",
  
  options: {
    resource: {
      prefix: null,
      name: null
    }
  },
  
  getResource: function(options) {
    if (!options) options = this.options.resource
    if (!this.resource) {
      var name = options.name;
      var prefix = options.prefix;
      if (!name || !prefix) {
        var uri = this.attributes.itemscope;
        if (uri) {
          if (uri.toURI) uri = uri.toURI();
          prefix = uri.get('directory');
          name = uri.get('file');
          if (!name) {
            var dirs = prefix.split('/');
            name = dirs.pop();
            prefix = dirs.join('/')
          }
          name = name.singularize();
        }
      }
      var options = Object.clone(this.options.resource);
      if (prefix) options.prefix = prefix;
      this.resource = new Resource(name, options);
    }
    return this.resource;
  },
  
  getResourceID: function() {
    return this.attributes.itemid;
  },
  
  getModel: function() {
    return this.getResource().init(this.getResourceID() || this.element);
  }
});