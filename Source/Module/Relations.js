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
  options: {
    has: {
      one: null,
      many: null
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    var has = this.options.has, one = has.one, many = has.many;
    if (one) for (var name in one) {
      var value = one[name];
      if (value.indexOf) value = {selector: value}
      this.addRelation(name, value);
    }
    if (many) for (var name in many) {
      var value = many[name];
      if (value.indexOf) value = {selector: value}
      value.multiple = true;
      this.addRelation(name, value);
    }
  },
  
  addRelation: function(name, relation, callback) {
    if (!this.$relations) this.$relations = {};
    this.$relations[name] = relation = Object.append({name: name}, relation.indexOf ? {selector: relation} : relation);
    var origin = relation.origin || this, events;
    var callbacks = relation.callbacks ? origin.bindEvents(relation.callbacks) : {}
    if (!relation.layout) relation.layout = relation.selector || name;
    if (name && relation.multiple) origin[name] = [];
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
    if (relation.transform) {
      var transformation = {};
      transformation[relation.transform] = relation.layout;
      this.addLayoutTransformations(transformation);
    }
    relation.watcher = function(widget, state) {
      if (relation.events) {
        if (!events) events = origin.bindEvents(relation.events);
        widget[state ? 'addEvents' : 'removeEvents'](events);
      }
      if (callback) callback.call(origin, widget, state);
      if (!state && callbacks.remove) callbacks.remove.call(origin, widget);
      if (name) {
        if (relation.multiple) {
          if (state) {
            if (origin[name].push(widget) == 1) if (callbacks.fill) callbacks.fill.call(origin, widget)
          } else {
            if (origin[name].erase(widget).length == 0) if (callbacks.empty) callbacks.empty.call(origin, widget)
          }
          if (relayed && (origin[name].length == (state ? 1 : 0))) origin.element[state ? 'addEvents' : 'removeEvents'](relayed);
          
        } else {
          if (state) origin[name] = widget;
          else delete origin[name];
        }
      }
      if (relation.alias) widget[relation.alias] = origin;
      if (proxied) for (var i = 0, proxy; proxy = proxied[i++];) proxy(widget);
      if (state && callbacks.add) callbacks.add.call(origin, widget);
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