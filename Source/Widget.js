/*
---
 
script: Widget.js
 
description: Base widget with all modules included
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Node
  - LSD.Module.Layout
  - LSD.Module.Styles
  - LSD.Module.Attributes
  - LSD.Module.Events
  - LSD.Module.DOM
  - LSD.Module.Expectations
  - LSD.Module.Container
  - LSD.Module.Actions
  - LSD.Module.Command
  - LSD.Module.Target

provides: 
  - LSD.Widget
  - LSD.Widget.create
 
...
*/

/*
  LSD.Widget autoloads all of the modules that are defined in Old.Module namespace
  unless LSD.modules array is provided.
  
  So if a new module needs to be included into the base class, then it only needs
  to be *require*d.
*/
  
if (!LSD.modules) {
  LSD.modules = []
  for (var name in LSD.Module) LSD.modules.push(LSD.Module[name]);
}

LSD.Widget = new Class({
  
  Includes: Array.concat(LSD.Node, LSD.Base, LSD.modules),
  
  States: Object.subset(LSD.States.Known, ['disabled', 'hidden', 'built', 'attached', 'dirty']),
  
  options: {  
    element: {
      tag: 'div'
    },
    writable: false
  },
  
  initialize: function(element, options) {
    this.dirty = true;
    this.parent(element, options);
    if (this.options.writable && !this.attributes.tabindex && (this.options.focusable !== false)) this.setAttribute('tabindex', 0);
    this.addPseudo(this.options.writable ? 'read-write' : 'read-only');
  },

  /*
    Wrapper is where content nodes get appended. 
    Defaults to this.element, but can be redefined
    in other Modules or Traits (as seen in Container
    module)
  */
  
  getWrapper: function() {
    return this.toElement();
  }
});

//Basic widget initialization
LSD.Widget.count = 0;
LSD.Widget.create = function(klasses, a, b, c, d) {
  klasses = Array.from(klasses);
  var base = klasses[0].indexOf ? LSD.Widget : klasses.shift();
  var klass = klasses.shift();
  var original = klass;
  if (klass.indexOf('-') > -1) { 
    var bits = klass.split('-');
    while (bits.length > 1) base = base[bits.shift().camelCase().capitalize()];
    klass = bits.join('-');
  }
  klass = klass.camelCase().capitalize();
  if (!base[klass]) {
    original = original.replace(/-(.)/g, function(whole, bit) {
      return '.' + bit.toUpperCase();
    }).capitalize();
    throw 'ClassName LSD.Widget.' + original + ' was not found';
  }
  var widget = base[klass];
  if (klasses.length) {
    klasses = klasses.map(function(name) {
      return name.camelCase ? LSD.Trait[name.camelCase().capitalize()] : name;
    });
    widget = Class.include(widget, klasses)
  }
  LSD.Widget.count++;
  return new widget(a, b, c, d);
};