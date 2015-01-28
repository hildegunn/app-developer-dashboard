define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Client = require('../../models/Client'),

		EventEmitter = require('../../EventEmitter'),

		Editor = require('./Editor'),

		scopePolicy = require('../../../../etc/scopepolicy'),

		utils = require('../../utils')
		;


	var apigkTemplate = require('text!templates/APIGKEditor.html');



	var APIGKEditor = Editor.extend({
		"init": function(app, feideconnect) {
				
			var that = this;
			this.editor = "apigk";
			this._super(app, feideconnect);


			var x = dust.compile(apigkTemplate, "apigkeditor");
			dust.loadSource(x);


			this.ebind("click", ".actSaveChanges", "actSaveChanges");
			// this.ebind("click", ".actScopeAdd", "actScopeAdd");
			// this.ebind("click", ".actScopeRemove", "actScopeRemove");

		
		},

		"logoUploaded": function(data) {
			var that = this;
			this.feideconnect.apigkUpdateLogo(that.current.id, data, function() {
				console.log("Successfully posted rto feideconnect");
				var url = "http://api.dev.feideconnect.no:6543/apigkadm/apigks/" + that.current.id + "/logo?r=" + utils.guid();
				that.el.find('.itemlogo').attr("src", url);
				that.emit("saved", that.current);
			});
		},


		"edit": function(item, setTab) {

			var that = this;
			this.current = item;

			var view = item.getView(this.feideconnect);
			
			if (this.feideconnect) {
				$.extend(view, {
					"oauth": that.feideconnect.getConfig()
				});
			}
			

			console.log("view is ", view);

			dust.render("apigkeditor", view, function(err, out) {
				// console.log(out);

				var tab = that.currentTab;
				if (setTab) tab = setTab;
				that.el.empty().append(out);
				that.selectTab(tab);

			});

			this.activate();
		},

		"actSaveChanges": function(e) {
			e.preventDefault();


			var obj = {
				"id": this.current.id
			};

			obj.name = this.el.find("#apiname").val();
			obj.descr = this.el.find("#apidescr").val();
			obj.endpoints = [this.el.find("#endpoint").val()];
			// obj.scopedef = {};
			// obj.trust = {};

			console.log("About to save changes to apigk", obj);


			var that = this;
			this.feideconnect.apigkUpdate(obj, function(savedClient) {
				var x = new APIGK(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});

		}

	});

	return APIGKEditor;


});