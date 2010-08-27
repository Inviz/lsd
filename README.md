# LSD - Lovely SVG Drawings

## Some things may be broken after the big split, but it is starting to get back to normal

An interface library that blows the mind, does things that were obvious but never really done and put together: CSS-driven customizable interfaces that render into SVG/VML. The goal is to generate phat ass amount of clean, clear, reusable, lightweight, modular and powerful code to use whenever it comes to UI.

## Things we have

* **Vector paths for widget** - Ever wanted a triangle window? A cloud for a comment? A star button for bookmark? Here it's all possible. Draw a shape in Inkscape or write a function that draws a path and have everything done for you. The widget will have the border, shadow, everything. For free.

* **Box model** - One guy told me the worst things of SVG embedded in HTML is that it doesnt flow. It has no real width or height that can push the widgets and float around. Here, widgets do have that and act as regular HTML elements. Everything works: inline blocks, floats, position absolute or fixed, etc.

* **Layers** - Each widget consist of a few SVG paths. You can add as many of them as you want, we have presets (stroke layer, shadow layer, fill layer). Just provide the name of a layer and CSS properties it works with.

* **Stylesheets** - Remember the times when you had to hardcode widget styles into javascript? I don't, because it is always a bad idea. But here you dont need anything like that anymore. Our way of styling everything is specially baked CSS (includes a cool module for guys who use ruby and sass) with special CSS properties for everything. The best thing is that for known properties Does "" look familiar to you? Exactly.
	
	// Input: window.sass
	window.hud
		button
			&:active
				:font-size 110%
				:reflection-color hsl(0, 0, 0, 0.5)
			&:hover
				:reflection-color hsl(0, 0, 0, 0.7)
				
				
	// Output: window.css
	.art.window.hud .art.button.pseudo-active {
		font-size: 110%;													 /* set by browser, usual CSS, speedy! */
		-lsd-reflection-color: hsl(0, 0, 0, 0.5)	 /* custom property that has to be applied by LSD */
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

* **Laziness** - Always trying not to do something unless it is needed now. You've got that dropdown menu? We dont care until we show it.


## Free goodies

These are the things that come for free (by using other libraries):

- Vector imageless UIs that can be zoomed in forever without pixelization
- Multiple inheritance (that adds a whole lot of fun into creating of new mutators)
- Safari tabindex emulation

		
## Timeline

This is already almost an year of my time and I'm willing to spend half more year (until february-march 2011) to finish everythings. There are small bugs here and there, but that is because the foundation gets changed so hard getting better each time so it's hard to keep everything working all the time.

For anyone starting a similar library I encourage you to **fork and co-work**. Dont waste your time man. You can do it, i know, but do you really want all that time to be wasted on another wheel reinvention? Trust me, together we can make better. 


## Dependencies

This is a second library in a set. It requires lsd-base to function properly. And both of them work with the latest mootools. 

(all edge versions)
* mootools-core
* mootools-more
* lsd-base
* art


## Usage

Only jsus (http://github.com/markiz/jsus) can save you. You need it is a gem to build the package.
	
	sudo gem install jsus
	git clone git://github.com/Inviz/lsd.git
	cd lsd
	git submodule update
	cd dependencies/lsd-examples
	jsus -i . -o Scripts -d ../..
	open demos/index.html
	