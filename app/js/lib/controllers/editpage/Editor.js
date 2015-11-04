define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Client = require('../../models/Client'),

		EventEmitter = require('../../EventEmitter'),

		$ = require('jquery')
		;

	var Editor = Pane.extend({
		"init": function(app, feideconnect) {
			
			var that = this;

			this.current = null;
			this.currentTab = 'tabBasic';
			this.app = app;
			this.feideconnect = feideconnect;	

			this._super();


			this.el.on("dragover", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
				// console.log("Drag dragover");
			});
			this.el.on("dragenter", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }
				return false;
				// console.log("Drag dragenter");
			});

			this.el.on("click", ".tabselector li", function(e) {
				if (e.preventDefault) { e.preventDefault(); }
				e.stopPropagation();

				// console.error("SELECTING TAB", tabid);


				var tabid = $(e.currentTarget).data("tabid");
				that.selectTab(tabid);



			});


			this.el.on("drop", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }

				// console.log("Drop event object", e);

				var files = e.originalEvent.dataTransfer.files;
				for (var i=0; i<files.length; i++) {
					var file = files[i];

					that.logoUploaded(file);


				}
				return false;
			});

		
		},


		"logoUploaded": function(data) {
			throw "Photo uploaded handler not implemented";
		},


		"selectTab": function(id) {

			var that = this;

			this.currentTab = id;

			this.el.find(".tabselector li").each(function(i, el) {
				if ($(el).data('tabid') === id) {
					$(el).addClass("active");
				} else {
					$(el).removeClass("active");
				}
			});

			this.el.find(".tabcontainer").children().hide();
			this.el.find("#" + id).show();

			this.setTabHashFragment(id);

			return false;

		},

		"setTabHashFragment": function(tabid) {
			throw new Error("Not implemented. This needs to be implemented by the subclass of the editor.")
		}


	}).extend(EventEmitter);

	return Editor;


});