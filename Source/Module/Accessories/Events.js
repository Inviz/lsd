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
  Implements: window.Events
});

var proto = window.Events.prototype;
var Events = Object.append(LSD.Module.Events, {
  bindEvents: function(events, bind, args) {
    var result = {};
    for (var name in events) {
      var value = events[name];
      if (!value || value.call) result[name] = value;
      else if (value.indexOf) result[name] = Events.bindEvent.call(this, value, bind, args);
      else result[name] = Events.bindEvents.call(this, value);
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
  
  setStoredEvents: function(events, state, bind) {
    var target = Events.Targets[name];
    for (var event in events)
      for (var i = 0, fn, group = events[event]; fn = group[i++];)
        Events.setEvent.call(this, event, (fn.indexOf && bind ? bind.bindEvent(fn) : fn), !state);
  },
  
  watchEventTarget: function(name, fn) {
    var target = Events.Targets[name];
    if (target.events) Object.each(target.events, function(state, event) {
      Events.setEvent.call(this, event, function(object) {
        if (target.getter === false) object = this;
        fn.call(this, object, state);
      });
    }, this);
    if (target.condition && target.condition.call(this)) fn.call(this, this, true);
    else if (target.getter && this[target.getter]) fn.call(this, this[target.getter], true);
  },
  
  setEvent: function(name, fn, revert) {
    if (fn.indexOf && this.lsd) fn = this.bindEvent(fn);
    if (fn.call || (fn.indexOf && !this.lsd)) {
      if (!revert) {
        if (!this.$events) this.$events = {};
        var method = 'addEvent';
      } else var method = 'removeEvent'
      var kicker = this[method];
      if (!kicker || kicker.$origin == Events[method]) kicker = proto[method];
      return kicker.call(this, name, fn);
    } else {
      if (name.charAt(0) == '_') {
        for (var event in fn) Events.setEvent.call(this, event, fn[event], revert);
        return this;
      }
      if (!revert && !this.events) this.events = {};
      var events = this.events[name], initial = !events;
      if (!events) events = this.events[name] = {};
      var bound = this.lsd ? this.bindEvents(fn) : fn;
      for (event in bound) {
        var group = (events[event] || (events[event] = []));
        if (revert) {
          var i = group.indexOf(bound[event]);
          if (i > -1) group.slice(i, 1);
        } else group.push(bound[event])
      }
      var target = Events.Targets[name];
      if (target)
        if (target.call) {
          if ((target = target.call(this))) 
            for (var event in bound) Events.setEvent.call(target, event, bound[event], revert);
        } else if (initial) {
          Events.watchEventTarget.call(this, name, function(object, state) {
            Events.setStoredEvents.call(object, events, state, this);
          })
        } else if (target.getter && this[target.getter]) this[target.getter][revert ? 'removeEvents' : 'addEvents'](bound)
      return this;
    }
  },
  
  setEvents: function(events, revert) {
    for (var type in events) Events.setEvent.call(this, type, events[type], revert);
    return this;
	},
	
  addEvent: function(name, fn) {
    return Events.setEvent.call(this, name, fn);
  },
  
  addEvents: function(events) {
    for (var type in events) Events.setEvent.call(this, type, events[type]);
    return this;
  },
  
  removeEvent: function(name, fn) {
    return Events.setEvent.call(this, name, fn, true);
  },
  
  removeEvents: function(events) {
    for (var type in events) Events.setEvent.call(this, type, events[type], true);
    return this;
  },
  
  setEventsByRegister: function(name, state, events) {
    var register = this.$register;
    if (!register) register = this.$register = {};
    if (register[name] == null) register[name] = 0;
    switch (register[name] += (state ? 1 : -1)) {
      case 1:
        if (events) this.addEvents(events)
        else if (this.events) Events.setStoredEvents.call(this, this.events[name], true);
        return true;
      case 0:
        if (events) this.removeEvents(events)
        else if (this.events) Events.setStoredEvents.call(this, this.events[name], false);
        return false;
    }
  },
  
  fireEvent: function(type, args, delay){
    var events = this.$events[type];
    if (!events) return this;
    var method = Type.isEnumerable(args) ? 'apply' : 'call';
    for (var i = 0, j = events.length, fn; i < j; i++) {
      if (!(fn = events[i])) continue;
      if (fn.indexOf) fn = this[fn];
      if (delay) fn.delay(delay, this, args);
      else fn[method](this, args);
    }
    return this;
  },
  
  dispatchEvent: function(type, args){
    for (var node = this; node; node = node.parentNode) {
      var events = node.$events[type];
      if (!events) continue;
      var method = Type.isEnumerable(args) ? 'apply' : 'call';
      for (var i = 0, j = events.length, fn; i < j; i++)
        if ((fn = events[i])) fn[method](node, args);
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
  },
  
  bind: function(method, bind, args) {
    return function() {
      if (bind[method]) bind[method].apply(bind, args || arguments);
    }
  }
});

LSD.Module.Events.addEvents.call(LSD.Module.Events.prototype, {
  register: function(name, object) {
    var events = this.events && this.events[name];
    if (events) Events.setStoredEvents.call(object, events, true, this);
  },
  unregister: function(name, object) {
    var events = this.events && this.events[name];
    if (events) Events.setStoredEvents.call(object, events, false, this);
  }
});

/*
  Inject generic methods into the module prototype
*/
['addEvent',  'addEvents', 'removeEvent', 'removeEvents', 
 'fireEvent', 'captureEvent', 'dispatchEvent',
 'bindEvent', 'bindEvents'].each(function(method) {
  Events.implement(method, Events[method]);
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
  self: function() { 
    return this
  },
  window: function() {
    return window;
  },
  mobile: function() {
    return this;
  },
  element: {
    getter: 'element',
    registers: true,
    events: {
      attach: true,
      detach: false
    }
  },
  document: {
    getter: 'document',
    registers: true,
    events: {
      setDocument: true,
      unsetDocument: false
    }
  },
  parent: {
    getter: 'parentNode',
    registers: true,
    events: {
      setParent: true,
      unsetParent: false
    }
  },
  root: {
    getter: 'root',
    registers: true,
    events: {
      setRoot: true,
      unsetRoot: false
    }
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
        return positive ^ this[state && state.property || name]
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
  var category = this.prototype.$events || (this.prototype.$events = {});
  for (name in events) {
    var type = category[name] || (category[name] = []);
    type.push.apply(type, events[name]);
  }
};

Class.Mutators.events = function(events) {
  var category = this.prototype.events || (this.prototype.events = {});
  for (label in events) {
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