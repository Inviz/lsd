/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Type
  - LSD.Module.Accessories
  - LSD.Module.Ambient
  - LSD.Module.Behavior
  - LSD.Module.Graphics
  - LSD.Mixin.Value

provides: 
  - LSD.Widget
 
...
*/

/*
  Pre-generate CSS grammar for layers.
  
  It is not required for rendering process itself, because
  this action is taken automatically when the first
  widget gets rendered. Declaring layer css styles upfront
  lets us use it in other parts of the framework
  (e.g. in stylesheets to validate styles)
*/

LSD.Widget = new Class({
  
  Implements: [
    LSD.Module.Accessories,
    LSD.Module.Ambient,
    LSD.Module.Behavior,
    LSD.Module.Graphics
  ],
  
  options: {
    key: 'widget',
    writable: false,
    layers: true
  },
  
  initializers: {
    widget: function(){
      return {
        events: {
          initialize: function() {
            if ((this.options.writable && !this.attributes.tabindex && (this.options.focusable !== false)) || this.options.focusable) 
              this.setAttribute('tabindex', 0);
            this.addPseudo(this.options.writable ? 'read-write' : 'read-only');
          }
        }
      }
    }
  },
  
  initialize: LSD.Module.Options.initialize
});

LSD.Widget.prototype.addStates('disabled', 'hidden', 'built', 'attached');

LSD.Behavior.attach(LSD.Widget);

new LSD.Type('Widget');