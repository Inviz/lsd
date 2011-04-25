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
      this.options.proxies[name] = {
        container: function(callback) {
          proxied.push(callback)
        },
        condition: relation.proxy
      }
    }
    if (relation.relay) {
      var relayed = {};
      Object.each(relation.relay, function(callback, type) {
        relayed[type] = function(event) {
          for (var widget = Element.get(event.target, 'widget'); widget; widget = widget.parentNode) {
            if (origin[name].indexOf(widget) > -1) {
              callback.apply(widget, arguments);
              break;
            }
          }
        }
      });
    }
    if (relation.transform) this.addLayoutTransformation(relation.transform, relation.layout);
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
          if (relayed && (origin[name].length == (state ? 1 : 0))) origin.element[state ? 'addEvents' : 'removeEvents'](relayed);
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
        for (var label in relation.chain) {
          if (state) widget.options.chain[label] = relation.chain[label]
          else delete widget.options.chain[label]
        }
      }
    };
    this.watch(relation.selector, relation.watcher);
  },
  
  removeRelation: function(relation) {
    
  }
});