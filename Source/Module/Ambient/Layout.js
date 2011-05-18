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
    traverse: 'augment',
    extract: true
  },
  
  initializers: {
    layout: function(options) {
      this.rendered = {};
      return {
        events: {
          self: {
            /*
              Extracts and sets layout options from attached element
            */
            attach: function(element) {
              if (!this.extracted && options.extract) 
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
              Mutate element and extract options off it.
            */
            beforeBuild: function(query) {
              if (!query.element) return;
              if (options.extract || options.traverse == 'clone') this.extractLayout(query.element);
              var tag = this.getElementTag(true);
              if (options.traverse == 'clone' || (tag && LSD.toLowerCase(query.element.tagName) != tag)) {
                this.origin = query.element;
                query.convert = false;
              }
            },
            /*
              Builds more dependent layout when element is built
            */
            build: function() {
              if (options.traverse) {
                if (this.origin && options.traverse != 'clone') this.element.replaces(this.origin);
                this.buildLayout(LSD.slice((this.origin || this.element).childNodes));
              }
              if (options.layout) this.buildLayout(options.layout);
            },
            /*
              Augments all parsed HTML that goes through standart .write() interface
            */
            write: 'augmentLayout',
            /*
              Augments all inserted nodes that come from partial html updates
            */
            DOMNodeInserted: 'augmentLayout'
          },
          
          //applied when mutations are added
          mutations: {
            mutateLayout: 'onMutateLayout'
          }
        }
      }
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
    LSD.Module.Events.setEventsByRegister.call(this, 'mutations', true);
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
    LSD.Module.Events.setEventsByRegister.call(this, 'mutations', false);
    selector.split(/\s*,\s*/).each(function(bit) {
      var parsed = Slick.parse(bit);
      var tag = parsed.expressions[0].getLast().tag;
      var group = this.mutations[tag];
      for (var i = 0, mutation; mutation = group[i]; i++)
        if (group[0] == parsed && parsed[1] == mutation) group.splice(i--, 1);
    }, this)
  },
  
  getLayout: Macro.getter('layout', function() {
    var options = {
      method: this.options.traverse,
      interpolate: this.options.interpolate,
      context: this.options.context
    };
    return new LSD.Layout(this, null, options);
  }),
  
  buildLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, parent || this, null, options);
  },
  
  augmentLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, parent || this, 'augment', options);
  },
  
  extractLayout: function(element) {
    this.extracted = LSD.Layout.extract(element);
    if (this.tagName || this.options.source) delete this.extracted.tag;
    this.setOptions(this.extracted);
    this.fireEvent('extractLayout', [this.extracted, element])
  },
  
  clone: function() {
    
  }
});

LSD.Options.mutations = {
  add: 'addMutation',
  remove: 'removeMutation',
  iterate: true
};