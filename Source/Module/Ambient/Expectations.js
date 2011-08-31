/*
---
 
script: Expectations.js
 
description: A trait that allows to wait for related \s until they are ready
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Module.Events
  - LSD.Module.Attributes
  - LSD.Module.Properties

provides: 
  - LSD.Module.Expectations
 
...
*/

!function() {
  
var Expectations = LSD.Module.Expectations = new Class({
  
  constructors: {
    expectations: function() {
      if (!this.expectations) this.expectations = {}
      else this.expectations = Object.clone(this.expectations)
      var self = this;
      this.properties.addEvent('change', function(name, value, state, old) {
        if (value && value.lsd) Expectations.relate(self, name, value, state);
        var property = Expectations.Properties[name];
        if (property) property.call(self, value, state);
      }).addEvent('beforechange', function(name, value, state) {
        if (value.lsd) Expectations.relate(self, name, value, state);
        var property = Expectations.Properties[name];
        if (property) property.call(self, value, state);
      })
    }
  },
  
  getElementsByTagName: function(tag) {
    return (this.expectations.tag && this.expectations.tag[LSD.toLowerCase(tag)]) || [];
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
    related to it, thus matching static part of a selector
    - tag name and combinator. 
    
    It's only a matter of matching a dynamic part then. 
    - classes, pseudos and attributes.
  */
  expect: function(selector, callback, self) {
    if (selector.indexOf) selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (!this.expectations) this.expectations = {};
    var id = selector.id, combinator = selector.combinator;
    switch (combinator) {
      case '&':
        self = true;
        break;
      case '&&':
        return Expectations.setRootExpectation.call(this, selector, callback, true);
    }
    var index = self ? 'self' : (combinator == ' ' && id) ? 'id' : combinator || 'self'; 
    var expectations = this.expectations[index];
    if (!expectations) expectations = this.expectations[index] = {};
    if (selector.combinator && !self) {
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
      if (this.document && this.document.documentElement) this.getElements(selector.structure).each(function(widget) {
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
      if (this.tagName && this.match(selector)) callback(this, true);
    }
  },
  
  unexpect: function(selector, callback, self, iterator) {
    if (selector.indexOf) selector = Slick.parse(selector);
    if (selector.expressions) selector = selector.expressions[0][0];
    if (iterator === true) iterator = function(widget) {
      if (widget.match(selector)) callback(widget, false);
    };
    var id = selector.id, combinator = selector.combinator;
    switch (combinator) {
      case '&':
        self = true;
        break;
      case '&&':
        return Expectations.setRootExpectation.call(this, selector, callback, false);
    }
    if (combinator && !self) {
      var id = selector.id;
      var index = (combinator == ' ' && id) ? 'id' : combinator;
      remove(this.expectations[index][index == 'id' ? id : selector.tag], callback);
      if (this.document) {
        if (!selector.structure) {
          var separated = separate(selector);
          selector.structure = { Slick: true, expressions: [[separated.structure]] }
          if (separated.state) selector.state = separated.state;
        }
        this.getElements(selector.structure).each(function(widget) {
          if (selector.state) widget.unexpect(selector.state, callback);
          if (iterator) iterator(widget)
        });
      }
    } else {
      if (iterator) iterator(this);
      for (var types = ['pseudos', 'classes', 'attributes'], type, i = 0; type = types[i++];) {
        var bits = selector[type], group = this.expectations.self[type];
        if (bits) for (var j = 0, bit; bit = bits[j++];) remove(group[bit.key || bit.value], callback);
      }
    }
  },
  
  watch: function(selector, callback, depth) {
    if (selector.indexOf) selector = Slick.parse(selector);
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
    if (selector.indexOf) selector = Slick.parse(selector);
    if (!depth) depth = 0;
    selector.expressions.each(function(expressions) {
      this.unexpect(expressions[depth], callback, false, function(widget) {
        if (expressions[depth + 1]) widget.unwatch(selector, callback, depth + 1)
        else callback(widget, false)
      });
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
            if (!unresolved) callback.apply(this, widgets.concat(state));
          }
        } else {
          if (widgets[i]) {
            if (!unresolved) callback.apply(this, widgets.concat(state));
            delete widgets[i];
            unresolved++;
          }
        }
      }
      this.watch(selector, watcher);
    }, this);
  }
});

Expectations.setRootExpectation = function(exp, callback, state) {
  if (state) {
    var finder = function(widget, state) {
      Expectations.advanceRootExpectation(exp, widget, callback, state);
    };
    finder.callback = callback;
    return this.expect('::root', finder);
  } else {
    return this.unexpect('::root', callback, null, function(widget) {
      Expectations.advanceRootExpectation(exp, widget, callback, false);
    });
  }
};

Expectations.advanceRootExpectation = function(exp, widget, callback, state) {
  if (exp.tag == '*' && !exp.classes && !exp.attributes && !exp.id) {
    if (state) widget.expect({combinator: ' ', pseudos: exp.pseudos}, callback, true);
    else widget.unexpect({combinator: ' ', pseudos: exp.pseudos}, callback, true, function(widget) {
      callback(widget, false);
    })
  } else {  
    var expression = {combinator: ' ', tag: exp.tag, classes: exp.classes, pseudos: exp.pseudos, attributes: exp.attributes, id: exp.id};
    widget[state ? 'expect' : 'unexpect'](expression, callback, null, callback);
  }
};

Expectations.relate = function(object, name, subject, state) {
  if (state) {
    var expectations = subject.expectations;
    if (expectations) {
      var type = expectations['!::'];
      if (!type) type = expectations['!::'] = {};
      var group = type[name];
      if (!group) group = type[name] = [];
      group.push(object);
      notify.call(object, '::', name, true, subject);
    }
  } else {
    var expectations = subject.expectations;
    if (expectations) {
      notify.call(object, '::', name, false, subject);
      subject.expectations['!::'][name].erase(object);
    }
  }
};


var check = function(type, value, state, target) {
  for (var expectations = this.expectations; expectations;) {
    var subject = target, group = expectations;
    if (!subject) {
      group = group.self;
      subject = this;
    }
    group = group && group[type] && group[type][value];
    if (group) for (var i = 0, expectation; expectation = group[i++];) {
      var selector = expectation[0];
      if (selector.structure && selector.state) {
        if (subject.match(selector.structure)) {
          if (!state) {
            if (subject.match(selector.state)) {
              subject.unexpect(selector.state, expectation[1]);
              expectation[1](subject, !!state)
            }
          } else subject.expect(selector.state, expectation[1])
        }
      } else if (subject.match(selector)) expectation[1](subject, !!state)
    }
    if (expectations == this.expectations) expectations = Expectations.Default;
    else break;
  }
};

var notify = function(type, tag, state, widget, single) {
  check.call(this, type, tag, state, widget);
  if (!single) check.call(this, type, '*', state, widget);
};

var update = function(widget, tag, state, single) {
  notify.call(this, ' ', tag, state, widget, single);
  var options = widget.options, id = widget.id;
  if (id) check.call(this, 'id', id, state, widget);
  if (this.previousSibling) {
    notify.call(this.previousSibling, '!+', widget.tagName, state, widget, single);
    notify.call(this.previousSibling, '++', widget.tagName, state, widget, single);
    for (var sibling = this; sibling = sibling.previousSibling;) {
      notify.call(sibling, '!~', tag, state, widget, single);
      notify.call(sibling, '~~', tag, state, widget, single);
    }
  }
  if (this.nextSibling) {
    notify.call(this.nextSibling, '+',  tag, state, widget, single);
    notify.call(this.nextSibling, '++', tag, state, widget, single);
    for (var sibling = this; sibling = sibling.nextSibling;) {
      notify.call(sibling, '~',  tag, state, widget, single);
      notify.call(sibling, '~~', tag, state, widget, single);
    }
  }
  if (widget.parentNode == this) notify.call(this, '>', widget.tagName, state, widget, single);
}

var remove = function(array, callback) {
  if (array) for (var i = array.length; i--;) {
    var fn = array[i][1]; 
    if (fn == callback || fn.callback == callback) {
      array.splice(i, 1);
      break;
    }
  }
};

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
};

Expectations.events = {
  selectorChange: check,
  nodeInserted: function(widget) {
    var expectations = this.expectations, type = expectations.tag, tag = widget.tagName;
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
    var expectations = this.expectations, type = expectations.tag, tag = widget.tagName;
    if (tag) type[tag].erase(widget);
    type['*'].erase(widget);
    update.call(this, widget, tag, false);
  },
  nodeTagChanged: function(widget, tag, old) {
    var expectations = this.expectations, type = expectations.tag;
    var index = type[old].indexOf(widget);
    if (index == -1) return;
    type[old].splice(index, 1);
    update.call(this, widget, old, false);
    if (!tag) return;
    var group = type[tag];
    if (!group) group = type[tag] = [];
    group.push(widget);
    update.call(this, widget, tag, true);
  },
  tagChanged: function(tag, old) {
    check.call(this, 'tag', old, false);
    if (tag) check.call(this, 'tag', tag, true);
    if (old && this.parentNode && !this.removed) this.parentNode.dispatchEvent('nodeTagChanged', [this, tag, old]);
  }
};

Expectations.Properties = {
  parent: function(value, state, old, memo) {
    notify.call(this, '!>', value.tagName, false, value);
    for (var parent = value; parent; parent = parent.parentNode) notify.call(this, '!', parent.tagName, state, parent);
  }
};

LSD.Module.Events.addEvents.call(Expectations.prototype, Expectations.events);

LSD.Module.Events.Targets.expected = function() {
  var self = this, Targets = LSD.Module.Events.Targets;
  return {
    addEvent: function(key, value) {
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
    },
    removeEvent: function(key, event) {
      self.unwatch(key, self.watchers[key]);
    }
  }
};

LSD.Options.expects = {
  add: function(selector, callback) {
    this.expect(selector, callback, true);
  },
  remove: function(callback) {
    this.unexpect(selector, callback, true);
  },
  iterate: true,
  process: 'bind'
};

LSD.Options.watches = Object.append({}, LSD.Options.expects, {
  add: function(selector, callback) {
    this.watch(selector, callback);
  },
  remove: function(callback) {
    this.watch(selector, callback);
  }
});

}();