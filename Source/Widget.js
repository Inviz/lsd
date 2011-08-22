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
    LSD.Module.Graphics
  ]
});

LSD.Module.Events.addEvents.call(LSD.Widget.prototype, {
  initialize: function() {
    this.addPseudo(this.pseudos.writable ? 'read-write' : 'read-only');
  }
});

LSD.Widget.prototype.addStates('disabled', 'hidden', 'built', 'attached');

LSD.Behavior.attach(LSD.Widget);

(function(Widget) {
  var properties = {
    '$events': 'slice', 
    'options': 'merge',
    '$states': 'append',
    'constructors': 'append',
    'destructors': 'append'
  };
  var expectations = Widget.prototype.expectations;
  LSD.Widget = function(element, options) {
    if (this === window) return new LSD.Widget(element, options);
    if (expectations === this.expectations) {
      delete this.expectations;
      delete LSD.Widget.prototype.expectations;
      LSD.Module.Expectations.Default = expectations;
    }
    for (var property in properties) {
      var object = this[property];
      if (object) {
        var result = this[property] = {};
        switch (properties[property]) {
          case "slice":
            for (var name in object) result[name] = object[name].slice(0);
            break;
          case "merge":
            this[property] = Object.merge(result, object)
            break;
          case "append":
            var result = this[property] = {};
            for (var name in object) result[name] = object[name];
        }
      }
    }
    return LSD.Module.Options.initialize.apply(this, arguments);
  };
  LSD.Widget.prototype = Widget.prototype;
})(LSD.Widget);


new LSD.Type('Widget');

LSD.Element.pool.push(LSD.Widget);