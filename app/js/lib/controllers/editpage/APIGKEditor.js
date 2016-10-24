define(function(require, exports, module) {
	"use strict";

	var
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

		"init": function(app, feideconnect, usercontext) {

			var that = this;
			this.usercontext = usercontext;
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
					that.app.app.setErrorMessage(that.dict.get().error_saving_api_gatekeeper, "danger", err);
				});
		},

		"loadScopeDef": function() {
			var that = this;

			return this.feideconnect.getScopeDef().then(function(scopePolicy) {
				that.scopePolicy = scopePolicy;
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
					var url = that.feideconnect.apigkLogoURL(that.current.id) + "?r=" + utils.guid();
					that.el.find('.itemlogo').attr("src", url);
					that.emit("saved", that.current);
				})
				.catch(function(err) {
					that.app.app.setErrorMessage(that.dict.get().error_uploading_logo, "danger", err);
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

			var includeHidden = this.usercontext.isPlatformAdmin();
			var scopes = item.getScopes(this.scopePolicy, includeHidden);

			if (this.feideconnect) {
				$.extend(view, {
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

						// console.error("Processing API GK View of a client", JSON.stringify(cv, undefined, 2));
						// console.error("Orgauthorizations", cv.name, nc.orgauthorization);

						if (cv.sd.status.accepted) {
							view.clients.push(cv);
						}
						if (cv.sd.status.requested) {
							view.clientsReq.push($.extend({}, cv));
						}

					}


					that.el.children().detach();
					// console.error("VIEW", view);
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
					that.app.app.setErrorMessage(that.dict.get().error_authorize_api_scopes, "danger", err);
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
			this.current.allow_unauthenticated = this.el.find('.fieldallow_unauthenticated').prop("checked");
			this.current.setStatusPublic(this.el.find('#ispublic').prop("checked"));

			return this.save(["id", "name", "descr", "endpoints", "systemdescr",
			                  "privacypolicyurl", "docurl", "status", "requireuser", "allow_unauthenticated"
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
					that.app.app.setErrorMessage(that.dict.get().error_deleting_api_gatekeeper, "danger", err);
				});
		}

	});

	return APIGKEditor;


});
