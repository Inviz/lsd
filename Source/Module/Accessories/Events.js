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
  - More/Element.Delegation
  - More/Events.Pseudos
  - Ext/Element.Properties.widget

provides:
  - LSD.Module.Events

...
*/

!function() {
  
LSD.Module.Events = new Class({
  Implements: [window.Events],
  
  initializers: {
    events: function() {
      this.events = {};
    }
  },
  
  addEvent: function(name, fn) {
    return Events.setEvent.call(this, name, fn)
  },
  
  removeEvent: function(name, fn) {
    return Events.setEvent.call(this, name, fn, true)
  },
  
  /*
    The functions takes events object defined in options
    and binds all functions to the widget.
  */

  bindEvents: function(events, bind, args) {
    var result = {};
    for (var name in events) {
      var value = events[name];
      if (!value || value.call) result[name] = value;
      else if (value.indexOf) result[name] = this.bindEvent(value, bind, args);
      else result[name] = this.bindEvents(value);
    }
    return result;
  },
  
  bindEvent: function(name, bind, args) {
    if (name.map) {
      var args = name.slice(1);
      name = name[0];
    }
    if (!this.$bound) this.$bound = {};
    if (!this.$bound[name]) this.$bound[name] = Events.bind(name, bind || this, args);
    return this.$bound[name];
  },

  dispatchEvent: function(type, args){
    var node = this;
    type = type.replace(/^on([A-Z])/, function(match, letter) {
      return letter.toLowerCase();
    });
    while (node) {
      var events = node.$events;
      if (events && events[type]) events[type].each(function(fn){
        return fn[args.push ? 'apply' : 'call'](node, args);
      }, node);
      node = node.parentNode;
    }
    return this;
  },
  
  captureEvent: function(type, args) {
    var events = this.$events[type];
    if (!events) return;
    for (var i = 0, j = events.length, event; i < j; i++) {
      if (!(event = events[i])) continue;
      var result = event.apply(this, args);
      if (result) return result;
    }
  }
});

LSD.addEvents(LSD.Module.Events.prototype, {
  register: function(name, object) {
    var events = this.events[name];
    if (events) Events.setStoredEvents.call(object, events, true);
  },
  unregister: function(name, object) {
    var events = this.events[name];
    if (events) Events.setStoredEvents.call(object, events, false);
  }
});

var Events = Object.append(LSD.Module.Events, {
  setStoredEvents: function(events, state) {
    var target = Events.Targets[name];
    for (var event in events)
      for (var i = 0, fn, group = events[event]; fn = group[i++];)
        this[state ? 'addEvent' : 'removeEvent'](event, fn.indexOf ? this.bindEvent(fn) : fn);
  },
  
  watchEventTarget: function(name, fn) {
    var target = Events.Targets[name];
    if (target.events) Object.each(target.events, function(state, event) {
      this.addEvent(event, function(object) {
        if (target.getter === false) object = this;
        fn.call(this, widget, state);
      });
    }, this);
    if (target.condition && target.condition.call(this)) return this;
    else if (target.getter && this[target.getter]) target = this[target.getter];
  },
  
  setEvent: function(name, fn, unset) {
    if (fn.indexOf) fn = this.bindEvent(fn);
    var method = unset ? 'removeEvent' : 'addEvent';
    if (fn.call) {
      return window.Events.prototype[method].call(this, name, fn);
    } else {
      if (name.charAt(0) == '_') {
        for (var event in fn) this[method](event, fn[event]);
        return this;
      }
      var events = this.events[name], initial = !!events;
      if (!events) events = this.events[name] = {};
      var bound = this.bindEvents(fn);
      for (event in bound) {
        var group = (events[event] || (events[event] = []));
        if (unset) {
          var i = group.indexOf(bound[event]);
          if (i > -1) group.slice(i, 1);
        } else group.push(bound[event])
      }
      var target = Events.Targets[name];
      if (target)
        if (target.call && (target = target.call(this)))
          for (var event in bound) target[method](event, bound[event]);
        else if (initial) 
          Events.watchEventTarget.call(this, name, function(object, state) {
            Events.setStoredEvents.call(object, events, state);
          })
      return this;
    }
  },
  
  setEventsByRegister: function(name, state, events) {
    var register = this.$register;
    if (!register) register = this.$register = {};
    if (register[name] == null) register[name] = 0;
    switch (register[name] += (state ? 1 : -1)) {
      case 1:
        if (events) this.addEvents(events)
        else Events.setStoredEvents.call(this, this.events[name], true);
        return true;
      case 0:
        if (events) this.removeEvents(events)
        else Events.setStoredEvents.call(this, this.events[name], false);
        return false;
    }
  },
  
  bind: function(method, bind, args) {
    return function() {
      if (bind[method]) bind[method].apply(bind, args || arguments);
    }
  }
});

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
Events.Targets = {
  root: function() {
    
  },
  self: function() { 
    return this
  },
  window: function() {
    return window;
  },
  mobile: function() {
    return this;
  }
};

!function(Known, Positive, Negative) {
  Object.each(Object.append({}, Positive, Negative), function(name, condition) {
    var events = {}, positive = !!Positive[name], state = Known[name];
    events[state[!positive ? 'enabler' : 'disabler']] = true;
    events[state[ positive ? 'enabler' : 'disabler']] = false;
    Events.Targets[condition] = {
      getter: false,
      condition: function() {
        return positive ^ this[state.property || name]
      },
      events: events
    }
  });
}(LSD.States.Known, LSD.States.Positive, LSD.States.Negative)


/*
  Defines special *on* pseudo class for events used for
  event delegation. The difference between usual event 
  delegation (which is :relay in mootools) and this, is
  that with :on you can use LSD selectors and it fires 
  callbacks in context of widgets.
  
  element.addEvent('mouseover:on(button)', callback)
*/

Event.definePseudo('on', function(split, fn, args){
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
  if (!this.prototype.$events) this.prototype.$events = {};
  for (name in events) {
    var type = this.prototype.$events[name] || (this.prototype.$events[name] = []);
    var group = events[name];
    for (var i = 0, j = group.length; i < j; i++) {
      var fn = group[i];
      if (fn) type.push(fn);
    }
  }
};


}();