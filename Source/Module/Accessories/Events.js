/*
---
 
script: Events.js
 
description: A mixin that adds support for declarative events assignment
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - Core/Events
  - Core/Element.Event
  - Core/Element.Delegation
  - More/Element.Event.Pseudos
  - Ext/Element.Properties.widget

provides:
  - LSD.Module.Events

...
*/

!function() {
  
LSD.Module.Events = LSD.Struct.Group({
  'self':         '.',
  'element':      '.element',
  'document':     '.document',
  'window':       '.document.window',
  'matches':      '.matches',
  'relations':    '.relations',
  'allocations':  '.allocations',
  'expectations': '.expectations'
});

LSD.Module.Events.implement({
  fire: function(key, a, b, c, d, e) {
    var collection = this[key];
    if (collection) for (var i = 0, j = collection.length, fn; i < j; i++) {
      var fn = collection[i];
      if (!fn) continue;
      var result = fn.call(this, a, b, c, d, e);
      if (result != null) b = result;
    }
    return b;
  },
  
  delegate: function(object, key, value, state, old) {
    switch (object.nodeType) {
      case 1:
        if (object.lsd) {
          object.events.mix(key, value, state)
        } else {
          Element[state ? 'addEvent' : 'removeEvent'](object);
        }
        break;
      default:
        if (object.addEvents) object[state ? 'addEvents' : 'removeEvents'](value);
    }
  }
});



LSD.Module.Bound = LSD.Struct();
LSD.Module.Bound.prototype.get = function(name) {
  if (this[name]) return this[name];
  var that = this;
  return (this[name] = function() {
    if (that._widget[name])
      return that._widget.apply(that._widget, arguments);
  });
};
/*
  Target system re-routes event groups to various objects.  
  
  Combine them for fun and profit.
  
  | Keyword    |  Object that recieves events       |
  |-------------------------------------------------|
  | *self*     | widget itself (no routing)         |
  | *element*  | widget element (when built)        |
  | *parent*   | parent widget                      |
  | *document* | LSD document                       |
  | *window*   | window element                     |
  
  | State      | Condition                          |
  |-------------------------------------------------|
  | *enabled*  | widget is enabled                  |
  | *disabled* | widget is disabled                 |
  | *focused*  | widget is focused                  |
  | *blured*   | widget is blured                   |
  | *target*   | first focusable parent is focused  |
  
  | Extras     | Description                        |
  |-------------------------------------------------|
  | *expected* | Routes events to widgets, selected |
  |            | by selectors (keys of event group).|
  |            | Provided by Expectations module    |
  | _\w        | An event group which name starts   |
  |            | with underscore is auto-applied    |
  
*/
LSDEvents.Targets = {
  self: function() { 
    return this
  },
  window: function() {
    return window;
  },
  mobile: function() {
    return this;
  },
  element: true,
  document: true,
  parent: true,
  root: true
};

LSDEvents.States = {
  Positive: {
    disabled: 'disabled',
    focused: 'focused'
  },
  Negative: {
    enabled: 'disabled',
    blured: 'focused'
  }
};

!function(Known, Positive, Negative) {
  Object.each(Object.append({}, Positive, Negative), function(name, condition) {
    var events = {}, positive = !!Positive[name], state = Known[name];
    events[state[!positive ? 'enabler' : 'disabler']] = true;
    events[state[ positive ? 'enabler' : 'disabler']] = false;
    LSDEvents.Targets[condition] = {
      getter: false,
      condition: function() {
        return positive ^ this[state && state.property || name]
      },
      events: events
    }
  });
}(LSD.States, LSDEvents.States.Positive, LSDEvents.States.Negative);


/*
  Defines special *on* pseudo class for events used for
  event delegation. The difference between usual event 
  delegation (which is :relay in mootools) and this, is
  that with :on you can use LSD selectors and it fires 
  callbacks in context of widgets.
  
  element.addEvent('mouseover:on(button)', callback)
*/

DOMEvent.definePseudo('on', function(split, fn, args){
  var event = args[0];
  var widget = Element.get(event.target, 'widget');
  if (widget && widget.match(split.value)) {
    fn.call(widget, event, widget, event.target);
    return;        
  }
});

LSD.Options.events = {
  add: 'addEvent',
  remove: 'removeEvent',
  iterate: true
};

Class.Mutators.$events = function(events) {
  var category = this.prototype.$events || (this.prototype.$events = {});
  for (var name in events) {
    var type = category[name] || (category[name] = []);
    type.push.apply(type, events[name]);
  }
};

Class.Mutators.events = function(events) {
  var category = this.prototype.events || (this.prototype.events = {});
  for (var label in events) {
    var group = events[label];
    var type = category[label] || (category[label] = {});
    for (var name in group) {
      var stored = type[name] || (type[name] = []);
      var value = group[name];
      stored.push.apply(stored, group[name]);
    }
  }
};


}();