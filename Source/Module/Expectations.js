/*
---
 
script: Expectations.js
 
description: A trait that allows to wait for related widgets until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Module.Attributes

provides: 
  - LSD.Module.Expectations
 
...
*/

!function() {
  
var Expectations = LSD.Module.Expectations = new Class({
  options: {
    has: {
      one: null,
      many: null
    }
  },
  
  initialize: function() {
    this.expectations = {};
    this.addEvents({
      nodeInserted: function(widget) {
        var expectations = this.expectations, type = expectations.tag, tag = widget.options.tag;
        if (!type) type = expectations.tag = {};
        var group = type[tag];
        if (!group) group = type[tag] = [];
        group.push(widget);
        group = type['*'];
        if (!group) group = type['*'] = [];
        group.push(widget);
        update.call(this, widget, tag, true);
      },
      nodeRemoved: function(widget) {
        var expectations = this.expectations, type = expectations.tag, tag = widget.options.tag;
        type[tag].erase(this);
        type["*"].erase(this);
        update.call(this, widget, tag, false);
      }
    }, true);
    this.parent.apply(this, arguments);
    var has = this.options.has, one = has.one, many = has.many;
    if (one) for (var name in one) {
      var value = one[name];
      if (value.indexOf) value = {selector: value}
      value.name = name;
      this.addRelation(value);
    }
    if (many) for (var name in many) {
      var value = many[name];
      if (value.indexOf) value = {selector: value}
      value.name = name;
      value.multiple = true;
      this.addRelation(value);
    }
  },
  
  getElementsByTagName: function(tag) {
    var cache = this.expectations.tag;
    return (cache && cache[tag.toLowerCase()]) || [];
  },
    
  removeClass: function(name) {
    check(this, 'classes', name, false);
    return this.parent.apply(this, arguments);
  },
  
  addClass: function(name) {
    var result = this.parent.apply(this, arguments);
    check(this, 'classes', name, true);
    return result;
  },
  
  removePseudo: function(pseudo) {
    check(this, 'pseudos', pseudo, false);
    return this.parent.apply(this, arguments);
  },
  
  addPseudo: function(pseudo) {
    var result = this.parent.apply(this, arguments);
    check(this, 'pseudos', pseudo, true);
    return result;
  },
  
  setAttribute: function(name) {
    check(this, 'attributes', name, false);
    var result = this.parent.apply(this, arguments);
    check(this, 'attributes', name, true);
    return result;
  },
  
  removeAttribute: function(name) {
    check(this, 'attributes', name, false);
    return this.parent.apply(this, arguments);
  },
  
  match: function(selector) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (selector.tag && (selector.tag != '*') && (this.options.tag != selector.tag)) return false;
    if (selector.id && (this.options.id != selector.id)) return false;
    if (selector.attributes) for (var i = 0, j; j = selector.attributes[i]; i++) 
      if (j.operator ? !j.test(this.attributes[j.key] && this.attributes[j.key].toString()) : !(j.key in this.attributes)) return false;
    if (selector.classes) for (var i = 0, j; j = selector.classes[i]; i++) if (!this.classes[j.value]) return false;
    if (selector.pseudos) {
      for (var i = 0, j; j = selector.pseudos[i]; i++) {
        var name = j.key;
        if (this.pseudos[name]) continue;
        var pseudo = pseudos[name];
        if (pseudo == null) pseudos[name] = pseudo = Slick.lookupPseudo(name) || false;
        if (pseudo === false || (pseudo && !pseudo.call(this, this, j.value))) return false;
      }
    }
    return true;
  },
  
  /*
    Expect processes a single step in a complex selector.
    
    Each of those bits (e.g. strong.important) consists 
    pieces that can not be cnahged in runtime (tagname)
    and other dynamic parts (classes, pseudos, attributes).
    
    The idea is to split the selector bit to static and dynamic
    parts. The widget that is *expect*ing the selector, groups
    his expectations by tag name. Every node inserted into
    that element or its children will pick up expectations
    related to it, thus matching static part of a selector.
    Then it's time to match the dynamic part. 
  */
  expect: function(selector, callback) {
    var combinator = selector.combinator || 'self';
    var id = selector.id;
    var index = (combinator == ' ' && id) ? 'id' : combinator; 
    expectations = this.expectations[index];
    if (!expectations) expectations = this.expectations[index] = {};
    if (selector.combinator) {
      /*
        Given selector has combinator.
        Finds related elements and passes expectations to them.
      */
      if (!selector.structure) {
        var separated = separate(selector);
        selector.structure = { Slick: true, expressions: [[separated.structure]] }
        if (separated.state) selector.state = separated.state;
      }
      var key = (index == 'id') ? id : selector.tag;
      var group = expectations[key];
      if (!group) group = expectations[key] = [];
      group.push([selector, callback]);
      var state = selector.state;
      if (this.document) this.getElements(selector.structure).each(function(widget) {
        if (state) widget.expect(state, callback);
        else callback(widget, true);
      });
    } else {
      /*
        Selector without combinator,
        depends on state of current widget.
      */
      for (var types = ['pseudos', 'classes', 'attributes'], type, i = 0; type = types[i++];) {
        var values = selector[type];
        if (values) values: for (var j = 0, value; (value = values[j++]) && (value = value.key || value.value);) {
          var kind = expectations[type];
          if (!kind) kind = expectations[type] = {};
          var group = kind[value];
          if (!group) group = kind[value] = [];
          for (var k = group.length, expectation; expectation = group[--k];) if (expectation[0] == selector) continue values;
          group.push([selector, callback]);
        }
      }
      if (this.match(selector)) callback(this, true);
    }
  },
  
  unexpect: function(selector, callback, iterator) {
    if (selector.expressions) selector = selector.expressions[0][0];
    if (selector.combinator) {
      remove(this.expectations[selector.combinator][selector.tag], callback);
      if (!selector.state) return;
      this.getElements(selector.structure).each(function(widget) {
        widget.unexpect(selector.state, callback);
        if (iterator) iterator(widget)
      });
    } else {
      if (iterator) iterator(widget)
      for (var types = ['pseudos', 'classes', 'attributes'], type, i = 0; type = types[i++];) {
        var values = selector[type], self = this.expectations.self;
        if (values) for (var j = 0, value; (value = values[j++]) && (value = value.key || value.value);) {
          remove(self[type][value], callback);
        }
      }
    }
  },
  
  watch: function(selector, callback, depth) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (!depth) depth = 0;
    selector.expressions.each(function(expressions) {
      var watcher = function(widget, state) {
        if (expressions[depth + 1]) widget[state ? 'watch' : 'unwatch'](selector, callback, depth + 1)
        else callback(widget, state)
      };
      watcher.callback = callback;
      this.expect(expressions[depth], watcher);
    }, this);
  },
  
  unwatch: function(selector, callback, depth) {
    if (typeof selector == 'string') selector = Slick.parse(selector);
    if (!depth) depth = 0;
    selector.expressions.each(function(expressions) {
      this.unexpect(expressions[depth], callback, function(widget) {
        if (expressions[depth + 1]) widget.unwatch(selector, callback, depth + 1)
        else callback(widget, false)
      })
    }, this);
  },
  
  use: function() {
    var selectors = Array.flatten(arguments);
    var widgets = []
    var callback = selectors.pop();
    var unresolved = selectors.length;
    selectors.each(function(selector, i) {
      var watcher = function(widget, state) {
        if (state) {
          if (!widgets[i]) {
            widgets[i] = widget;
            unresolved--;
            if (!unresolved) callback.apply(this, widgets.concat(state))
          }
        } else {
          if (widgets[i]) {
            if (!unresolved) callback.apply(this, widgets.concat(state))
            delete widgets[i];
            unresolved++;
          }
        }
      }
      this.watch(selector, watcher)
    }, this)
  },
  
  linkState: function(subject, from, to, state) {
    var first = this.options.states[from];
    var second = subject.options.states[to];
    var events = {};
    events[first.enabler] = second.enabler;
    events[first.disabler] = second.disabler;
    this[state === false ? 'removeEvents' : 'addEvents'](subject.bindEvents(events));
    if (this[from]) subject[second.enabler]();
  },
  
  unlinkState: function(subject, from, to) {
    return this.linkState(subject, from, to, false)
  },
  
  addRelation: function(relation, callback) {
    if (relation.indexOf) relation = {selector: relation};
    var states = relation.states, name = relation.name, origin = relation.origin || this,
        events = relation.events, multiple = relation.multiple, chain = relation.chain, callbacks = relation.callbacks;

    if (name && multiple) origin[name] = [];
    if (callbacks) {
      callbacks = origin.bindEvents(callbacks);
      var onAdd = callbacks.add, onRemove = callbacks.remove;
    }
    if (events) events = origin.bindEvents(events);
    this.watch(relation.selector, function(widget, state) {
      if (events) widget[state ? 'addEvents' : 'removeEvents'](events);
      if (callback) callback.call(origin, widget, state);
      if (!state && onRemove) onRemove.call(origin, widget, state);
      if (name) {
        if (multiple) {
          if (state) origin[name].push(widget)
          else origin[name].erase(widget);
        } else {
          if (state) origin[name] = widget;
          else delete origin[name];
        }
      }
      if (state && onAdd) onAdd.call(origin, widget, state);
      if (states) {
        var get = states.get, set = states.set, method = state ? 'linkState' : 'unlinkState';
        if (get) for (var from in get) widget[method](origin, from, (get[from] === true) ? from : get[from]);
        if (set) for (var to in set) origin[method](widget, to, (set[to] === true) ? to : set[to]);
      }
      if (chain) {
        for (var label in chain) {
          if (state) widget.options.chain[label] = chain[label]
          else delete widget.options.chain[label]
        }
      }
    });
  }
  
});

var pseudos = {};
var check = function(widget, type, value, state, target) {
  var expectations = widget.expectations
  if (!target) {
    expectations = expectations.self;
    target = widget;
  }
  expectations = expectations && expectations[type] && expectations[type][value];
  if (expectations) for (var i = 0, expectation; expectation = expectations[i++];) {
    var selector = expectation[0];
    if (selector.structure && selector.state) {
      if (target.match(selector.structure)) target.expect(selector.state, expectation[1])
    } else if (target.match(selector)) expectation[1](target, !!state)
  }
}

var notify = function(widget, type, tag, state, target) {
  check(widget, type, tag, state, target)
  check(widget, type, "*", state, target)
}

var update = function(widget, tag, state) {
  notify(this, ' ', tag, state, widget);
  var options = widget.options, id = options.id;
  if (id) check(this, 'id', id, state, widget);
  if (this.previousSibling) {
    notify(this.previousSibling, '!+', options.tag, state, widget);
    notify(this.previousSibling, '++', options.tag, state, widget);
    for (var sibling = this; sibling = sibling.previousSibling;) {
      notify(sibling, '!~', tag, state, widget);
      notify(sibling, '~~', tag, state, widget);
    }
  }
  if (this.nextSibling) {
    notify(this.nextSibling, '+',  tag, state, widget);
    notify(this.nextSibling, '++', tag, state, widget);
    for (var sibling = this; sibling = sibling.nextSibling;) {
      notify(sibling, '~',  tag, state, widget);
      notify(sibling, '~~', tag, state, widget);
    }
  }
  if (widget.parentNode == this) notify(this, '>', options.tag, state, widget);
}

var remove = function(array, callback) {
  if (array) for (var i = array.length; i--;) {
    var fn = array[i][1]; 
    if (fn == callback || fn.callback == callback) array.splice(i, 1);
  }
}

var separate = function(selector) {
  if (selector.state || selector.structure) return selector
  var separated = {};
  for (var criteria in selector) {
    switch (criteria) {
      case 'tag': case 'combinator': case 'id':
        var type = 'structure';
        break;
      default:
        var type = 'state';
    }
    var group = separated[type];
    if (!group) group = separated[type] = {};
    group[criteria] = selector[criteria]
  };
  return separated;
}

Expectations.behaviours = {};
Expectations.behave = function(selector, events) {
  Expectations.behaviours[selector] = function(widget, state) {
    var behaviours = widget.expectations.behaviours;
    if (!behaviours) behaviours = widget.expectations.behaviours = {};
    var behaviour = behaviours[selector];
    if (!behaviour) behaviour = behaviours[selector] = widget.bindEvents(events);
    widget[state ? 'addEvents' : 'removeEvents'](behaviour);
  };
}

Expectations.attach = function(document) {
  for (selector in Expectations.behaviours) document.watch(selector, Expectations.behaviours[selector]);
}

LSD.Module.Events.Targets.expected = function() {
  var self = this, Targets = LSD.Module.Events.Targets;
  return {
    addEvents: function(events) {
      Object.each(events, function(value, key) {
        if (!self.watchers) self.watchers = {};
        self.watchers[key] = function(widget, state) {
          value = Object.append({}, value)
          for (var name in value) {
            if (typeof value[name] == 'object') continue;
            widget.addEvent(name, value[name]);
            delete value[name];
          }
          for (var name in value) {
            target = (Targets[name] || Targets.expected).call(widget);
            target[state ? 'addEvents' : 'removeEvents'](value);
            break;
          }
        };
        self.watch(key, self.watchers[key]);
      });
    },
    removeEvents: function(events) {
      Object.each(events, function(value, key) {
        self.unwatch(key, self.watchers[key]);
      });
    }
  }
}

var States = LSD.States.Known;
  
}();