LSD - Lovely SVG Drawings
=========================

An interface library that blows the mind, does things that were obvious but never really done and put together: CSS-driven customizable interfaces that render into SVG/VML. The goal is to generate phat ass amount of clean, clear, reusable, lightweight, modular and powerful code to use whenever it comes to UI.

![Screenshot](http://img.skitch.com/20100913-cddxp3qi29bphck9iuartyce8b.png)


Pictures
-----------

It can do much more than this, but this is my tech demos. There are more things that is untested (like scrollbars) but is there. 

* [Desktop demo](http://img.skitch.com/20101007-mkm3th7j29ikjhhi7ah816n19s.png)
* [HUD theme](http://img.skitch.com/20100915-r5wsspyameb81mbm2mq1unyax3.png)
* [Aristo theme (in two colors)](http://img.skitch.com/20100928-eas6h46ddfbe7di25qwrsrkwp5.png)

Things we have
--------------

* **Vector paths for widget** - Ever wanted a triangle window? A cloud for a comment? A star button for bookmark? Here it's all possible. Draw a shape in Inkscape or write a function that draws a path and have everything done for you. The widget will have the border, shadow, everything. For free.

* **Box model** - One guy told me the worst things of SVG embedded in HTML is that it doesnt flow. It has no real width or height that can push the widgets and float around. Here, widgets do have that and act as regular HTML elements. Everything works: inline blocks, floats, position absolute or fixed, etc.

* **Layers** - Each widget consist of a few SVG paths. You can add as many of them as you want, we have presets (stroke layer, shadow layer, fill layer). Just provide the name of a layer and CSS properties it works with.

* **Stylesheets** - Remember the times when you had to hardcode widget styles into javascript? I don't, because it is always a bad idea. But here you dont need anything like that anymore. Our way of styling everything is specially baked CSS (includes a cool module for guys who use ruby and sass) with special CSS properties for everything. 
  
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

* **Themes** - There is a whole submodule full of different themes (currently 2) for your application. There is also a theme skeleton provided in sass sources for anyone to create a new one. 

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

This is a second library in a set. It requires lsd-base to function properly. And both of them work with the latest (1.3) mootools. 

* [lsd-base](http://github.com/inviz/lsd-base) (Public domain)
* [mootools-ext](http://github.com/inviz/mootools-ext) (Public domain)
* [mootools-core](http://github.com/mootools/mootools-core) (MIT Licesnse)
* [mootools-more](http://github.com/mootools/mootools-more) (MIT Licesnse)
* [art](http://github.com/kamicane/art) (MIT Licesnse)
* [qfocuser](http://github.com/inviz/qfocuser) (MIT Licesnse)
* [mootools-color](http://github.com/kamicane/mootools-color) (MIT Licesnse)
* [cssparser](http://github.com/inviz/cssparser) (MIT Licesnse)

Extras:

* [lsd-examples](http://github.com/inviz/lsd-examples) (Public domain)
* [lsd-themes](http://github.com/inviz/lsd-themes) (Public domain)
* [lsd-specs](http://github.com/inviz/lsd-specs) (Public domain)


How to Use
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


Ok, here is an example of everyday coolness that i'm exposed to, because I'm working with LSD (this library). Let's create a widget tree:

    var document = new ART.Document;
    var window = new (new Class({
      Includes: [
        ART.Widget.Window,
        ART.Widget.Trait.Draggable.Stateful //adds Draggable trait & a state (this.dragged) and two methods (this.drag & this.drop)
      ]
    }))
    
    ART.Widget.Button = new Class({

      Includes: [
        ART.Widget.Paint,
        Widget.Trait.Touchable.Stateful
      ],

      options: {
        tag: 'button',
        layers: {
          shadow:  ['shadow'],
          stroke: ['stroke'],
          background:  [ART.Layer.Fill.Background.Offset],
          reflection:  [ART.Layer.Fill.Reflection.Offset],
          glyph: ['glyph']
        },
        label: ''
      },

      setContent: function(content) {
        this.setState('text');
        return this.parent.apply(this, arguments);
      }

    });
    
    ART.Widget.Button.Submit = new Class({
      Extends: ART.Widget.Button,
      
      options: {
        layout: {
          self: 'button.submit'
        }
      },
      
      onClick: function() {
        if (this.condition()) this.parent.apply(this, arguments);
      },
      
      condition: function() {
        return this.getForm().validate() //only submit if the form is valid
      }
    });
    
    var button = new ART.Widget.Button;
    var submit = new ART.Widget.Button.Submit;  
    window.inject(document);
    window.adopt(button)
    submit.inject(window);
    
    //no, i changed my mind
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
  
  
[Changelog](http://github.com/Inviz/lsd/blob/master/CHANGELOG)
---------
    0.23 Layer offsets, Resizing/Scrolling. Cleaning.

    0.22 Actions revamp. Disabled attribute support. Cleaning.
    
    0.21 Expressions support, focus propagation, bugfixes & speedups
      
    0.2 Themes release
    
    0.11 First public demo
    
    0.1 Initial public release