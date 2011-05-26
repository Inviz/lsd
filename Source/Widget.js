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

LSD.Widget = new Class({
  
  Implements: [
    LSD.Module.Accessories,
    LSD.Module.Ambient,
    LSD.Module.Behavior,
    LSD.Module.Graphics
  ],
  
  options: {
    /*
      The key in element storage that widget will use to store itself.
      When set to false, widget is not written into element storage.
    */
    key: 'widget',
    /*
      Submittable elements are associated to form and may take part
      in constructing dataset 
    */
    submittable: false,
    /*
      Is widget focusable or not? If set to null, respects the
      tabindex attribute value. If set to true, will force the tabindex
      on element when element is not natively focusable. When set to false,
      does not enforce tabindex (useful for native controls).
    */
    focusable: null,
    /*
      Can widget change value? When set to true, even editable otherwise
      widgets are rendered unchangable. The difference between "readonly"
      and "disabled" states are that disabled widgets do NOT send their
      value when owner form is submitted.
    */
    writable: false,
    /*
      When set to true, layers option will enforce the default layer set.
    */
    layers: true
  },
  
  initializers: {
    widget: function(){
      return {
        events: {
          initialize: function() {
            var options = this.options, writable = options.writable;
            if (this.options.submittable) {
              this.addPseudo('submittable');
              if (writable == null) writable = true; 
            }
            if ((writable && !this.attributes.tabindex && (options.focusable !== false)) || options.focusable) 
              this.setAttribute('tabindex', 0);
              
            this.addPseudo(writable ? 'read-write' : 'read-only');
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