/*
---
 
script: Events.js
 
description: A mixin that adds support for declarative events assignment
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - Core/Events
  - Core/Element.Event
  - Core/Element.Delegation
  - More/Element.Event.Pseudos
  - LSD.Struct.Group

provides:
  - LSD.Properties.Events

...
*/
  
LSD.Properties.Events = LSD.Struct.Group({
  'self':         '.',
  'element':      '.element',
  'document':     '.document',
  'window':       '.document.window',
  'matches':      '.matches',
  'relations':    '.relations',
  'allocations':  '.allocations',
  'expectations': '.expectations'
});

LSD.Properties.Events.prototype.fire = function(key, a, b, c, d, e) {
  var collection = this[key];
  if (collection) for (var i = 0, j = collection.length, fn; i < j; i++) {
    var fn = collection[i];
    if (!fn) continue;
    var result = fn.call(this, a, b, c, d, e);
    if (result != null) b = result;
  }
  return b;
};

/*
  A special method that allows events module to take control back
  when a data flows through one of the sibling modules
*/

LSD.Properties.Events.prototype._delegate = function(object, key, value, state, old, memo) {
  switch (object.nodeType) {
    case 1:
      if (object.lsd) {
        object.events.mix(key, value, memo, state)
      } else {
        Element[state ? 'addEvent' : 'removeEvent'](object);
      }
      break;
    default:
      if (object.addEvents) object[state ? 'addEvents' : 'removeEvents'](value);
  }
};

LSD.Properties.Bound = LSD.Struct();
LSD.Properties.Bound.prototype.get = function(name) {
  if (this[name]) return this[name];
  var that = this;
  return (this[name] = function() {
    if (that._widget[name])
      return that._widget.apply(that._widget, arguments);
  });
};