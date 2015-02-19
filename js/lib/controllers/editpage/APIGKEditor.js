define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),
		Client = require('../../models/Client'),
		APIGK = require('../../models/APIGK'),
		ScopeDefBuilder = require('./ScopeDefBuilder'),
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

			this.scopedefbuilder = new ScopeDefBuilder(this.feideconnect);
			this.scopedefbuilder.on("save", function(obj) {

				console.log("About to save: ", obj);

				that.feideconnect.apigkUpdate(obj, function(savedClient) {
					var x = new APIGK(savedClient);
					that.edit(x);
					that.emit("saved", x);
				});


			});

			this.ebind("click", ".actSaveChanges", "actSaveChanges");
			this.ebind("click", ".actDelete", "actDelete");

		
		},

		"loadClients": function() {

			var that = this;
			return new Promise(function(resolve, reject) {


				


			});
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
			console.log("About to pass on view", view);
			this.scopedefbuilder.setAPIGK(item);
			
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
				that.el.children().detach();
				that.el.append(out);
				that.selectTab(tab);

				that.el.find("#scopedef").append(that.scopedefbuilder.el);


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

		},
		"actDelete": function(e) {
			e.preventDefault();
			var that = this;
			this.feideconnect.apigkDelete(this.current.id, function(data) {
				that.emit("deleted", that.current.id);
			});
		}

	});

	return APIGKEditor;


});