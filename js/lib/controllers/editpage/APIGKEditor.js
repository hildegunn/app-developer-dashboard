define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),
		Client = require('../../models/Client'),
		APIGK = require('../../models/APIGK'),
		ScopeDefBuilder = require('./ScopeDefBuilder'),
		Editor = require('./Editor'),
		scopePolicy = require('../../../../etc/scopepolicy'),
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

			this.scopedefbuilder = new ScopeDefBuilder(this.feideconnect);
			this.scopedefbuilder.on("save", function(obj) {

				console.log("About to save: ", obj);
				that.feideconnect.apigkUpdate(obj, function(savedClient) {
					var x = new APIGK(savedClient);
					that.edit(x);
					that.emit("saved", x);
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



		"logoUploaded": function(data) {
			var that = this;
			this.feideconnect.apigkUpdateLogo(that.current.id, data)
				.then(function() {
					var url = "http://api.dev.feideconnect.no:6543/apigkadm/apigks/" + that.current.id + "/logo?r=" + utils.guid();
					that.el.find('.itemlogo').attr("src", url);
					that.emit("saved", that.current);
				})
				.catch(function(err) {
					that.app.setErrorMessage("Error uploading logo", "danger", err);
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
			console.log("About to pass on view", view);
			this.scopedefbuilder.setAPIGK(item);
			
			if (this.feideconnect) {
				$.extend(view, {
					"_config": that.feideconnect.getConfig()
				});
			}

			// that.feideconnect.clientsByScope(this.current.getBasicScope()).
			// 	then(function(clients) {

			that.feideconnect.apigkClientRequests()
				.then(function(clients) {

					var i, nc, cv;
					// console.error("clientsByScope", clients);
					
					view.clients = [];
					view.clientsReq = [];

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


					// console.error("view is ", view);
					dust.render("apigkeditor", view, function(err, out) {

						var tab = that.currentTab;
						if (setTab) tab = setTab;
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





			console.log("Client container", clientContainer);

			var scopes = {};

			$(clientContainer).find("input.authscope").each(function(i, item) {
				console.log("Auth z input element", item);
				var scope = $(item).data("scopemoderate");
				var enabled = $(item).prop("checked");
				scopes[scope] = enabled;
			});

			$(clientContainer).find("input.radioscopeauthz:checked").each(function(i, item) {
				console.log("Auth z input radio element", item);
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

			// console.error("ABOUT TOP UPDATE AUTHORIZATION", authorizeScopes.scopes_add, authorizeScopes.scopes_remove);
			// return;


			this.feideconnect.clientsAuthorizeAPIGKscopes(clientid, authorizeScopes, function(savedClient) {
				var x = new Client(savedClient);
				that.clients[clientid] = x;
				that.edit(that.current);

				// that.edit(x);
				// that.emit("saved", x);
			}).catch(function(err) {
				that.app.setErrorMessage("Error authorizing client scopes", "danger", err);
			});


			console.error("Update authoizations for ", clientid, authorizeScopes);


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