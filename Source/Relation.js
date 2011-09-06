/*
---
 
script: Relation.js
 
description: An unsettable relation that dispatches options to specific widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD
  - LSD.Module.Events

provides: 
  - LSD.Relation
 
...
*/

!function() {
  
LSD.Relation = function(name, origin, options) {
  this.name = name;
  this.origin = origin;
  if (this.$events) this.$events = Object.clone(this.$events);
  this.onChange = this.onChange.bind(this);
  this.options = {};
  this.$options = [];
  this.memo = {};
  this.widgets = [];
  this.target = origin;
  origin.relations[name] = this;
  if (options) this.setOptions(options);
}

LSD.Relation.prototype = Object.append({
  
  setOptions: function(options, unset) {
    this.$options[unset ? 'erase' : 'include'](options);
    var opts = Object.merge.apply(Object, [{}].concat(this.$options));
    this.lastOptions = this.options;
    this.options = opts;
    if (options.target) {
      this.target = null;
      this.memo.target = Options.target.call(this, options.target, true);
    }
    for (var name in options) {
      var setter = Options[name], value = options[name];
      if (!setter || !setter.call) 
        for (var i = 0, widget; widget = this.widgets[i++];) 
          this.applyOption(widget, name, value, unset, setter);
      else this.memo[name] = setter.call(this, value, !unset, this.memo[name]);
    }
    return this;
  },
  
  applyOption: function(widget, name, value, unset, setter) {
    if (setter) {
      if (!setter.call && setter !== true) {
        if (setter.process) {
          if (setter.process.call) value = setter.process.call(this, value);
          else value = widget[setter.process](value);
        }
        var method = setter[unset ? 'remove' : 'add'];
        if (setter.iterate) {
          var length = value.length;
          if (length != null) for (var i = 0, j = value.length; i < j; i++) method.call(this, widget, value[i]);
          else for (var i in value) method.call(this, widget, i, value[i])
        } else method.call(this, widget, value);
      }
    } else {
      widget.setOption(name, value, unset);
    }
  },
  
  applyOptions: function(widget, unset) {
    for (var name in this.options)
      this.applyOption(widget, name, this.options[name], unset, Options[name]);
  },
  
  onChange: function(widget, state) {
    return this[state ? 'onFind' : 'onLose'](widget);
  },
  
  onFind: function(widget) {
    if (widget == this || (this.options.as && widget[this.options.as] && widget[this.options.as] != this.origin)) return;
    this.add(widget);
    this.applyOptions(widget);
    this.fireEvent('add', widget);
    LSD.Module.Expectations.relate(this.origin, this.name, widget, true);
  },
  
  onLose: function(widget) {
    if (widget == this || (this.options.as && widget[this.options.as] && widget[this.options.as] != this.origin)) return;
    LSD.Module.Expectations.relate(this.origin, this.name, widget, false);
    if (this.remove(widget) === false) return;
    this.fireEvent('remove', widget);
    this.applyOptions(widget, true);
  },
  
  add: function(widget) {
    if (this.options.multiple) {
      if (this.widgets.include(widget) > 1) return; 
    } else {
      this.widget = widget;
      this.widgets = [widget];
      this.origin[this.name] = widget;
    }
    delete this.empty;
    this.fireEvent('fill');
  },
  
  remove: function(widget) {
    if (this.options.multiple) {
      var index = this.widgets.indexOf(widget);
      if (index == -1) return false;
      this.widgets.splice(index, 1);
      if (this.widgets.length) return;
    } else {
      if (this.widget != widget) return false;
      delete this.widget;
      delete this.origin[this.name];
      this.widgets.splice(0, 1);
    }
    this.empty = true;
    this.fireEvent('empty');
  },
  
  proxy: function(widget) {
    if (this.widget) return this.widget.appendChild(widget);
    if (!this.proxied) {
      this.proxied = [];
      this.addEvent('fill:once', function() {
        for (var proxied; proxied = this.proxied.shift();) this.widget.appendChild(proxied);
      });
    }
    (this.proxied || (this.proxied = [])).push(widget);
  },
  
  getSource: function() {
    return this.options.source;
  }
}, Events.prototype);

var Options = LSD.Relation.Options = {
  selector: function(selector, state, memo, a) {
    if (memo) memo[0].unwatch(memo[1], this.onChange);
    if (state && this.target) {
      if (selector.call) selector = selector.call(this.origin);
      this.target.watch(selector, this.onChange);
      return [this.target, selector];
    }
  },
  
  expectation: function(expectation, state, memo) {
    if (memo) memo[0].unexpect(memo[1], this.onChange);
    if (expectation.target && (state ? !this.target : this.targeted == expectation.target))
      Options.target.call(this, expectation.target, state, this.memo.target);
    if (state && this.target) {
      if (expectation.call && !(expectation = expectation.call(this.origin))) return;
      this.target.expect(expectation, this.onChange);
      return [this.target, expectation];
    }
  },
  
  target: function(target, state, memo) {
    if (target.call) target = target.call(this.origin);
    if (this.targeted == target) return;
    this.targeted = target;
    if (memo) this.origin.properties.unwatch(target, memo);
    if (state) {
      if (Targets[target]) {
        var watcher = function(object) {
          if (object) {
            this.target = object.nodeType == 9 ? object.body : object;
            var selector = this.options.selector, expectation = this.options.expectation;
            if (selector) Options.selector.call(this, selector, true, this.memo.selector, 1);
            if (expectation) Options.expectation.call(this, expectation, true, this.memo.expectation);
          }
        }.bind(this);
        this.origin.properties.watch(target, watcher);
        return watcher;
      } else {
        if (this.origin[target]) this.target = this.origin[target];
      }
    }
  },
  
  mutation: function(mutation, state, memo) {
    if (memo) this.origin.removeMutation(mutation, memo);
    if (state) {
      this.origin.addMutation(mutation, this.getSource());
      return this.options.source;
    }
  },
  
  proxy: function(condition, state, memo) {
    if (state) {
      var proxy = memo || {container: this.proxy.bind(this)};
      proxy.condition = condition;
      if (!memo) this.origin.addProxy(this.name, proxy);
      return proxy;
    } else {
      this.origin.removeProxy(this.name, memo);
    }
  },

  relay: function(events, state, memo) {
    if (state) {
      var origin = this.origin, relation = this, relay = Object.map(events, function(callback, event) {
        return function(event) {
          for (var widget = Element.get(event.target, 'widget'); widget; widget = widget.parentNode) {
            if (relation.widgets.indexOf(widget) > -1) {
              callback.apply(widget, arguments);
              break;
            }
          }
        };
      });
      var fillers = {
        fill: function() { 
          origin.addEvent('element', relay)
        },
        empty: function() {
          origin.removeEvent('element', relay)
        }
      };
      this.addEvents(fillers);
      if (!this.empty) fillers.fill();
      return fillers;
    } else {
      this.removeEvents(memo);
      if (!this.empty) memo.empty();
    }
  },
  
  multiple: function(multiple, state, memo) {
    if (multiple) {
      this.origin[this.name] = this.widgets
    } else {
      delete this.origin[this.name];
    }
  },
  
  callbacks: function(events, state) {
    for (var name in events) {
      var event = events[name];
      event = event.indexOf ? this.origin.bind(event) : event.bind(this.origin);
      this[state ? 'addEvent' : 'removeEvent'](name, event);
    }
  },
  
  through: function(name, state, memo) {
    return LSD.Relation.Options.selector.call(this, '::' + name + '::' + (this.options.as || this.name), state, memo)
  },
  
  traits: function(traits, state, memo) {
    Object.each(traits, function(value, key) {
      var name = key || value;  
      var trait = LSD.Relation.Traits[name];
      if (!trait) LSD.warn('Can not find LSD.Relation.Traits.' + name)
      else this.setOptions(trait, !state);
    }, this);
  },
  
  origin: function(options) {
    this.origin.setOptions(options, !state)
  },
  
  scope: function(name, state, memo) {
    if (memo) {
      for (var i = 0, widget; widget = this.widgets[i++];) memo.callbacks.remove.call(this, widget);
      this.origin.removeRelation(name, memo);
    }
    if (state) {
      var self = this, relation = this.origin.relations[name], filter;
      memo = {
        callbacks: {
          add: function(widget) {
            widget.expect((filter = self.options.filter), self.onChange, true)
          },
          remove: function(widget) {
            widget.unexpect(filter, self.onChange, true, true);
          }
        }
      };
      if (relation) for (var i = 0, widget; widget = relation.widgets[i++];) memo.callbacks.add.call(this, widget);
      this.origin.addRelation(name, memo);
      return memo;
    }
  },
  
  scopes: function(scopes, state, memo) {
    for (var scope in scopes) {
      var name = LSD.Relation.getScopeName(this.name, scope), relation = scopes[scope];
      this.origin[state ? 'addRelation' : 'removeRelation'](name, relation);
      var options = {};
      if (!relation.scope) options.scope = this.name;
      if (this.options.multiple) options.multiple = true;
      this.origin[state ? 'addRelation' : 'removeRelation'](name, options);
    }
  },
  
  states: {
    add: function(widget, states) {
      var get = states.get, set = states.set, add = states.add, lnk = states.link;
      if (add) for (var index in add) widget.states.set(index);
      if (get) for (var from in get) widget.states.watch(from, [this.origin.states, get[from]]);
      if (set) for (var to in set) this.origin.states.watch(to, [widget.states, set[to]]);
      if (lnk) for (var to in lnk) widget.states.watch(to, [widget.states, lnk[to]])
    },
    remove: function(widget, states) {
      var get = states.get, set = states.set, add = states.add, lnk = states.link;
      if (add) for (var index in add) widget.states.unset(index)
      if (get) for (var from in get) widget.states.unwatch(from, [this.origin.states, get[from]]);
      if (set) for (var to in set) this.origin.states.unwatch(to, [widget.states, set[to]]);
      if (lnk) for (var to in lnk) widget.states.unwatch(to, [widget.states, lnk[to]])
    }
  },
  
  as: {
    add: function(widget, name) {
      if (!widget[name]) widget[name] = this.origin;
    },
    remove: function(widget, name) {
      if (widget[name] == this.origin) delete widget[name];
    }
  },
  
  collection: {
    add: function(widget, name) {
      (widget[name] || (widget[name] = [])).push(this.origin);
    },
    remove: function(widget, name) {
      widget[name].erase(this.origin);
    }
  },
  
  events: {
    add: function(widget, events) {
      widget.addEvents(events);
    },
    remove: function(widget, events) {
      widget.removeEvents(events);
    },
    process: function(events) {
      return this.origin.bind(events);
    }
  },
  
  relations: {
    add: function(widget, name, relation) {
      widget.addRelation(name, relation);
    },
    remove: function(widget, name, relation) {
      widget.removeRelation(name, relation);
    },
    iterate: true
  },
  
  options: {
    add: function(widget, options) {
      widget.setOptions(options.call ? options.call(this.origin) : options);
    },
    remove: function(widget, options) {
      widget.setOptions(options.call ? options.call(this.origin) : options, true);
    }
  },
  
  filter: true
};

LSD.Relation.getScopeName = function(scoped) {
  return function(relation, scope, multiple) {
    var key = Array.prototype.join.call(arguments);
    return (scoped[key] || (scoped[key] = (scope + LSD.capitalize(relation))))
  }
}({});

Options.has = Object.append({
  process: function(has) {
    var one = has.one, many = has.many, relations = {};
    if (one) for (var name in one) relations[name] = one[name];
    if (many) for (var name in many) relations[name] = Object.append(many[name], {multiple: true});
    return relations;
  }
}, Options.relations);

var Traits = LSD.Relation.Traits = {};
var Targets = LSD.Module.Events.Targets;
}();