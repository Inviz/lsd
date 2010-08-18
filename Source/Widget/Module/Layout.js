ART.Widget.Module.Layout = new Class({
	layout: false,
	
	setLayout: function(layout) {
	  this.layout = layout;
		this.tree = this.applyLayout(layout);
		this.fireEvent('layout', [this.tree, this.layout])
	},
	
	applyLayout: function(layout) {
	  return new ART.Layout(this, layout)
	},
	
	buildLayout: function(selector, layout, parent, element) {
	  return ART.Layout.build(selector, layout, parent || this, element)
	}
});