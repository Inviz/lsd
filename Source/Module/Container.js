/*
---
 
script: Container.js
 
description: Makes widget use container - wrapper around content setting
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module.DOM

provides:
  - LSD.Module.Container
 
...
*/

LSD.Module.Container = new Class({
  options: {
    container: {
      enabled: true,
      position: null,
      inline: true,
      attributes: {
        'class': 'container'
      }
    },
    
    proxies: {
      container: {
        container: function() {
          return $(this.getContainer()) //creates container, once condition is true
        },
        condition: function() {         //turned off by default
          return false 
        },      
        priority: -1,                   //lowest priority
        rewrite: false                  //does not rewrite parent
      }
    }
  },
  
  getContainer: Macro.getter('container', function() {
    var options = this.options.container;
    if (!options.enabled) return;
    var tag = options.tag || (options.inline ? 'span' : 'div');
    return new Element(tag, options.attributes).inject(this, options.position);
  }),
  
  getWrapper: function() {
    return this.getContainer() || this.parent.apply(this, arguments);
  }
});