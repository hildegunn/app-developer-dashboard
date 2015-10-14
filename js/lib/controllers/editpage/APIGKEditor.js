define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('../Pane'),
		Client = require('../../models/Client'),
		APIGK = require('../../models/APIGK'),
		ScopeDefBuilder = require('./ScopeDefBuilder'),
		Editor = require('./Editor'),
		utils = require('../../utils'),
		$ = require('jquery')
		;


	var apigkTemplate = require('text!templates/APIGKEditor.html');

	var APIGKEditor = Editor.extend({

		"init": function(app, feideconnect) {
				
			var that = this;
			this.editor = "apigk";
			this._super(app, feideconnect);

			var x = dust.compile(apigkTemplate, "apigkeditor");
			dust.loadSource(x);

			this.clients = {};

			this.scopedefbuilder = new ScopeDefBuilder(this.feideconnect, app.app);
			this.scopedefbuilder.on("save", function(obj) {

				that.feideconnect.apigkUpdate(obj)
					.then(function(savedObject) {
						var x = new APIGK(savedObject);
						that.edit(x);
						that.emit("saved", x);
					})
					.catch(function(err) {
						that.app.app.setErrorMessage("Error saving API Gatekeeper", "danger", err);
					});

			});

			this.ebind("click", ".actUpdateAuthz", "actUpdateAuthz");
			this.ebind("click", ".actSaveChanges", "actSaveChanges");
			this.ebind("click", ".actDelete", "actDelete");

		},

		"loadClients": function() {

			var that = this;
			return new Promise(function(resolve, reject) {

			});
		},

		"setTabHashFragment": function(tabid) {
			var orgid = this.app.orgid;
			this.app.app.setHash('/' + orgid + '/apigk/' + this.current.id + '/edit/' + tabid);
		},

		"logoUploaded": function(data) {
			var that = this;
			this.feideconnect.apigkUpdateLogo(that.current.id, data)
				.then(function() {
					var _config = that.feideconnect.getConfig();
					var url = _config.apis.core + "/apigkadm/apigks/" + that.current.id + "/logo?r=" + utils.guid();
					that.el.find('.itemlogo').attr("src", url);
					that.emit("saved", that.current);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage("Error uploading logo", "danger", err);
				});
		},

		"updateQueueCount": function(count) {

			this.el.find(".queuecount").empty().append(count);

			if (count > 0) {
				this.el.find(".queuecount").css("display", "inline");
			} else {
				this.el.find(".queuecount").hide();
			}

		},




		"edit": function(item, setTab) {

			var that = this;
			this.current = item;

			var view = item.getView(this.feideconnect);
			// console.error("About to pass on view", view);
			this.scopedefbuilder.setAPIGK(item);
			
			if (this.feideconnect) {
				$.extend(view, {
					"_config": that.feideconnect.getConfig()
				});
			}

			// that.feideconnect.clientsByScope(this.current.getBasicScope()).
			// 	then(function(clients) {

			that.app.getClientRequests()
				.then(function(clients) {

					var i, nc, cv;
					view.clients = [];
					view.clientsReq = [];
					
					var reqClientsReq = [];

					for (i = 0; i < clients.length; i++) {
						nc = new Client(clients[i]);
						that.clients[nc.id] = nc;
						cv = nc.getAPIGKview(that.current);

						// console.error("Processing API GK View", cv);

						if (cv.sd.authz) {
							view.clients.push(cv);
						}
						if (cv.sd.req) {
							view.clientsReq.push($.extend({}, cv));
						} 

					}


					// $("#debug").append("<pre style='background-color: #cc7; margin-bottom: 5em'>" + JSON.stringify(view, undefined, 4) + "</pre>");


					console.error("view is ", view);
					dust.render("apigkeditor", view, function(err, out) {

						var tab = that.currentTab;
						if (setTab) {
							tab = setTab;
						} 
						that.el.children().detach();
						that.el.append(out);
						that.selectTab(tab);

						that.el.find("#scopedef").append(that.scopedefbuilder.el);
						that.updateQueueCount(view.clientsReq.length);

					});
				
				});


			this.activate();
		},

		"actUpdateAuthz": function(e) {

			e.preventDefault();

			var that = this;
			var clientContainer = $(e.currentTarget).closest("div.authzClient");
			var clientid = clientContainer.data("clientid");





			// console.log("Client container", clientContainer);

			var scopes = {};

			$(clientContainer).find("input.authscope").each(function(i, item) {
				// console.log("Auth z input element", item);
				var scope = $(item).data("scopemoderate");
				var enabled = $(item).prop("checked");
				scopes[scope] = enabled;
			});

			$(clientContainer).find("input.radioscopeauthz:checked").each(function(i, item) {
				// console.log("Auth z input radio element", item);
				var scope = $(item).attr("name");
				var enabled = ($(item).attr("value") === 'accept');
				// console.error("SCOPE ENABLED", scope, enabled);
				scopes[scope] = enabled;
			});


			var authorizeScopes = {
				"scopes_add": [],
				"scopes_remove": []
			};


			var client = this.clients[clientid];
			for(var scope in scopes) {
				if (scopes[scope]) {
					authorizeScopes.scopes_add.push(scope);
				} else {
					authorizeScopes.scopes_remove.push(scope);
				}
			}


			this.feideconnect.clientsAuthorizeAPIGKscopes(clientid, authorizeScopes)
				.then(function(savedObject) {
					var x = new Client(savedObject);
					that.clients[clientid] = x;
					that.edit(that.current);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage("Error authorize API scopes", "danger", err);
				});

		},

		"actSaveChanges": function(e) {
			e.preventDefault();

			var that = this;
			var obj;

			this.current.name = this.el.find("#apiname").val();
			this.current.descr = this.el.find("#apidescr").val();
			this.current.endpoints = [this.el.find("#endpoint").val()];


			this.current.systemdescr = this.el.find('#systemdescr').val();
			if (this.current.systemdescr === '') {
				this.current.systemdescr = null;
			}	

			this.current.privacypolicyurl = this.el.find('#privacypolicyurl').val();
			if (this.current.privacypolicyurl === '') {
				this.current.privacypolicyurl = null;
			}


			this.current.docurl = this.el.find('#docurl').val();
			if (this.current.docurl === '') {
				this.current.docurl = null;
			}

			this.current.setStatusPublic(this.el.find('#ispublic').prop("checked"));


			obj = this.current.getStorable(["id", "name", "descr", "systemdescr", 
				"privacypolicyurl", "docurl", "status"]);

			that.feideconnect.apigkUpdate(obj)
				.then(function(savedObject) {
					var x = new APIGK(savedObject);
					that.edit(x);
					that.emit("saved", x);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage("Error saving API Gatekeeper", "danger", err);
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