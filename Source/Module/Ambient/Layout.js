/*
---
 
script: Expression.js
 
description: Adds layout capabilities to widget (parse and render widget trees from objects)
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin
 
requires:
  - LSD.Module
  - LSD.Layout

provides: 
  - LSD.Module.Layout
 
...
*/
  
LSD.Module.Layout = new Class({
  options: {
    traverse: true,
    extract: true
  },
  
  initializers: {
    layout: function(options) {
      this.rendered = {};
    }
  },
  
  mutateLayout: function(element) {
    var query = {element: element, parent: this};
    this.dispatchEvent('mutateLayout', query);
    if (query.mutation) return query.mutation;
  },
  
  onMutateLayout: function(query) {
    var element = query.element;
    var mutations = (this.mutations[LSD.toLowerCase(element.tagName)] || []).concat(this.mutations['*'] || []);
    for (var i = 0, mutation; mutation = mutations[i++];) {
      if (Slick.match(element, mutation[0], this.element)) query.mutation = mutation[1];
    }
  },
  
  addMutation: function(selector, mutation) {
    if (!this.$register) this.$register = {};
    if (!this.$register.mutations) {
      this.addEvent('mutateLayout', this.onMutateLayout);
      this.$register.mutations = 1;
    } else this.$register.mutations++;
    if (!this.mutations) this.mutations = {};
    selector.split(/\s*,\s*/).each(function(bit) {
      var parsed = Slick.parse(bit);
      var tag = parsed.expressions[0].getLast().tag;
      var group = this.mutations[tag];
      if (!group) group = this.mutations[tag] = [];
      group.push([parsed, mutation]);
    }, this)
  },
  
  removeMutation: function(selector, mutation) {
    if (!(--this.$register.mutations)) this.removeEvent(mutateLayout, this.onMutateLayout);
    selector.split(/\s*,\s*/).each(function(bit) {
      var parsed = Slick.parse(bit);
      var tag = parsed.expressions[0].getLast().tag;
      var group = this.mutations[tag];
      for (var i = 0, mutation; mutation = group[i]; i++)
        if (group[0] == parsed && parsed[1] == mutation) group.splice(i--, 1);
    }, this)
  },
  
  setLayout: function(layout) {
    if (typeOf(layout) == 'layout') this.layout = this;
    else this.options.layout = layout;
  },
  
  unsetLayout: function(layout) {
    if (this.layout == layout) delete this.layout;
    else delete this.options.layout;
  },
  
  getLayout: Macro.getter('layout', function() {
    var options = { interpolate: this.options.interpolate };
    if (this.options.context) options.context = this.options.context;
    return new LSD.Layout(this, null, options);
  }),
  
  buildLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, (parent === false || parent) ? parent : this, null, options);
  },
  
  extractLayout: function(element) {
    this.extracted = LSD.Layout.extract(element);
    if (this.tagName || this.options.source) delete this.extracted.tag;
    this.setOptions(this.extracted);
    this.fireEvent('extractLayout', [this.extracted, element])
  }
});

LSD.Module.Layout.events = {
  /*
    Extracts and sets layout options from attached element
  */
  attach: function(element) {
    if (!this.extracted && this.options.extract) 
      this.extractLayout(element);
  },
  /*
    Unsets options previously extracted from the detached element
  */
  detach: function() {
    if (!this.extracted) return;
    this.unsetOptions(this.extracted);
    delete this.extracted, delete this.origin;
  },
  /*
    Mutates element and extract options off it.
  */
  beforeBuild: function(query) {
    if (!query.element) return;
    if (this.options.extract || this.options.clone) this.extractLayout(query.element);
    var tag = this.getElementTag(true);
    if (this.options.clone || (tag && LSD.toLowerCase(query.element.tagName) != tag)) {
      this.origin = query.element;
      query.convert = false;
    }
  },
  /*
    Builds children after element is built
  */
  build: function() {
    if (this.getLayout().origin == this && this.options.traverse !== false) {
      if (this.origin && !this.options.clone) this.element.replaces(this.origin);
      var nodes = LSD.slice((this.origin || this.element).childNodes);
      this.getLayout().render(nodes, [this.element, this], this.options.clone ? 'clone' : null);
    }
    if (this.options.layout) this.buildLayout(this.options.layout);
  },
  /*
    Augments all parsed HTML that goes through standart .write() interface
  */
  write: function() {
    this.buildLayout.apply(this, arguments);
  },
  /*
    Augments all inserted nodes that come from partial html updates
  */
  DOMNodeInserted: function() {
    this.buildLayout.apply(this, arguments);
  }
};

LSD.addEvents(LSD.Module.Layout.prototype, LSD.Module.Layout.events);

Object.append(LSD.Options, {
  mutations: {
    add: 'addMutation',
    remove: 'removeMutation',
    iterate: true
  },
  
  layout: {
    add: 'setLayout',
    remove: 'unsetLayout'
  }
});