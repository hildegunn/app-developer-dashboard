define(function(require) {
	"use strict";	

	var 
		dust = require('dust'),
		Client = require('../../models/Client'),
		Editor = require('./Editor'),
		utils = require('../../utils'),
		StringSet = require('../../StringSet'),
		$ = require('jquery')
		;


	var clientTemplate = require('text!templates/ClientEditor.html');

	var ClientEditor = Editor.extend({
		"init": function(app, feideconnect, publicapis) {
			
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
			this.ebind("click", ".actAPIScopeUpdate", "actAPIScopeUpdate");
			this.ebind("click", ".actRemoveRedirectURI", "actRemoveRedirectURI");
			this.ebind("click", ".actAddRedirectURI", "actAddRedirectURI");
		
		},

		"actRemoveRedirectURI": function(e) {
			e.preventDefault();
			$(e.currentTarget).closest(".redircontainer").remove();
		},

		"actAddRedirectURI": function(e) {
			e.preventDefault();
			var tmp = this.el.find("#redirtemplate").clone().css("display", "block");
			this.el.find("#rediroutercontainer").append(tmp);
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
				if (apis.hasOwnProperty(key)) {
					$("#apigklisting").append('<div>' + apis + '</div>');	
				}
			}

		},

		"edit": function(item, setTab) {

			var that = this;
			this.current = item;

			var view = item.getView(this.feideconnect);


			var fcc = this.feideconnect.getConfig();
			var endpoint = fcc.apis.core + '/clientadm/scopes/';

			$.getJSON(endpoint, function(scopePolicy) {
				console.error("Scopedef is", scopePolicy);

				var scopes = item.getScopes(scopePolicy);

				if (that.feideconnect) {
					$.extend(view, {
						"_config": that.feideconnect.getConfig(),
						"scopelist": scopes
					});
				}

				var apiids = item.getAPIscopes();
				var clientAPIkeys = new StringSet(apiids);


				that.publicapis.ready(function(apis) {

					var myapis = [], api, i;

					for(i = 0; i < apiids.length; i++) {
						api = that.publicapis.getAPIGK(apiids[i]);
						if (api === null) {
							console.error("This client got scopes for the API [" + apiids[i] + "] but did not find information about this public API.");
						} else {
							myapis.push(api);
						}
					}

					var aapiview;
					view.authorizedAPIs = [];
					view.requestedAPIs = [];

					// console.error("APIS", apis);

					view.apis = [];
					for(var key in apis) {
						if (apis.hasOwnProperty(key)) {
							console.log("About to process ", apis[key].name, clientAPIkeys.has(apis[key].id));
							if (clientAPIkeys.has(apis[key].id)) {continue;}
							view.apis.push(apis[key].getView());
						}
					}

					for(i = 0; i < myapis.length; i++) {

						// if (new Client()  instanceof Client.prototype) {
						// 	throw new Error("Cannot getClientView without providing a valid Client object.");
						// }

						aapiview = myapis[i].getClientView(that.current);
						if (aapiview.sd.authz) {
							view.authorizedAPIs.push(aapiview);
						} 
						if (aapiview.sd.req) {
							view.requestedAPIs.push(aapiview);
						}

					}

					console.error("View is ", view);
					

					dust.render("clienteditor", view, function(err, out) {

						var tab = that.currentTab;
						if (setTab) {
							tab = setTab;
						}
						that.el.empty().append(out);
						that.selectTab(tab);

					});

					that.activate();

				});
				


			});





		},

		"actAPIadd": function(e) {

			e.preventDefault();

			var that = this;
			var newscopes = [];

			var container = $(e.currentTarget).closest(".apiEntry");
			var apigkid = container.data('apigkid');
			var apigk = this.publicapis.getAPIGK(apigkid);

			newscopes.push(apigk.getBasicScope());
			container.find("input.subScopeSelection").each(function(i, item) {

				if ($(item).prop("checked")) {
					newscopes.push($(item).attr("name"));
				}

			});

			// console.log("Adding API ", apigk);
			// console.error("Adding scopes", newscopes);

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

			console.log("trying to actAPIadd ", newscopes);

		},

		"actAPIScopeUpdate": function(e) {

			e.preventDefault();

			var that = this;

			var container = $(e.currentTarget).closest(".apiEntry");

			var scopes = {};
			$(container).find("input.authscope").each(function(i, item) {
				console.log("Auth z input element", item);
				var scope = $(item).data("scopemoderate");
				var enabled = $(item).prop("checked");
				scopes[scope] = enabled;
			});

			for(var scope in scopes) {
				if (scopes[scope]) {
					this.current.addScope(scope);
				} else {
					this.current.removeScope(scope);
				}
			}

			var fullobj = this.current.getStorable();
			var obj = {};
			obj.id = fullobj.id;
			obj.scopes_requested = fullobj.scopes_requested;

			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});


		},

		"actScopeAdd": function(e) {
			e.preventDefault();
			var scopeid = $(e.currentTarget).closest(".scopeEntry").data("scopeid");

			this.current.addScope(scopeid);
			var obj = this.current.getStorable();
			var that = this;


			this.feideconnect.clientsUpdate(obj)
				.then(function(savedClient) {
					var x = new Client(savedClient);
					that.edit(x);
					that.emit("saved", x);
				})
				.catch(function(err) {
					that.app.setErrorMessage("Error adding scope", "danger", err);
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


			this.feideconnect.clientsUpdate(obj)
				.then(function(savedClient) {
					var x = new Client(savedClient);
					that.edit(x);
					that.emit("saved", x);
				})
				.catch(function(err) {
					that.app.setErrorMessage("Error removing scope", "danger", err);
				});

		},

		"actSaveChanges": function(e) {
			e.preventDefault();

			var that = this;
			var redirectURIs;
			var obj;

			console.log("About to save changes");

			this.current.setName(this.el.find("#name").val());
			this.current.setDescr(this.el.find("#descr").val());

			redirectURIs = [];
			this.el.find("input.redirect_uri").each(function(i, item) {
				var x = $(item).val();
				if (x !== '') {
					redirectURIs.push(x);	
				}
			});

			this.current.redirect_uri = redirectURIs;

			obj = this.current.getStorable();
			// console.error("Get storable", obj);

			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});

		},

		"actDelete": function(e) {
			e.preventDefault();
			var that = this;
			this.feideconnect.clientsDelete(this.current.id)
				.then(function() {
					that.emit("deleted", that.current.id);
				});
		}

	});

	return ClientEditor;


});