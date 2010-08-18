ART.Layout = new Class({
  
  Implements: [Options, Logger],
  
	ns: 'art',
	name: 'layout',
		
  initialize: function(widget, layout, options) {
    this.widget = widget;
    this.layout = layout;
    this.setOptions(options);
		//this.widget.log('Layout', this, 'for', widget)
    this.reset();
  }, 
  
  reset: function() {
    this.render(this.layout, this.widget);
  },
  
  materialize: function(selector, layout, parent) {
    var widget = ART.Layout.build(selector, layout, parent);
    if ($type(layout) != 'string') widget = this.render(layout, widget);
    return widget;
  },
  
  render: function(layout, parent) {
    var widgets = [];
    switch ($type(layout)) {
      case "string": 
        widgets.push(this.materialize(layout, {}, parent));
        break;
      case "array": 
        layout.each(function(widget) {
          widgets.push.apply(widgets, this.render(widget, parent))
        }, this)
        break;
      case "object":
        for (var selector in layout) {
          widgets.push(this.materialize(selector, layout[selector], parent));
        }
        break;
    }
    return widgets;
  },

	getName: function() {
		return 'Layout'
	}
});

(function(cache) {
  ART.Layout.findTraitByAttributeName = function(name) {
    if (!$defined(cache[name])) {
      switch(name) {
        case "height": case "width":
          name = 'liquid';
          break;
      }
      cache[name] = ART.Widget.Trait[name.capitalize()] || null;
    }
    return cache[name];
  }
})(ART.Layout.traitByAttribute = {});

ART.Layout.build = function(selector, layout, parent, element) {
  var parsed = Slick.parse(selector).expressions[0][0]
  if (parsed.tag == '*') parsed.tag = 'container';
  var tag = parsed.tag;
  var options = {};
  var attributes = {};
	if (parsed.id) options.id = parsed.id
	var mixins = [];
	var styles;
	if (parsed.attributes) parsed.attributes.each(function(attribute) {
	  if (attribute.key == "style") {
	    styles = {};
	    attribute.value.split(';').each(function(definition) {
	      var bits = definition.split(':');
	      styles[bits[0]] = bits[1];
	    })
	  } else {
	    var name = attribute.key;
	    var value = attribute.value || true;
	    if (name == 'type') tag += "-" + value;
	    var bits = name.split('-');
	    for (var i = bits.length - 1; i > -1; i--) {
        var obj = {};
        obj[bits[i]] = value;
	      if (i == 0) $mixin(options, obj);
	      else value = obj;
	    }
			attributes[name] = attribute.value || true;
			var trait = ART.Layout.findTraitByAttributeName(name);
			if (trait) mixins.push(trait);
	  }
	});
	mixins.unshift(tag)
	for (var i in attributes) {
	  options.attributes = attributes;
	  break;
	}
	var widget = ART.Widget.create(mixins, options);
	widget.build();
	
	if (!options.id && parent) {
	  var property = parsed.tag + 's';
	  if (!parent[property]) parent[property] = [];
	  parent[property].push(widget)
	}
  
  if (!element) element = parent;
  if (element) widget.inject(element, true)
  
  if (parsed.classes) {
    var klasses = parsed.classes.map(function(klass) { return klass.value })
    widget.classes.push.apply(widget.classes, klasses);
    klasses.each(widget.addClass.bind(widget));
  }
	if (parsed.pseudos) {
	  parsed.pseudos.each(function(pseudo) {
	    widget.setStateTo(pseudo.key, true)
	  });
	}
	if (styles) widget.setStyles(styles);
	if ($type(layout) == 'string') widget.setContent(layout);
	return widget;
}