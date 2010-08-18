ART.Widget.Select = new Class({
  
  Includes: [
    ART.Widget.Paint,
    Class.Stateful({
      'expanded': ['expand', 'collapse']
    }),
    ART.Widget.Trait.HasMenu,
    Widget.Trait.List,
    Widget.Trait.Choice,
    Widget.Trait.Value,
    Widget.Trait.Focus,
    Widget.Trait.Accessibility
  ],
  
  name: 'select',
  
  layered: {
    shadow:  ['shadow'],
    stroke: ['stroke'],
	  background:  ['fill', ['backgroundColor']],
	  reflection:  ['fill', ['reflectionColor']],
    glyph: ['glyph']
	},
	
	layout: {
	  'select-button#button': {}
	},
	
	options: {
	  menu: {
	    position: 'focus'
	  }
	},
	
	shortcuts: {
	  'ok': 'selectChosenItem'
	},
	
	events: {
	  element: {
  	  mousedown: 'retain',
  	  click: 'expand'
	  },
	  self: {
  	  select: 'collapse',
  	  collapse: 'forgetChosenItem'
	  }
	},
	
	items: ["1","2","3"],
	
	buildItem: function(item) {
    if (!this.menu) this.buildMenu();
	  var widget = this.buildLayout('select-option', item.toString(), this.menu);
	  widget.value = item;
	  widget.selectWidget = this;
	  return widget;
	},
	
	processValue: function(item) {
	  return item.value;
	}
	
});

ART.Widget.Select.Button = new Class({
  Extends: ART.Widget.Button
})

ART.Widget.Select.Option = new Class({
  Extends: ART.Widget.Container,
  
  States: {
    chosen: ['choose', 'forget']
  },
  
  events: {
    element: {
      click: 'select',
      mouseenter: 'chooseOnHover'
    }
  },
  
  name: 'option',
  
  select: function() {
    this.selectWidget.select.delay(20, this.selectWidget, [this]);
  },
  
  chooseOnHover: function() {
    this.selectWidget.select(this, true)
  }
})