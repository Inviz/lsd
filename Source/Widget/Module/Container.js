ART.Widget.Module.Container = new Class({
  options: {
		container: false
	},
	
	setContent: function() {
		return this.getContainer().set.apply(this.container, arguments);
	},
	
	getContainer: function() {
		if (!this.container) this.container = new Moo.Container(this, this.options.container);
		return this.container;
	}
});

ART.Widget.Ignore.attributes.push('container');