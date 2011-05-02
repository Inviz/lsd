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
    layout: {
      render: true,
      extract: false,
      options: {}
    }
  },
  
  initializers: {
    layout: function(options) {
      return {
        events: {
          self: {
            /*
              Extracts and sets layout options from attach element
            */
            attach: function(element) {
              if (this.extracted || !options.layout.extract) return;
              this.extracted = LSD.Layout.extract(element);
              this.setOptions(this.extracted)
            },
            /*
              Unsets options previously extracted from the detached element
            */
            detach: function() {
              if (!this.extracted) return;
              this.unsetOptions(this.extracted)
              delete this.extracted;
            },
            /*
              Mutate element when layout is set to clone.
            */
            beforeBuild: function(options) {
              var layout = this.options.layout, clone = layout.options.method == 'clone';
              if (!options.element || !(clone || layout.extract)) return;
              this.extracted = LSD.Layout.extract(options.element);
              this.setOptions(this.extracted);
              this.origin = options.element;
              if (clone) options.convert = false;
            },
            /*
              Builds more dependent layout when element is built
            */
            build: function() {
              var layout = this.options.layout;
              if (this.origin || layout.render) 
                this.buildLayout(Array.prototype.slice.call((this.origin || this.element).childNodes, 0));
              if (layout.children) this.buildLayout(layout.children);
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
          
          //applied only when mutations are set
          mutations: {
            mutateLayout: 'onMutateLayout'
          }
        }
      }
    }
  },
  
  applySelector: function(selector) {
    var parsed = Slick.parse(selector).expressions[0][0];
    if (parsed.classes) parsed.classes.map(function(klass) { return klass.value }).each(this.addClass, this);
    if (parsed.id) this.setAttribute('id', parsed.id);
    if (parsed.attributes) parsed.attributes.each(function(attribute) {
      this.setAttribute(attribute.key, attribute.value);
    }, this);
  },
  
  mutateLayout: function(element, layout) {
    var query = {element: element, layout: layout, parent: this};
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
    return new LSD.Layout(this, null, this.options.layout.options);
  }),
  
  buildLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, parent || this, null, options);
  },
  
  augmentLayout: function(layout, parent, options) {
    return this.getLayout().render(layout, parent || this, 'augment', options);
  }
});

LSD.Options.mutations = {
  add: 'addMutation',
  remove: 'removeMutation',
  iterate: true
};