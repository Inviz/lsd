/*
---
 
script: Container.js
 
description: Makes widget use container - wrapper around content setting
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- ART.Container

provides: [ART.Widget.Module.Container]
 
...
*/

ART.Widget.Module.Container = new Class({
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
  
  getContainer: Macro.setter('container', function() {
    return new Moo.Container(this, this.options.container);
  })
});

Widget.Attributes.Ignore.push('container');