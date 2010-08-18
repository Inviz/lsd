if (!ART.Widget) ART.Widget = {};
ART.Widget.Base = new Class({
  Extends: Widget.Base,
	
	build: Macro.onion(function() {
		var attrs = $unlink(this.options.element);
		var tag = attrs.tag;
		delete attrs.tag;
		this.element = new Element(tag, attrs).store('widget', this);
		this.element.addClass(this.ns);
		this.element.addClass(this.name);
		//this.element.addClass('tag-' + this.name);
		
		if (this.options.id) this.element.addClass('id-' + this.options.id);
		
		if (this.classes) this.classes.each(function(cls) {
		  this.addClass(cls);
		}, this);
		
		if (this.attributes) 
		  for (var name in this.attributes) 
		    if (name != 'width' && name != 'height') 
		      this.element.setAttribute(name, this.attributes[name]);
		      
		this.attach()
	}),
		
	getName: function() {
		return this.getSelector();
	},
  
	getSelector: function(){
		var selector = (this.parentNode) ? this.parentNode.getSelector() + ' ' : '';
		selector += this.name;
		if (this.options.id) selector += "#" + this.options.id;
		if (this.classes.length) selector += '.' + this.classes.join('.');
		if (this.pseudos.length) selector += ':' + this.pseudos.join(':');
		if (this.attributes) for (var name in this.attributes) selector += '[' + name + '=' + this.attributes[name] + ']';
		return selector;
	},

	render: function(style){
		if (!this.parent.apply(this, arguments)) return; //only renders if dirty == true
	  delete this.halted;

  	var size = this.size;
  	if (this.findStyles() || style) this.renderStyles(style);
		this.childNodes.each(function(child){
		  child.refresh();
		});
		if (size) {
  	  var newSize = {height: this.getStyle('height'), width: this.getStyle('width')};
  	  if (size.height != newSize.height) this.setHeight(newSize.height, true);
      if (size.width != newSize.width) this.setWidth(newSize.width, true);
  	  this.fireEvent('resize', [newSize, size])
		}

		return true;
	},

	//halt render process	
	halt: function() {
	  if (this.halted) return false;
	  //console.info('halted', this.getSelector(), $A(arguments))
	  this.halted = true;
	  return true;
	},

	update: function(recursive) {
		if (recursive) {
			this.walk(function(widget) {
				widget.update();
			});
		}
		if (!this.parent.apply(this, arguments)) return;
		this.style.calculated = {};
		this.style.computed = {};
		return true;
	},

	refresh: function(recursive) {
		this.update(recursive);
		return this.render();
	}
	
});

//Basic widget initialization
ART.Widget.count = 0;
ART.Widget.create = function(klasses, a, b, c, d) {
  klasses = $splat(klasses);
  var base = ART.Widget;
  var klass = klasses.shift();
  var original = klass;
  if (klass.indexOf('-') > -1) { 
    var bits = klass.split('-');
    while (bits.length > 1) base = base[bits.shift().camelCase().capitalize()];
    klass = bits.join('-');
  }
  klass = klass.camelCase().capitalize()
	if (!base[klass]) {
	  original = original.replace(/-(.)/g, function(whole, bit) {
	    return '.' + bit.toUpperCase();
	  }).capitalize();
	  throw new Exception.Misconfiguration(this, "ClassName ART.Widget." + original + " was not found");
	}
	var widget = base[klass];
	if (klasses.length) {
  	klasses = klasses.map(function(name) {
  	  return $type(name) == 'string' ? ART.Widget.Trait[name.camelCase().capitalize()] : name;
  	});
  	widget = Class.include(widget, klasses)
  }
	ART.Widget.count++;
	return new widget(a, b, c, d)
}



Element.Styles.More = new ART.Hash('float', 'display', 'clear', 'cursor', 'verticalAlign', 'textAlign');

ART.Widget.Module = {};
ART.Widget.Trait = $mixin(Widget.Trait);

ART.Widget.Ignore = $mixin(Widget.Ignore);