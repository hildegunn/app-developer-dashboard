define(function(require, exports, module) {
	"use strict";

	var
		dust = require('dust'),
		Pane = require('../Pane'),
		Client = require('../../models/Client'),
		Dictionary = require('../../Dictionary'),
		TemplateEngine = require('bower/feideconnectjs/src/TemplateEngine'),

		APIGK = require('../../models/APIGK'),
		ScopeDefBuilder = require('./ScopeDefBuilder'),
		Editor = require('./Editor'),
		utils = require('../../utils'),
		$ = require('jquery');


	var apigkTemplate = require('text!templates/APIGKEditor.html');

	var APIGKEditor = Editor.extend({

		"init": function(app, feideconnect) {

			var that = this;
			this.editor = "apigk";
			this._super(app, feideconnect);

			this.dict = new Dictionary();
			this.template = new TemplateEngine(apigkTemplate, this.dict);

			this.clients = {};

			this.scopedefbuilder = new ScopeDefBuilder(this.feideconnect, app.app);
			this.scopedefbuilder.on("save", function(obj) {
				that.current.scopedef = obj.scopedef;
				return that.save(["scopedef", "id"]);
			});

			this.ebind("click", ".actUpdateAuthz", "actUpdateAuthz");

			this.initLoad();
		},


		"initLoad": function() {

			return this.loadScopeDef()
				.then(this.proxy("_initLoaded"));

		},


		"save": function(properties) {
			var obj = this.current.getStorable(properties);
			var that = this;
			return that.feideconnect.apigkUpdate(obj)
				.then(function(savedObject) {
					var x = new APIGK(savedObject);
					that.edit(x);
					that.emit("saved", x);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage("Error saving API Gatekeeper", "danger", err);
				});
		},

		"loadScopeDef": function() {

			var fcc = this.feideconnect.getConfig();
			var endpoint = fcc.apis.core + '/clientadm/scopes/';
			var that = this;

			// console.error("Scope policy is", endpoint);

			return new Promise(function(resolve, reject) {
				$.getJSON(endpoint, function(scopePolicy) {
					// console.error("Scope policy is", scopePolicy);
					that.scopePolicy = scopePolicy;
					resolve();
				});
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

			// console.error("Scope policy", this.scopePolicy);

			var scopes = item.getScopes(this.scopePolicy);

			if (this.feideconnect) {
				$.extend(view, {
					"_config": that.feideconnect.getConfig(),
					"_appconfig": that.app.app.config,
					"scopelist": scopes
				});
			}

			this.app.app.bccontroller.draw([
				this.app.getBCItem(), {
					"title": 'API GK ' + item.name,
					"active": true
				}
			]);



			// that.feideconnect.clientsByScope(this.current.getBasicScope()).
			// 	then(function(clients) {

			that.app.getClientRequests()
				.then(function(clients) {

					var i, nc, cv;
					view.clients = [];
					view.clientsReq = [];

					var reqClientsReq = [];

					for (i = 0; i < clients.length; i++) {

						// clients[i].orgauthorization = {
						// 	"uninett.no": ["gk_scopetestapi"]
						// };

						nc = new Client(clients[i]);
						that.clients[nc.id] = nc;
						cv = nc.getAPIGKview(that.current);

						// console.error("Processing API GK View of a client", JSON.stringify(cv, undefined, 2));
						// console.error("Orgauthorizations", cv.name, nc.orgauthorization);

						if (cv.sd.authz) {
							view.clients.push(cv);
						}
						if (cv.sd.req) {
							view.clientsReq.push($.extend({}, cv));
						}

					}


					// $("#debug").append("<pre style='background-color: #cc7; margin-bottom: 5em'>" + JSON.stringify(view, undefined, 4) + "</pre>");


					that.el.children().detach();
					console.error("VIEW", view);
					that.template.render(that.el, view)
						.then(function() {
							var tab = that.currentTab;
							if (setTab) {
								tab = setTab;
							}
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
			for (var scope in scopes) {
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
			this.current.descr = this.el.find("#descr").val();
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

			this.current.requireuser = this.el.find('.fieldrequireuser').prop("checked");
			this.current.setStatusPublic(this.el.find('#ispublic').prop("checked"));

			return this.save(["id", "name", "descr", "endpoints", "systemdescr",
				"privacypolicyurl", "docurl", "status", "requireuser"
			]);

		},


		"actDelete": function(e) {
			e.preventDefault();
			var that = this;
			this.feideconnect.apigkDelete(this.current.id)
				.then(function(data) {
					that.emit("deleted", that.current.id);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage("Error deleting API Gatekeeper", "danger", err);
				});
		}

	});

	return APIGKEditor;


});