/*
---
 
script: Uploader.js
 
description: Add your widget have a real form value.
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Widgets/LSD.Widget.Button
  - Uploader/*
  - LSD.Trait.List
  - Core/JSON
  
provides: 
  - LSD.Mixin.Uploader
 
...
*/

LSD.Mixin.Uploader = new Class({
  options: {
    actions: {
      uploader: {
        enable: function() {
          if (this.attributes.multiple) this.options.uploader.multiple = true;
          this.fireEvent('register', ['uploader', this.getUploader()]);
          this.getUploader().attach(this.getUploaderTarget());
          this.getStoredBlobs();
        },
        disable: function() {
          this.getUploader().removeEvents(this.events.uploader);
          this.getUploader().detach(this.getUploaderTarget())
          this.fireEvent('unregister', ['uploader', this.getUploader()]);
        }
      }
    },
    uploader: {
      getFileClass: function(adapter, Klass) { 
        if (!Klass.File.Widget) Klass.File.Widget = new Class({
          Includes: [Klass.File, LSD.Widget, LSD.Widget.Filelist.File]
        });
        return Klass.File.Widget;
      }
    },
    events: {
      uploader: {
        fileComplete: 'onFileComplete',
        fileRemove: 'onFileRemove',
        fileProgress: 'onFileProgress'
      }
    },
    layout: {
      children: Array.fast('::list')
    },
    has: {
      one: {
        list: {
          selector: 'filelist'
        }
      }
    }
  },
  
  getUploader: Macro.getter('uploader', function() {
    var uploader = new Uploader(this.options.uploader);
    uploader.widget = this;
    return uploader;
  }),
  
  getUploaderTarget: function() {
    return this.element;
  },
  
  processFileResponse: function(response) {
    response = JSON.decode(response);
    if (response && Object.getLength(response) == 1) response = response[Object.keys(response)[0]];
    return response;
  },
  
  onFileComplete: function(file) {
    var blob = this.processFileResponse(file.response.text);
    if (blob && !blob.errors) {
      this.onFileSuccess(file, blob);
    } else {
      this.onFileFailure(file, blob || response);
    }
  },
  
  processValue: function(blob) {
    return blob.id || blob.uid;
  },
  
  onFileSuccess: function(file, blob) {
    (this.blobs || (this.blobs = {}))[file.id] = blob;
    this.setValue(blob);
  },
  
  onFileRemove: function(file, blob) {
    this.setValue(this.blobs[file.id], true);
  },
  
  getStoredBlobs: function() {
    var attribute = this.attributes.blob || this.attributes.blobs;
    return attribute ? Array.from(JSON.decode(blobs)) : [];
  }
});

LSD.Widget.Filelist = new Class({
  Includes: [
    LSD.Widget,
    LSD.Trait.List
  ],
  
  options: {
    tag: 'filelist',
    has: {
      many: {
        items: {
          selector: 'file',
          layout: 'filelist-file'
        }
      }
    }
  }
});

LSD.Widget.Filelist.File = new Class({
  options: {
    tag: 'file',
    layout: {
      children: {
        '::meter': true,
        '::canceller': 'Cancel'
      }
    },
    events: {
      setBase: function(base) {
        this.inject(this.base.widget.list);
        this.write(this.name)
      },
      progress: function() {
        this.meter.write(this.progress.percentLoaded)
      },
      start: function() {
        this.setState('started');
      },
      complete: function() {
        this.unsetState('started');
        this.setState('complete');
      },
      stop: function() {
        this.unsetState('started');
      }
    },
    has: {
      one: {
        meter: {
          selector: 'progress'
        },
        canceller: {
          selector: 'button.cancel',
          events: {
            click: 'cancel'
          }
        }
      }
    }
  },
  
  cancel: function() {
    this.stop();
    this.remove();
    this.dispose();
  }
});

LSD.Widget.Progress = new Class({
  Extends: LSD.Widget,
  
  options: {
    tag: 'progress',
    inline: null,
    pseudos: Array.fast(':valued')
  }
});

LSD.Behavior.define(':uploading', LSD.Mixin.Uploader);