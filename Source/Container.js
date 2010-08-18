ART.Container = new Class({
	
	Implements: [Events, Options],
	
	options: {
		data: null,
		request: null,

		element: null,
		iframe: null,
		attributes: null,
		container: null,
		content: null,

		padding: null
	},
	
	initialize: function(element, options) {
		this.element = $(element);
		
		if (!this.element) return
		
		this.set(options)
		return this
	},
	
	toElement: function() {
	  return this.element;
	},
	
	set: function() {
		var params = Array.link(arguments, {options: Object.type, content: String.type, fn: Function.type, element: Element.type});
		if (!Hash.getLength(params)) return;
		if (!params.options) params.options = {};
		if (params.fn) this.set(params.fn());
		if (params.element) params.options.element = params.element;
		if (params.element && params.element.get('iframe')) {
			params.iframe = params.element;
			delete params.element
		}
		
		if (params.content) params.options = $merge(params.options, {content: params.content});

		return this.act($merge(this.options, params.options));
	},
	
	load: function() {
		this.set.apply(this, arguments)
		return this.options
	},
	
	act: function(options) {
		//first set static stuff
		var result = this.append(options.element || options.content) || this.build(options.attributes) || this.render(options.content);
		//second do a request if needed
		return this.request(options.request) || this.browse(options.iframe) || result
	},
	
	browse: function(iframe) {
		if (!iframe) return false;
		switch($type(this.options.iframe)) {
			case "string": 
				this.options.iframe = {src: this.options.iframe};
			case "element":
				this.iframe = this.options.iframe;
			default:
				if (!this.iframe) {
					this.iframe = new IFrame($merge({
						styles: {
							border: 0, 
							display: 'block',
							width: "100%",
							height: this.element.scrollHeight
						}
					}, this.options.iframe))
				} else {
					var options = $merge(this.options.iframe) || {}
					if (options.src == this.iframe.src) delete options.src //do not set same src to avoid refreshing
					this.iframe.set(this.options.iframe)
				}
		}
		
		if (this.iframe.getParent() != this.element) this.iframe.inject(this.empty());
		return this.iframe;
	},
	
	append: function(element) {
		if (!$(element)) return false;
		this.element.adopt(element);
		this.update();
		return element;
	},
	
	request: function(options) {	
		if (!options || !options.url) return false;
		this.xhr = new Request($merge({method: "get"}, options));
		this.xhr.addEvent('success', this.recieve.bind(this));
		return this.xhr.send();
	},
	
	render: function(html) {
		if ($type(html) != 'string' || !html.length) return false;
		this.empty().set('html', html);
		return true;
	},
	
	build: function(attributes) {
		if ($type(attributes) != 'object') return false;
		return this.element.adopt(new Element(attributes.tag || 'div', attributes));
	},
	
	recieve: function(html) {
		this.render(html);
		this.fireEvent('update', this.element);
	},

	update: function() {
		this.fireEvent('update', this.element);
	},
	
	empty: function() {
		this.element.empty();
		return this.element;
	}
	
});


Moo = {};
Moo.Container = new Class({
	Extends: ART.Container,
	
	initialize: function(widget, options) {
		this.widget = widget;
		//TODO: Remove the need for this container
		this.container = new Element('div', {'class': 'container'}).inject(this.widget.getWrapper());
		this.parent(this.container, options);
	},
	
	empty: function() { //skip ART widgets
		this.element.getChildren().each(function(child) {
			if (!child.retrieve('widget')) child.destroy();
		});
		return this.element;
	},
	
	update: function() {
		this.parent.apply(this, arguments);
		this.widget.fireEvent('contentChanged', arguments)
	}
});