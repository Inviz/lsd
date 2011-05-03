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

LSD.Module.Events = new Class({
  Implements: [Events],
  
  initializers: {
    events: function() {
      this.events = {};
      return {
        events: {
          register: function(name, object) {
            var events = this.events[name];
            if (events) LSD.Module.Events.setStoredEvents.call(object, events, true);
          },
          unregister: function(name, object) {
            var events = this.events[name];
            if (events) LSD.Module.Events.setStoredEvents.call(object, events, false);
          }
        }
      }
    }
  },
  
  addEvent: function(name, fn) {
    return LSD.Module.Events.setEvent.call(this, name, fn)
  },
  
  removeEvent: function(name, fn) {
    return LSD.Module.Events.setEvent.call(this, name, fn, true)
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
    if (!this.$bound[name]) this.$bound[name] = LSD.Module.Events.bind(name, bind || this, args);
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
  }
});

Object.append(LSD.Module.Events, {
  setStoredEvents: function(events, state) {
    for (var evt in events)
      for (var i = 0, fn, group = events[evt]; fn = group[i++];)
        this[state ? 'addEvent' : 'removeEvent'](evt, fn.indexOf ? this.bindEvent(fn) : fn);
  },
  setEvent: function(name, fn, revert) {
    if (fn.indexOf) fn = this.bindEvent(fn);
    var method = revert ? 'removeEvent' : 'addEvent';
    if (fn.call) {
      return Events.prototype[method].call(this, name, fn);
    } else {
      if (name.charAt(0) == '_') {
        for (var event in fn) this[method](event, fn[event]);
        return this;
      }
      var target = LSD.Module.Events.Targets[name];
      var events = this.events[name];
      if (target) {
        if (!target.addEvent && !(target.call && (target = target.call(this)))) {
          if (target.events && !events) Object.each(target.events, function(value, event) {
            this.addEvent(event, function(object) {
              if (target.getter === false) object = this;
              LSD.Module.Events.setStoredEvents.call(object, events, value);
            });
          }, this);
          if (target.condition && target.condition.call(this)) target = this;
          else if (target.getter && this[target.getter]) target = this[target.getter];
        }
      }
      if (!events) events = this.events[name] = {};
      var bound = this.bindEvents(fn);
      if (target && target[method]) for (var event in bound) target[method](event, bound[event]);
      for (event in bound) {
        var group = (events[event] || (events[event] = []));
        if (revert) {
          var i = group.indexOf(bound[event]);
          if (i > -1) group.slice(i, 1);
        } else group.include(bound[event])
      }
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
        else LSD.Module.Events.setStoredEvents.call(this, this.events[name], true);
        return true;
      case 0:
        if (events) this.removeEvents(events)
        else LSD.Module.Events.setStoredEvents.call(this, this.events[name], false);
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
                 
                 
  
  
  Advanced example:
  
  events: {
    self: {
      focus: 'onFocus'
    },
    window: {
      resize: 'onWindowResize'
    },
    parent: {
      element: { //event delegation
        'click:relay(.button)': 'onButtonClick' 
      }
    },
    expected: { 
      'button:first-child': { //waits for widgets
        parent: {}
      }
    }
  }
*/
LSD.Module.Events.Targets = {
  element: {
    getter: 'element',
    events: {
      'attach': true,
      'detach': false
    }
  },
  parent: {
    getter: 'parentNode',
    events: {
      'setParent': true,
      'unsetParent': false
    }
  },
  document: {
    getter: 'document',
    events: {
      'setDocument': true,
      'unsetDocument  ': false
    }
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

!function(Events, Known, Positive, Negative) {
  Object.each(Object.append({}, Positive, Negative), function(name, condition) {
    var events = {}, positive = !!Positive[name], state = Known[name];
    events[state[!positive ? 'enabler' : 'disabler']] = true;
    events[state[ positive ? 'enabler' : 'disabler']] = false;
    LSD.Module.Events.Targets[condition] = {
      getter: false,
      condition: function() {
        return positive ^ this[state.property || name]
      },
      events: events
    }
  });
}(LSD.Module.Events, LSD.States.Known, LSD.States.Positive, LSD.States.Negative)


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