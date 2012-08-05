/*
---
 
script: Events.js
 
description: A mixin that adds support for declarative events assignment
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Properties
  - LSD.Struct
  - LSD.Group
  - LSD.Document

provides:
  - LSD.Properties.Events

...
*/
  
LSD.Properties.Events = LSD.Struct({
  'element':      '.element',
  'document':     '.document',
  'window':       '.document.window',
  'matches':      '.matches',
  'relations':    '.relations'
}, 'Group');
LSD.Properties.Events.prototype.onGroup = function(key, group, state) {
  var doc = (this._owner.document || LSD.Document.prototype), body = doc.body;
  if (!body) return;
  var defs = doc.events, def = defs[key], base;
  if (!def || !(base = def.base) || !defs[base]) {
    var events = body.events, delegates = (events.delegates || events.delegates = {});
    if (state && ++delegates[key] == 1)
      events.addListener(body.element, key)
    if (!state && --delegates[key] == 0)
      events.removeListener(body.element, key);
  }
};
LSD.Properties.Events.prototype.handle = function(event) {
  if (!event) event = window.event;
  var element = LSD.UIDs[event.related.uid];
  var key = event.type;
  var defs = (this._owner.document || LSD.Document.prototype);
  var def = defs[key], e, b;
  for (var node = element; node; node = node.parentNode) {
    var events = node.events[key];
    if (events) for (var i = 0, j = events.length, fn; i < j; i++) {
      var fn = events[i];
      if (!fn) continue;
      //if (!e) e = def.type ? LSD.Event[def.type.p]
      var result = fn.call(this, a, b);
      if (result != null) b = result;
    }
  }
};
LSD.Properties.Events.prototype.addListener = function(element, type, fn, meta) {
  if (!fn) fn = this._handler || this._handler = this.handle.bind(this);
  if (element.addEventListener) element.addEventListener(type, fn, !!meta);
  else element.attachEvent('on' + type, fn);
}
LSD.Properties.Events.prototype.removeListener = function(element, type, fn, meta) {
  if (!fn) fn = this._handler || this._handler = this.handle.bind(this);
  if (element.removeEventListener) element.removeEventListener(type, fn, !!meta);
  else element.detachEvent('on' + type, fn);
}
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

LSD.Properties.Events.prototype.dispatch = function(key) {
  
}

/*
  A special method that allows events module to take control back
  when a data flows through one of the sibling modules
*/

LSD.Properties.Events.prototype._delegate = function(object, key, value, meta, old) {
  switch (object.nodeType) {
    case 1:
      if (object.lsd) {
        object.events.mix(key, value, meta, old)
      } else {
        if (typeof value != 'undefined') Element.addEvents(object, key, value);
        if (typeof old != 'undefined') Element.removeEvents(object, key, old);
      }
      break;
    default:
      if (!object.addEvents) return;
      if (typeof value != 'undefined') object.addEvents(value);
      if (typeof old != 'undefined') object.removeEvents(old);
  }
};

LSD.Properties.Bound = LSD.Struct();
LSD.Properties.Bound.prototype.get = function(name) {
  if (this[name]) return this[name];
  var that = this;
  return (this[name] = function() {
    if (that._owner[name])
      return that._owner.apply(that._owner, arguments);
  });
};

LSD.Event = new LSD.Struct(
  /*
  element: LSD.Element,
  start:   LSD.Event,
  end:     LSD.Event,
  origin:  Event
  */
);

LSD.Position = new LSD.Struct(
  /*
  x:       Number,
  y:       Number
  */
);
LSD.Position.prototype.distanceBetween = function(position) {
  
};
LSD.Event.Position = new LSD.Struct({
  Implements: [LSD.Event, LSD.Position]
});


LSD.Document.prototype.events = {
  'hold': {
    base: 'touch',
    timeout: 500
  },
  'drag': {
    base: 'touchmove',
    property: 'dragged'
  },
  'tap': {
    base: 'touch'
  },
  'touch': {
    base: 'ontouchstart' in window ? 'touchstart' : 'mousedown',
    property: 'touched',
    ends: 'release',
    type: 'position'
  },
  'move': {
    base: 'ontouchstart' in window ? 'touchmove' : 'mousemove',
    type: 'position'
  },
  'release': {
    base: 'ontouchstart' in window ? 'touchend' : 'mouseup',
    type: 'position'
  },
  'mouseenter': {
    base: 'mouseover',
    condition: 'contains',
    property: 'hover',
    ends: 'mouseleave'
  },
  'mouseleave': {
    base: 'mouseout',
    condition: 'contains'
  },
  'mousewheel': {
    
  },
  'change': {
    property: 'nodeValue'
  },
  'focus': {
    property: 'focused',
    ends: 'blur'
  },
  'domready': {
    base: 'DOMContentLoaded'
  }
}