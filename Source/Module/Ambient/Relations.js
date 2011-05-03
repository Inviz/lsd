/*
---
 
script: Relations.js
 
description: Define a widget associations
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module

provides: 
  - LSD.Module.Relations

...
*/

LSD.Module.Relations = new Class({
  addRelation: function(name, relation, callback) {
    if (!this.relations) this.relations = {};
    this.relations[name] = relation = Object.append({name: name}, relation.indexOf ? {selector: relation} : relation);
    var origin = relation.origin || this, events;
    var callbacks = relation.callbacks ? origin.bindEvents(relation.callbacks) : {}
    if (!relation.layout) relation.layout = relation.selector || name;
    if (name && relation.multiple) origin[name] = [];
    this.options.layout[name] = relation.layout;
    if (relation.proxy) this.addProxy(name, {
      container: function(object) {
        (relation.proxied || (relation.proxied = [])).push(object)
      },
      condition: relation.proxy
    });
    if (relation.relay) for (var type in relation.relay) {
      (relation.relayed || (relation.relayed = {}))[type] = function(event) {
        for (var widget = Element.get(event.target, 'widget'); widget; widget = widget.parentNode) {
          if (origin[name].indexOf(widget) > -1) {
            this.apply(widget, arguments);
            break;
          }
        }
      }.bind(relation.relay[type])
    }
    if (relation.mutation) this.addMutation(relation.mutation, relation.layout);
    relation.watcher = function(widget, state) {
      if (relation.events) {
        if (!events) events = origin.bindEvents(relation.events);
        widget[state ? 'addEvents' : 'removeEvents'](events);
      }
      if (callback) callback.call(origin, widget, state);
      if (!state && callbacks.remove) callbacks.remove.call(origin, widget);
      
      if (relation.multiple) {
        if (state)
          if (callbacks.fill && origin[name].push(widget) == 1) callbacks.fill.call(origin, widget)
        else {
          if (callbacks.empty && !origin[name].erase(widget).length) callbacks.empty.call(origin, widget)
        }
        if (relation.relayed && (origin[name].length == +state)) 
          origin.element[state ? 'addEvents' : 'removeEvents'](relation.relayed);
        origin[name].push(widget);
        if (relation.collection) (widget[relation.collection] || (widget[relation.collection] = [])).push(origin);
      } else {
        if (state) origin[name] = widget;
        else delete origin[name];
      }
      
      if (relation.collection) 
        (widget[relation.collection] || (widget[relation.collection] = []))[state ? 'include' : 'erase'](origin);
        
      if (relation.alias) widget[relation.alias] = origin;
      if (relation.proxied) relation.proxied.invoke('call', this, widget)
      if (state && callbacks.add) callbacks.add.call(origin, widget);
      if (relation.states) {
        var states = relation.states, get = states.get, set = states.set, add = states.add;
        var method = state ? 'linkState' : 'unlinkState'
        if (get) for (var from in get) widget[method](origin, from, (get[from] === true) ? from : get[from]);
        if (set) for (var to in set) origin[method](widget, to, (set[to] === true) ? to : set[to]);
        if (add) for (var index in add) widget.addState(index, add[index]);
      }
      if (relation.chain) {
        for (var label in relation.chain) widget[state ? 'addChain' : 'removeChain'](label, relation.chain[label]);
      }
    };
    var watch = function(widget, state) {
      if (relation.selector) {
        widget.watch(relation.selector, relation.watcher);
      } else if (relation.expectation) {
        var expectation = relation.expectation;
        if (expectation.call) expectation = expectation.call(origin);
        if (expectation) widget.expect(expectation, relation.watcher)
      } else {
        relation.watcher.apply(this, arguments)
      }
    }
    var target = relation.target || this;
    if (target.call) target = target.call(this);
    else if (target.indexOf) target = LSD.Module.Events.Targets[target];
    if (target) {
      if (!target.addEvent && !(target.call && (target = target.call(this)))) {
        if (target.events && !events) Object.each(target.events, function(value, event) {
          this.addEvent(event, function(object) {
            watch(object, value);
          });
        }, this);
      } else {
        watch(target, true);
      }
    }
  },
  
  removeRelation: function(relation) {
    
  }
});

LSD.Options.relations = {
  add: 'addRelation',
  remove: 'removeRelation',
  iterate: true
};

LSD.Options.has = Object.append({
  process: function(has) {
    var one = has.one, many = has.many, relations = {};
    if (one) for (var name in one) relations[name] = one[name];
    if (many) for (var name in many) relations[name] = Object.append(many[name], {multiple: true});
    return relations;
  }
}, LSD.Options.relations);
