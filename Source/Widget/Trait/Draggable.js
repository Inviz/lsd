
ART.Widget.Trait.Draggable = new Class({
  States: {
    'dragged': ['drag', 'drop']
  },
  
  options: {
    dragger: {
      modifiers: {
        x: 'left',
        y: 'top'
      },
      snap: false,
      style: false,
      container: true,
      limit: {
        x: [0, 3000],
        y: [0, 3000]
      }
    }
  },
  
  position: 'absolute',
  
  events: {
    dragger: {}
  },
  
  getDragger: Macro.setter('dragger', function() {
    var dragged = this.getDragged();
    var element = $(dragged);
    this.onDOMInject(function() {
      var position = element.getPosition();
      element.left = position.x - element.getStyle('margin-left').toInt();
      element.top = position.y - element.getStyle('margin-top').toInt();
    }.create({delay: 50}));
    var dragger = new Drag(element, $extend({
      handle: $(this.getDragHandle())
    }, this.options.dragger));
    dragger.addEvents(this.events.dragger);
    dragger.addEvents({
      'start': this.onDragStart.bind(this),
      'complete': this.onDragComplete.bind(this),
      'cancel': this.onDragComplete.bind(this),
      'drag': this.onDrag.bind(this)
    }, true);
    return dragger;
  }),
  
	build: Macro.onion(function() {
		this.use('#title', '#content', function() {
  		this.addAction({
  		  enable: function() {
        	this.getDragger().attach();
    	  },

    	  disable: function() {
      	  if (this.dragger) this.dragger.detach();
    		}
    	})
		})
	}),

	onDragStart: function() {
	  this.drag.apply(this, arguments);
	},
	
	onDragComplete: function() {
	  this.drop.apply(this, arguments);
	},
	
	onDrag: function() {
	  this.setStyle('top', this.dragger.value.now.y);
	  this.setStyle('left', this.dragger.value.now.x);
	},
	
	getDragHandle: Macro.defaults(function() {
	  return this.header.title;
	}),

	getDragged: Macro.defaults(function() {
	  return this;
	})
});

ART.Widget.Ignore.events.push('dragger')
