define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Client = require('../../models/Client'),

		EventEmitter = require('../../EventEmitter'),

		scopePolicy = require('../../../../etc/scopepolicy'),
		$ = require('jquery')
		;


	var template = require('text!templates/ClientEditor.html');



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

				var tabid = $(e.currentTarget).data("tabid");
				that.selectTab(tabid);

			});


			this.el.on("drop", ".imagezone", function(e) {
				if (e.preventDefault) { e.preventDefault(); }

				console.log("Drop event object", e);

				var files = e.originalEvent.dataTransfer.files;
				for (var i=0; i<files.length; i++) {
					var file = files[i];

					that.logoUploaded(file);
					// return;


					// var reader = new FileReader();
					// console.log("File:", file, reader);

					// //attach event handlers here...

					// reader.readAsBinaryString(file);
					// // reader.readAsArrayBuffer(file);

					// reader.onprogress = function(event) {
					// 	if (event.lengthComputable) {
					// 		var value = event.loaded;
					// 		var max = event.total;
					// 		var percent = Math.round(100*value / max);
					// 		console.log("Progress uploading file " + percent + "%");
							
					// 	}
					// };
					// reader.onloadend = function(event) {
					// 	var 
					// 		contents = event.target.result,
					// 		error = event.target.error;

					// 	console.log(event.target);

					// 	if (error != null) {
					// 		console.error("File could not be read! Code " + error.code);
					// 	} else {
					// 		console.log("Upløoad completed");
					// 		// that.logoUploaded(contents);
					// 		that.logoUploaded(file);
					// 		// console.log("Contents: " + contents);
					// 	}
					// };



				}
				return false;

				// console.log("Drag dragenter");
			});

		
		},

		"logoUploaded": function(data) {
			throw "Photo uploaded handler not implemented";
		},


		"selectTab": function(id) {

			var that = this;
			console.log("seleted tab ", id);

			this.currentTab = id;
			this.app.setHash('/' + this.editor + '/' + this.current.id + '/edit/' + id);

			this.el.find(".tabselector li").each(function(i, el) {
				if ($(el).data('tabid') === id) {
					$(el).addClass("active");
				} else {
					$(el).removeClass("active");
				}
			});

			this.el.find(".tabcontainer").children().hide();
			this.el.find("#" + id).show();

			return false;

		}

	}).extend(EventEmitter);

	return Editor;


});