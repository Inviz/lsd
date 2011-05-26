/*
---
 
script: Relation.js
 
description: An unsettable relation that dispatches options to specific widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD

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
  if (options) {
    if (options.target) this.memo.target = Options.target.call(this, options.target, true);
    this.setOptions(options);
  }
}

LSD.Relation.prototype = Object.append({
  
  setOptions: function(options, unset) {
    this.$options[unset ? 'erase' : 'include'](options);
    this.options = Object.merge.apply(Object, [{}].concat(this.$options));
    for (name in options) {
      var setter = Options[name], value = options[name];
      if (!setter || !setter.call) 
        for (var i = 0, widget; widget = this.widgets[i++];) 
          this.applyOption(widget, name, value, unset, setter);
      else this.memo[name] = setter.call(this, value, !unset, this.memo[name]);
    }
  },
  
  applyOption: function(widget, name, value, unset, setter) {
    if (setter) {
      if (!setter.call) {
        if (setter.process) {
          if (setter.process.call) value = setter.process.call(this, value);
          else value = widget[setter.process](value);
        }
        var method = setter[unset ? 'remove' : 'add'];
        if (setter.iterate) {
          if (value.each) {
            var length = value.length;
            if (length != null) for (var i = 0, j = value.length; i < j; i++) method.call(this.origin, this, value[i]);
            else value.each(method, widget);
          } else for (var i in value) method.call(this.origin, widget, i, value[i])
        } else method.call(this.origin, widget, value);
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
    if (widget == this) return;
    this.add(widget);
    this.applyOptions(widget);
    this.fireEvent('add', widget);
    this.origin.fireEvent('relate', [widget, this.name]);
  },
  
  onLose: function(widget) {
    if (widget == this) return;
    this.origin.fireEvent('unrelate', [widget, this.name]);
    this.fireEvent('remove', widget);
    this.remove(widget);
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
      if (this.widgets.erase(widget).length) return;
    } else {
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
  }
}, Events.prototype);

var Options = LSD.Relation.Options = {
  selector: function(selector, state, memo) {
    if (memo) memo[0].unwatch(memo[1], this.onChange);
    if (state && this.target) {
      if (selector.call) selector = selector.call(this.origin);
      this.target.watch(selector, this.onChange);
      return [this.target, selector];
    }
  },
  
  expectation: function(expectation, state, memo) {
    if (memo) memo[0].unexpect(memo[1], this.onChange);
    if (state && this.target) {
      if (expectation.call && !(expectation = expectation.call(this.origin))) return;
      this.target.expect(expectation, this.onChange);
      return [this.target, expectation];
    }
  },
  
  target: function(target, state, memo) {
    if (this.targeted == target) return;
    this.targeted = target;
    if (memo) this.origin.removeEvents(memo);
    var setting = Targets[target];
    if (setting) {
      var relation = this, events = Object.map(setting.events, function(value, event) {
        return function(object) {
          if (value) {
            relation.target = object.nodeType == 9 ? object.body : object;
            var selector = relation.options.selector, expectation = relation.options.expectation;
            if (selector) Options.selector.call(relation, selector, true, relation.memo.selector);
            if (expectation) Options.expectation.call(relation, expectation, true, relation.memo.expectation);
          }
        }
      })
      this.origin.addEvents(events);
      if (setting.getter && !this.target) this.target = this.origin[setting.getter];
      return events;
    } else {
      if (this.origin[target]) this.target = this.origin[target];
    }
  },
  
  mutation: function(mutation, state, memo) {
    if (memo) this.origin.removeMutation(mutation, memo);
    if (state) {
      if (this.origin.parentNode || (this.origin.document && !this.origin.document.building)) {
        this.origin.toElement().getElements(mutation).each(function(element) {
          var mutated = this.origin.context.use(element, {source: this.options.source}, this.origin)
          if (mutated) mutated.inject(this.origin);
        }, this)
      }
      this.origin.addMutation(mutation, this.options.source);
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
      var origin = this.origin, relay = Object.map(function(callback, event) {
        return function() {
          for (var widget = Element.get(event.target, 'widget'); widget; widget = widget.parentNode) {
            if (origin[name].indexOf(widget) > -1) {
              callback.apply(widget, arguments);
              break;
            }
          }
        };
      });
      var events = {
        fill: function() {
          origin.addEvent('element', relay)
        },
        empty: function() {
          origin.removeEvent('element', relay)
        }
      };
      this.addEvents(events);
      if (!this.empty) events.fill();
      return events;
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
    this[state ? 'addEvents' : 'removeEvents'](this.origin.bindEvents(events))
  },
  
  through: function(name, state, memo) {
    return LSD.Relation.Options.selector.call(this, '::' + name + '::' + (this.options.as || this.name), state, memo)
  },
  
  states: {
    add: function(widget, states) {
      var get = states.get, set = states.set, add = states.add;
      if (get) for (var from in get) widget.linkState(this, from, (get[from] === true) ? from : get[from]);
      if (set) for (var to in set) this.linkState(widget, to, (set[to] === true) ? to : set[to]);
      if (add) for (var index in add) widget.addState(index, add[index]);
    },
    remove: function(widget, states) {
      var get = states.get, set = states.set, add = states.add;
      if (get) for (var from in get) widget.unlinkState(origin, from, (get[from] === true) ? from : get[from]);
      if (set) for (var to in set) origin.unlinkState(widget, to, (set[to] === true) ? to : set[to]);
      if (add) for (var index in add) widget.removeState(index, add[index]);
    }
  },
  
  alias: {
    add: function(widget, name) {
      widget[name] = this;
    },
    remove: function(widget, name) {
      if (widget[name] == this) delete widget[name];
    }
  },
  
  collection: {
    add: function(widget, name) {
      (widget[name] || (widget[name] = [])).push(this);
    },
    remove: function(widget, name) {
      widget[name].erase(this);
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
      return this.origin.bindEvents(events);
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
  }
};

Options.has = Object.append({
  process: function(has) {
    var one = has.one, many = has.many, relations = {};
    if (one) for (var name in one) relations[name] = one[name];
    if (many) for (var name in many) relations[name] = Object.append(many[name], {multiple: true});
    return relations;
  }
}, Options.relations);

var Targets = LSD.Relation.Targets = {
  document: {
    getter: 'document',
    events: {
      setDocument: true,
      unsetDocument: true
    }
  },
  parent: {
    getter: 'parentNode',
    events: {
      setDocument: true,
      unsetDocument: true
    }
  },
  root: {
    getter: 'root',
    events: {
      setRoot: true,
      unsetRoot: true
    }
  }
};
}();