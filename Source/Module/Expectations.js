/*
---
 
script: Expectations.js
 
description: A trait that allows to wait for related widgets until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Module.Events
  - LSD.Module.Attributes

provides: 
  - LSD.Module.Expectations
 
...
*/

(function() {

var Expectations = LSD.Module.Expectations = new Class({
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
      var states = this.options.states;
      for (var i = 0, j; j = selector.pseudos[i]; i++) {
        if (this.pseudos[j.key]) continue;
        if (j.key in this.options.states) return false;
        if (!selector.pseudo) selector.pseudo = {Slick: true, expressions: [[{combinator: ' ', tag: '*', pseudos: selector.pseudos}]]};
        if (!Slick.match(this, selector.pseudo)) return false;
        break;
      }
    }
    return true;
  },
  
  expect: function(selector, callback) {
    var combinator = selector.combinator || 'self', expectations = this.expectations[combinator];
    if (!expectations) expectations = this.expectations[combinator] = {};
    if (selector.combinator) {
      var tag = selector.tag, group = expectations[tag];
      if (!group) group = expectations[tag] = [];
      group.push([selector, callback]);
      if (!selector.structure) {
        var separated = separate(selector);
        selector.structure = { Slick: true, expressions: [[separated.structure]] }
        if (separated.state) selector.state = separated.state;
      }
      var state = selector.state;
      if (this.document) this.getElements(selector.structure).each(function(widget) {
        if (state) widget.expect(state, callback);
      });
    } else {
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
      var expression = expressions[depth];
      if (!expression.watcher) expression.watcher = function(widget, state) {
        if (expressions[depth + 1]) widget[state ? 'watch' : 'unwatch'](selector, callback, depth + 1)
        else callback(widget, state)
      }
      this.expect(expression, expression.watcher);
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
  }
  
});

var check = function(widget, type, value, state, target) {
  var expectations = widget.expectations
  if (!target) {
    expectations = expectations.self;
    target = widget;
  }
  expectations = expectations && expectations[type] && expectations[type][value];
  if (expectations) for (var i = 0, expectation; expectation = expectations[i++];) {
    var selector = expectation[0];
    if (selector.structure) {
      if (target.match(selector.structure)) target.expect(selector.state, expectation[1])
    } else if (target.match(expectation[0])) expectation[1](target, !!state)
  }
}

var notify = function(widget, type, tag, state, target) {
  check(widget, type, tag, state, target)
  check(widget, type, "*", state, target)
}

var update = function(widget, tag, state) {
  notify(this, ' ', tag, true, widget);
  if (this.previousSibling) {
    notify(this.previousSibling, '!+', widget.options.tag, state, widget);
    notify(this.previousSibling, '++', widget.options.tag, state, widget);
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
  if (widget.parentNode == this) notify(this, '>', widget.options.tag, state, widget);
}

var remove = function(array, callback) {
  if (array) for (var i = array.length; i--;) if (array[i][1] == callback) array.splice(i, 1);
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

LSD.addEvent('ready', function() {
  for (selector in Expectations.behaviours) LSD.document.watch(selector, Expectations.behaviours[selector]);
});

LSD.Module.Events.Targets.expected = function() {
  var self = this, Targets = LSD.Module.Events.Targets;
  return {
    addEvents: function(events) {
      Hash.each(events, function(value, key) {
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
      Hash.each(events, function(value, key) {
        self.unwatch(key, self.watchers[key]);
      });
    }
  }
}



})();