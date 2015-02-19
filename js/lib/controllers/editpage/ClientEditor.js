define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),
		Client = require('../../models/Client'),
		Editor = require('./Editor'),
		scopePolicy = require('../../../../etc/scopepolicy'),
		utils = require('../../utils')
		;


	var clientTemplate = require('text!templates/ClientEditor.html');



	var ClientEditor = Editor.extend({
		"init": function(app, feideconnect, publicapis) {
			
			var that = this;
			this.editor = "clients";
			this.publicapis = publicapis;
			this._super(app, feideconnect);

			var x = dust.compile(clientTemplate, "clienteditor");
			dust.loadSource(x);

			this.ebind("click", ".actSaveChanges", "actSaveChanges");
			this.ebind("click", ".actScopeAdd", "actScopeAdd");
			this.ebind("click", ".actScopeRemove", "actScopeRemove");
			this.ebind("click", ".actDelete", "actDelete");

			this.ebind("click", ".actAPIadd", "actAPIadd");
			
		
		},

		"logoUploaded": function(data) {
			var that = this;
			that.feideconnect.clientsUpdateLogo(this.current.id, data)
				.then(function() {
					console.log("Successfully posted logo to feideconnect");
					var url = "http://api.dev.feideconnect.no:6543/clientadm/clients/" + that.current.id + "/logo?r=" + utils.guid();
					that.el.find('.itemlogo').attr("src", url);
				})
				.catch(function(err) {
					that.app.setErrorMessage("Error uploading logo", "danger", err);
				});

		},



		"showPublicAPIs": function() {


			var apis = this.publicapis.apigks;
			$("#apigklisting").empty();
			for(var key in apis) {
				$("#apigklisting").append('<div>' + apis + '</div>');
			}


		},

		"edit": function(item, setTab) {

			var that = this;
			this.current = item;

			var view = item.getView(this.feideconnect);

			var scopes = item.getScopes(scopePolicy);

			// console.log("SCOPES", scopes);
			
			// var apis = this.publicapis.apigks;

			if (this.feideconnect) {
				$.extend(view, {
					"oauth": that.feideconnect.getConfig(),
					"scopelist": scopes
				});
			}


			// console.log("PUBLIC API FETCH");

			this.publicapis.ready(function(apis) {
				view.apis = that.publicapis.getView();

				console.error("APIs are ", view.apis);
				console.log("view is ", view);


				dust.render("clienteditor", view, function(err, out) {
					// console.log(out);

					var tab = that.currentTab;
					if (setTab) tab = setTab;
					that.el.empty().append(out);
					that.selectTab(tab);

				});

				that.activate();


			});
			


		},

		"actAPIadd": function(e) {

			e.preventDefault();

			var that = this;
			var newscopes = [];

			var container = $(e.currentTarget).closest(".apiEntry");
			var apigkid = container.data('apigkid');
			var apigk = this.publicapis.getAPIGK(apigkid);

			newscopes.push("gk_" + apigkid);
			container.find("input.subScopeSelection").each(function(i, item) {

				if ($(item).prop("checked")) {
					newscopes.push($(item).attr("name"));
				}

			});

			// console.log("Adding API ", apigk);
			console.error("Adding scopes", newscopes);

			this.current.addScopes(newscopes);

			var fullobj = this.current.getStorable();
			var obj = {};
			obj.id = fullobj.id;
			obj.scopes_requested = fullobj.scopes_requested;

			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});


			console.log("trying to actScopeAdd ", scopeid);


		},
		"actScopeAdd": function(e) {
			e.preventDefault();
			var scopeid = $(e.currentTarget).closest(".scopeEntry").data("scopeid");

			this.current.addScope(scopeid);
			var obj = this.current.getStorable();
			var that = this;
			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});


			console.log("trying to actScopeAdd ", scopeid);
		},
		"actScopeRemove": function(e) {
			e.preventDefault();
			var scopeid = $(e.currentTarget).closest(".scopeEntry").data("scopeid");
			console.log("trying to actScopeRemove  ", scopeid);

			this.current.removeScope(scopeid);
			var obj = this.current.getStorable();
			var that = this;
			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});

		},

		"actSaveChanges": function(e) {
			e.preventDefault();

			console.log("About to sacve changes");

			this.current.setName(this.el.find("#name").val());
			this.current.setDescr(this.el.find("#descr").val());
			this.current.setOneRedirectURI(this.el.find("#redirect_uri").val());

			var obj = this.current.getStorable();

			console.error("Get storable", obj);



			var that = this;
			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});

		},
		"actDelete": function(e) {
			e.preventDefault();
			var that = this;
			this.feideconnect.clientsDelete(this.current.id, function(data) {
				that.emit("deleted", that.current.id);
			});
		}

	});

	return ClientEditor;


});