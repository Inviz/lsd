LSD - Lovely SVG Drawings
=========================

An interface library that blows the mind, does things that were obvious but never really done and put together: CSS-driven customizable interfaces that render into SVG/VML. The goal is to generate phat ass amount of clean, clear, reusable, lightweight, modular and powerful code to use whenever it comes to UI.

![Screenshot](http://img.skitch.com/20100913-pc6j1c8ampquj22weex2q8end3.png)


Things we have
--------------

* **Vector paths for widget** - Ever wanted a triangle window? A cloud for a comment? A star button for bookmark? Here it's all possible. Draw a shape in Inkscape or write a function that draws a path and have everything done for you. The widget will have the border, shadow, everything. For free.

* **Box model** - One guy told me the worst things of SVG embedded in HTML is that it doesnt flow. It has no real width or height that can push the widgets and float around. Here, widgets do have that and act as regular HTML elements. Everything works: inline blocks, floats, position absolute or fixed, etc.

* **Layers** - Each widget consist of a few SVG paths. You can add as many of them as you want, we have presets (stroke layer, shadow layer, fill layer). Just provide the name of a layer and CSS properties it works with.

* **Stylesheets** - Remember the times when you had to hardcode widget styles into javascript? I don't, because it is always a bad idea. But here you dont need anything like that anymore. Our way of styling everything is specially baked CSS (includes a cool module for guys who use ruby and sass) with special CSS properties for everything. The best thing is that for known properties Does "" look familiar to you? Exactly.
	
**Input: window.sass**
	
	window.hud
		button
			&:active
				:font-size 110%
				:reflection-color hsl(0, 0, 0, 0.5)
			&:hover
				:reflection-color hsl(0, 0, 0, 0.7)
				
**Output: window.css**

	.art.window.hud .art.button.pseudo-active {
		font-size: 110%;                           /* set by browser, usual CSS, speedy! */
		-lsd-reflection-color: hsl(0, 0, 0, 0.5)   /* custom property that has to be applied by LSD */
	}
	.art.window.hud .art.button.pseudo-hover {
		-lsd-reflection-color: hsl(0, 0, 0, 0.7)
	}
	
* **Document** - The single most useful thing in mootools 1.3 for me was Slick. The engine that blazingly fast retrieves elements from the DOM using selectors. Our widget trees are partially DOM-compatible, so Slick can just walk through widgets like if they were regular elements. 

		var button = Slick.search($d, "button + button")[0]
		var previous = Slick.search(button, "! + button");
		var nextWindow = Slick.search(button, "! window + window"); //finds button's window and the next window after that
		
* **Modularity** - I believe that there is not enough multiple inheritance in javascript world, so I'd like to change that. We have our own special class mutator and all the code split to small modules (One window widget consists of 20+ modules all chainted together). I believe common things like Lists, Grids, Resizing and things like that can be done one time and used everywhere. It's just a shame to copy and paste tons of crap to create a new widget. No more!
		
* **Best practices** - There are a lot of things that are (or to be) done right in this library. Focus handling, keyboard access, events DSL, Dropdown menus, dialogs, overlays, etc. 
		
* **Made to be extended** - Trust me, alright? The idea is to make something that makes it a pleasure to add another widget, or set of widgets, or widget state, or one more layer of behaviour, whatever! Just do it, like i did.

* **Lightweight codebase** - It's hard to believe, but when compressed and gzipped the whole library with dependencies (mootools, mootools-more) and SVG art takes less than 90 kb total. True story.

* **Laziness** - Always trying not to do something unless it is needed now. You've got that dropdown menu? We dont care until we show it.


Free goodies
------------

These are the things that come for free (by using other libraries):

- Vector imageless UIs that can be zoomed in forever without pixelization
- Multiple inheritance (that adds a whole lot of fun into creating of new mutators)
- Safari tabindex emulation

		
Call for help
-------------

This is already almost an year of my time and I'm willing to spend half more year (until february-march 2011) to finish everythings. There are small bugs here and there, but that is because the foundation gets changed so hard getting better each time so it's hard to keep everything working all the time.

For anyone starting a similar library I encourage you to **fork and co-work**. Dont waste your time man. You can do it, i know, but do you really want all that time to be wasted on another wheel reinvention? Trust me, together we can make better. 


Browser Support
---------------

In the early days (I dare to call that "early") of development, I only make on Firefox/Safari compatability. But let's face it, we have all tools to make it compatible with ie7+ (art has all the vml sweetness we need) pretty fast when we need to.

At the same time I try to provide quality support for nice browsers based both on gecko and webkit. I had to port Google Closure's keyboard events library to mootools custom event keypress. Why is it important? To be able to hold left button to scroll items all the way to the left. 

There's also QFocuser that aims to provide the same native focusing experience in Safari too. 


Dependencies
------------

This is a second library in a set. It requires lsd-base to function properly. And both of them work with the latest mootools. 

* mootools-core
* mootools-more
* lsd-base
* art
* qfocuser
* mootools-ext
* mootools-color
* cssparser

Screenshots
-----------

It can do much more than this, but this is my tech demos. There are more things that is untested (like scrollbars) but is there. 

* [Windows demo](http://img.skitch.com/20100912-pgxcpgxi145fhnsd1eidanie81.png)
* [Some kind of menu bar](http://img.skitch.com/20100907-pw2scewykaiyaau2jm4jb8giwu.png)

How to use
----------

Well, the framework is overwhelmingly feature rich, so it's up to you. 

First, a stylesheet (example is sass, check generated css to bake it by hand):
	
	window
		:width 100px
		:height 100px
		:background-color hsb(0, 0, 0, 0.5)
		:stroke-width 3px
		:stroke-color hsb(0, 0, 100, 0.3)
		button
			:width auto
			:height 20px
			:background-color gradient(hsb(0, 100, 30, 0.9), hsb(20, 30, 10, 0.2))
			
			&.submit
				:color white

Let's create a widget tree:

	var document = new ART.Document;
	var window = new (new Class({
		Includes: [
			ART.Widget.Window,
			ART.Widget.Trait.Draggable
		]
	}))
	var button = new ART.Widget.Button;
	//here we may need a custom button
	var submit = new Class({
		Extends: ART.Widget.Button,
		
		expression: 'button.submit',
		
		events: {
			element: {
				mousedown: 'onMouseDown'
			}
		},
		
		onClick: function() {
			alert(123);
		},
		
		onMouseDown: function() {
			console.log('test')
		}
	})
	
	button.inject(window);
	window.inject(document);
	window.adopt(button)
	
	//no, i changed my mine
	Slick.search(document, "window button + button.submit").dispose();
	


Installation
------------

Only jsus (http://github.com/markiz/jsus) can save you. You need it is a gem to build the package. Jsus is an alternative (to Packager) javascript packager written in ruby. Currently, it is possible to browse demos without using jsus, because they include generated file tree.

Library wants the raw body of stylesheets, so it makes an ajax call to that file (making it impossible to work on local filesystem). You need to use web server like apache or nginx to host it, and then access it. Sorry for this limitation for right now.
	
	# Mandatory: Get files
	git clone git://github.com/Inviz/lsd.git
	cd lsd
	git submodule update --init
	# open dependencies/lsd-examples/demos/index.html in the browser
	
	# Optional: Use jsus to pack files
	sudo gem install jsus
	cd dependencies/lsd-examples
	jsus -i . -o Scripts -d ../.. -g -b
	