/*
---
 
script: Events.js
 
description: A mixin that adds support for declarative events assignment
 
license: Public domain (http://unlicense.org).
 
requires:
	- LSD
	- Core/Events
	- Core/Element.Event
	- More/Element.Delegation
	- Ext/Element.Properties.widget
 
provides:
	- LSD.Module.Events

...
*/


LSD.Module.Events = new Class({
	
	addEvents: function(events) {
		return this.setEvents(events, true);
	},
	
	removeEvents: function(events) {
		return this.setEvents(events, false);
	},
	
	setEvents: function(events, state) {
		var convert = LSD.Module.Events.target, method = state ? 'addEvents' : 'removeEvents', old = Events.prototype[method];
		for (var i in events) { 
			if (events[i].call) { //stick to old behaviour when key: function object is passed
				old.call(this, events);
			} else {
				for (name in events) {
					var subset = events[name];
					if (!subset) continue;
					var target = convert(this, name)
					if (!target) continue;
					if (target != this) {
						if (target == true) target = this;
						target[method](subset);
					} else old.call(this, subset);
				}
			};	
			break;
		}
		return events;
	},
	
	bindEvents: function(tree) {
		if (!tree || tree.call) return tree;
		if (!this.$bound) this.$bound = {}
		if (tree.indexOf) {
			var args, self = this
			if (tree.map) {
				var name = tree.shift();
				args = tree;
				tree = name;
			}
			if (!this.$bound[tree]) {
				//if (!this[tree]) throw "Cant find a method to bind " + tree + " on " + this.getSelector();
				//YF: We now allow binding of methods that are not be in class on initialization 
				this.$bound[tree] = function() {
					self[tree].apply(self, args || arguments);
				}
			}
			return this.$bound[tree];
		}
		for (var i in tree) tree[i] = this.bindEvents(tree[i]);
		return tree;
	},
	
	/*
		The module takes events object defined in options
		and binds all functions to the widget.
		
		Ready to use event tree can be accessed via
		*.events* accessor. 
	*/

	attach: Macro.onion(function() {
		if (!this.events) this.events = this.bindEvents(this.options.events);
		this.addEvents(this.events);
	}),

	detach: Macro.onion(function() {
		this.removeEvents(this.events);
	})
});


/*
	Target system re-routes event groups to various objects.	
	
	Combine them for fun and profit.
	
	| Keyword    |  Object that recieves events       |
	|-------------------------------------------------|
	| *self*     | widget itself (no routing)         |
	| *element*  | widget element (when built)        |
	| *parent*   | parent widget                      |
	| *document* | LSD document                       |
	| *window*   | window element                     |
	
	| State      | Condition                          |
	|-------------------------------------------------|
	| *enabled*  | widget is enabled                  |
	| *disabled* | widget is disabled                 |
	| *focused*  | widget is focused                  |
	| *blured*   | widget is blured                   |
	| *target*   | first focusable parent is focused  |
	
	| Extras     | Description                        |
	|-------------------------------------------------|
	| *expected* | Routes events to widgets, selected |
	|            | by selectors (keys of event group).|
	|            | Provided by Expectations module    |
	| _\w        | An event group which name starts   |
	|            | with underscore is auto-applied    |
	               
	               
	
	
	Advanced example:
	
	events: {
	  self: {
	    focus: 'onFocus'
	  },
	  window: {
	    resize: 'onWindowResize'
	  },
	  parent: {
	    element: { //event delegation
	      'click:relay(.button)': 'onButtonClick' 
	    }
	  },
	  expected: { 
	    'button:first-child': { //waits for widgets
	      parent: {}
	    }
	  }
	}
*/

LSD.Module.Events.Targets = {
	self: function() { 
		return this
	},
	element: function() { 
		return this.element
	},
	window: function() {
		return window;
	},
	document: function() {
		return this.document;
	},
	parent: function() {
		var self = this, watchers = this.watchers, group;
		var listeners = {
			inject: function(widget) {
				if (widget instanceof LSD.Widget) widget.addEvents(group);
			},		
			dispose: function(widget) {
				if (widget instanceof LSD.Widget) widget.removeEvents(group);
			}
		};
		return {
			addEvents: function(events) {
			  group = events;
			  self.addEvents(listeners);
			  if (self.parentNode) listeners.inject(self.parentNode);
			},
			
			removeEvents: function(events) {
			  group = events;
			  self.removeEvents(listeners);
			  if (self.parentNode) listeners.dispose(self.parentNode);
			}
		}
	}
};

(function(Events, Known, Positive, Negative) {
	Object.each(Object.append({}, Positive, Negative), function(state, name) {
		var positive = !!Positive[name];
		LSD.Module.Events.Targets[name] = function() {
			var self = this, setting = Known[state], group;
			var add		 = function() { self.addEvents(group);	 }
			var remove = function() { self.removeEvents(group) }
			return {
				addEvents: function(events) {
					group = events;
					if (self[state] ^ !positive) add.call(this)
					self.addEvent(setting[+!positive], add);
					self.addEvent(setting[+!!positive], remove);
				},
				removeEvents: function(events) {
					group = events;
					self.removeEvent(setting[+!positive], add);
					self.removeEvent(setting[+!!positive], remove);
				}
			}
		}
	});
})(LSD.Module.Events, LSD.States.Known, LSD.States.Positive, LSD.States.Negative)

/* 
	
*/

LSD.Module.Events.target = function(self, name) {
	if (name.charAt(0) == "_") return true;
	var target = LSD.Module.Events.Targets[name];
	if (!target) return;
	return target.call(self)
}

/*
	Defines special *on* pseudo class for events used for
	event delegation. The difference between usual event 
	delegation (which is :relay in mootools) and this, is
	that with :on you can use LSD selectors and it fires 
	callbacks in context of widgets.
	
	element.addEvent('mouseover:on(button)', callback)
*/

Event.definePseudo('on', function(split, fn, args){
	var event = args[0];
	var target = event.target;
	while (target) {
		var widget = document.id(event.target).get('widget');
		if (widget && widget.match(split.value)) {
			fn.apply(widget, [event, widget, target]);
			return;				
		}
		target = target.parentNode;
	}
});