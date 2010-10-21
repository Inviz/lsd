/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Widget.Base
- Base/Widget.Base
- Base/Widget
- Base/Widget.Module.Attributes
- Base/Widget.Module.Events
- ART.Widget.Module.Container
- ART.Widget.Module.DOM
- ART.Widget.Module.Expression
- ART.Widget.Module.Layout
- ART.Widget.Module.LayoutEvents
- ART.Widget.Module.Position
- ART.Widget.Module.Styles

provides: [ART.Widget]
 
...
*/

(function(Old) {
  // you can specify ART.Widget.modules as an array of classes to disable autoloading
  if (!Old.modules) {
    Old.modules = []
    for (var name in Old.Module) Old.modules.push(Old.Module[name]);
  }

  ART.Widget = new Class({

    States: {
      'hidden': ['hide', 'show'],
      'disabled': ['disable', 'enable'],
      'built': ['build', 'destroy', false],
      'attached': ['attach', 'detach', false],
      'dirty': ['update', 'render', false]
    },
    
    Includes: [Old.Base, Widget.modules, Old.modules].flatten(),
    
    ns: 'art',
    name: 'widget',
    
    options: {
      classes: [],
      element: {
        tag: 'div'
      }
    },
    

    initialize: function(options) {
      this.setOptions(options);
      
      this.update();
      this.offset = {
        paint: {},
        inside: {},
        padding: {},
        margin: {}
      }
      this.parent.apply(this, arguments);
    }
  });
    
  ['Ignore', 'Module', 'Trait', 'modules', 'create', 'count'].each(function(property) { 
    ART.Widget[property] = Old[property]
  });
  ART.Widget.Base = Old.Base;
  
  Widget.States.Ignore.push('dirty');

})(ART.Widget);