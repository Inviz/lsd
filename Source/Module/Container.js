/*
---
 
script: Container.js
 
description: Makes widget use container - wrapper around content setting
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Container

provides:
  - LSD.Module.Container
 
...
*/

LSD.Module.Container = new Class({
  options: {
    container: false,
    
    proxies: {
      container: {
        container: function() {
          return $(this.getContainer()) //creates container, once condition is true
        },
        condition: $lambda(false),      //turned off by default
        priority: -1,                   //lowest priority
        rewrite: false                  //does not rewrite parent
      }
    }
  },
  
  setContent: function(item) {
    if (item.title) item = item.title;
    return this.getContainer().set.apply(this.container, arguments);
  },
  
  getContainer: Macro.getter('container', function() {
    return new Moo.Container(this, this.options.container);
  }),
  
  getWrapper: function() {
    return this.getContainer().toElement()
  }
});