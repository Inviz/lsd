/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Widget.Base
  - Base/Widget.Base
  - Base/Widget
  - Base/Widget.Module.Attributes
  - Base/Widget.Module.Events
  - LSD.Widget.Module.Behaviours
  - LSD.Widget.Module.Container
  - LSD.Widget.Module.DOM
  - LSD.Widget.Module.Layout
  - LSD.Widget.Module.Styles

provides: 
  - LSD.Widget
 
...
*/

(function(Old) {
  /*
    LSD.Widget autoloads all of the modules that are defined in Old.Module namespace
    unless LSD.Widget.modules array is provided.
    
    So if a new module needs to be included into the base class, then it only needs
    to be *require*d.
  */
  
  if (!Old.modules) {
    Old.modules = []
    for (var name in Old.Module) Old.modules.push(Old.Module[name]);
  }

  LSD.Widget = new Class({

    States: {
      'hidden': ['hide', 'show'],
      'disabled': ['disable', 'enable'],
      'built': ['build', 'destroy', false],
      'attached': ['attach', 'detach', false],
      'dirty': ['update', 'render', false]
    },
    
    Includes: [Old.Base, Widget.modules, Old.modules].flatten(),
    
    options: {
      element: {
        tag: 'div'
      }
    },

    initialize: function(options) {
      this.setOptions(options);
      this.dirty = true;
      this.parent.apply(this, arguments);
    }
  });

  ['Ignore', 'Module', 'Trait', 'modules', 'create', 'count'].each(function(property) { 
    LSD.Widget[property] = Old[property]
  });
  LSD.Widget.Base = Old.Base;

})(LSD.Widget);