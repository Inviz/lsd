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
    if (!this.$relations) this.$relations = {};
    this.$relations[name] = relation = Object.append({name: name}, relation.indexOf ? {selector: relation} : relation);
    var origin = relation.origin || this, events;
    if (!relation.layout) relation.layout = relation.selector || name;
    if (name && relation.multiple) origin[name] = [];
    if (relation.callbacks) var cb = origin.bindEvents(relation.callbacks), onAdd = cb.add, onRemove = cb.remove;
    this.options.layout[name] = relation.layout;
    if (relation.proxy) {
      var proxied = [];
      this.addProxy(name, {
        container: function(callback) {
          proxied.push(callback);
        },
        condition: relation.proxy
      });
    }
    
    if (relation.relay) {
      var relayed = {};
      for (var type in relation.relay) {
        relayed[type] = function(event) {
          for (var widget = Element.get(event.target, 'widget'); widget; widget = widget.parentNode) {
            if (origin[name].indexOf(widget) > -1) {
              this.apply(widget, arguments);
              break;
            }
          }
        }.bind(relation.relay[type])
      }
    }
    if (relation.mutation) this.addMutation(relation.mutation, relation.layout);
    relation.watcher = function(widget, state) {
      if (relation.events) {
        if (!events) events = origin.bindEvents(relation.events);
        widget[state ? 'addEvents' : 'removeEvents'](events);
      }
      if (callback) callback.call(origin, widget, state);
      if (!state && onRemove) onRemove.call(origin, widget);
      if (name) {
        if (relation.multiple) {
          if (state) origin[name].push(widget)
          else origin[name].erase(widget);
          if (relayed && (origin[name].length == +state)) origin.element[state ? 'addEvents' : 'removeEvents'](relayed);
        } else {
          if (state) origin[name] = widget;
          else delete origin[name];
        }
      }
      if (relation.alias) widget[relation.alias] = origin;
      if (proxied) for (var i = 0, proxy; proxy = proxied[i++];) proxy(widget);
      if (state && onAdd) onAdd.call(origin, widget);
      if (relation.states) {
        var states = relation.states, get = states.get, set = states.set, add = states.add, method = state ? 'linkState' : 'unlinkState';
        if (get) for (var from in get) widget[method](origin, from, (get[from] === true) ? from : get[from]);
        if (set) for (var to in set) origin[method](widget, to, (set[to] === true) ? to : set[to]);
        if (add) for (var index in add) widget.addState(index, add[index]);
      }
      if (relation.chain) {
        for (var label in relation.chain) widget[state ? 'addChain' : 'removeChain'](label, relation.chain[label]);
      }
    };
    this.watch(relation.selector, relation.watcher);
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