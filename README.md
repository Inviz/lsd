    
      ▀ ▄▄     ▄▀
     ▄▄█████▄██▀      ▄▄▄▄▄▄▄▄   ▄██
       ▀██████     ▄████▀▀▀███ ▀███████▄▄
        ▄█████▄   ████▀  ░ █▄█    ▀ ▀▀▀███▄
         █████   ██▓█▌ ░  ▄█▀  ▄███▄▀   ████ 
         ██▓▒█ ░ █▓▒█ ░░ ▀     █████  ░  ████ 
         █▓▒░█ ░ ▀▒░█   ▄▄▄▄   ████▓ ░░░ ██▓█ 
         █▒░ █ ░  ▀▓█ ▄▀▀▀▀███▄ ▀██▒ ░░░ █▓▒█ 
      ░  █░ ░█ ░ ▀  ▀▄   ░  █▓██ ██░ ░░░ █▒░█ ░ 
      ▒  █ ░▒█ ░ █     ░░░░ █▒▓█ ██  ░░░ █░ █ ▒ 
     ░▓  █░▒▓█ ░ ██  ░░░░░░ █░▒█ ██ ░░░░ █ ░█ ▓░ 
     ▒█  █▒▓██   ███   ░░░  █▒░█ ██   ░░ █░▒█ █▒   
    ░▓██ █████▄ ▀████▀     ██▓▄▀ ██ ▀▄   █▒▓█ █▓
     ▀███▄▀█████████  ▀██████▀ ▄███ ▀█████▓█▀ ██░
      ▄▀▀▓▀  ▀▀▀▀▀▀  ▀▀▀▀▀▀   ▀▀▀▀    ▀▀▀▀▀ ▄██▀
         ▒                          ▀  ▀▀▓█▀ ▀▄ 
         ░  Lovely Scalable Drawings      ▒
         ▒                                ░
        ░▓░                               ▒
         ▀                               ░▓░
                                      ▀

LSD is an ongoing development around the idea if a framework that resembles DOM API, where every property is observable. A reactive environment where new elements receive their styles, behaviors from the context and update on the fly. Most of the framework is based on top of lightweight observable structs that handle state and references. LSD has its own script language called LSD.Script, that operates over observable variables and structures and enables sophisticated concepts like coroutines, declarative computation, reactive scripting and undoing actions.

LSD is an attempt to prove that DOM is a great and thought-out pattern that may be used and modified to meet the ever growing expectations of usability in base library. With this framework I dare you to try to realize that most of the web application frontends don't need a single line of code. Wait, are we talking about using the framework, but not actually writing any code? A magic wand? You don't believe it's possible? We are in a successful industry of software developments, where the projects never end and demand for people who can put a few half-baked libraries together and make something that cashes out some money. There's no time for a developer to re-think his process and tools, because he participates in an epic marathon of mindless iterations, CRUDs and cool-kid tech fares selling them just another web-scale solution. Good abstractions is what they actually need, but that's a hard part. There're tons of ActiveRecord, Rack, and Rails reimplementations in modern development, because those are recognized patters that make lifes easier. But none of those really changed life in javascript, not even node.js. There's still no culture or vision related to UI/UX development and hell, that's where I pop in.
 
* Best **widget system**
  * Observable selectors, that fire callbacks when element starts or stops matching the selector
  * Does not mess up with your markup, can use any elements
  * All semantic like attributes meaning, tag names and relations syntax can be customed in app
  * Widgets can change role and appearance in realtime
  * CSSOM system with extensible grammar
  * Uploader, Sorter, Dragger, Resource, Slider and other useful properties are built in
* Most powerful **templating engine** in the world
  * Observable scripting expressions, changes are updated automatically, no .redraw()
  * Conditional blocks without extra wrapping elements
  * Templates friendly to HTML clients, no invalid markup
  * HTML, HAML and JSON variants of syntax
  * Rails HAML extension
  * SOON TO RETURN: Vector graphics for widgets defined by customizable css setup
* Mind blowing **script language**
  * All variables are observable, values are lazily and efficiently recalculated on the fly
  * Asynchronous code is written like synchronous
  * Language handles state and order of execution itself
  * Allows to undo any action automatically
  * Selectors that observe DOM are first class citizens
  * Dynamic methods dispatch, with customizable method_missing logic
  * Great templating engine integration
* Mighty **resource manager**
  * Full microdata support, resources may be defined right in HTML
  * Virtual resources and urls defined on clientside with router
  * Mapping of 3rd party web APIs on to clientside resources
  * Models with validations
  * RESTful scaffolds on steroids with more actions and full clientside REST emulation
  * SOON: Graceful automatic offline mode and data sync
* Amazing **base objects**
  * Observable array that can create sorted and filtered views that are updated in realtime
  * Stack-based objects that resolves state conflicts automatically and seamlessly enable complex behaviors
  * A struct base class that uses native javascript prototypes to create classes of models with observable setters
  * A nodelist, that dynamically reoders nodes in collection based on their position in DOM with callbacks
* Serious **coding standarts**
  * Lots of meaningful specs, with focus on base structs and reusable bits
  * "Reuse or remove" attitude to code and modules, no to ad-hoc solutions
  