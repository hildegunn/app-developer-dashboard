define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('../Pane'),

		Dictionary = require('../../Dictionary'),
		EventEmitter = require('../../EventEmitter'),
		TemplateEngine = require('../../TemplateEngine'),

		APIScopeSet = require('../../models/APIScopeSet'),
		utils = require('../../utils'),
		$ = require('jquery')
		;

	var 
		template = require('text!templates/OrgAdminAPIAuthorization.html')
		;

	/*
	 * This controller controls API authorization view. Org admins will list clients that requests access to APIs for 
	 * each org.
	 */
	var OrgAdminAPIAuthorizationPane = Pane.extend({
		"init": function(feideconnect, orgapp, orgAdminAPIclients, publicapis) {

			var that = this;
			this.feideconnect = feideconnect;
			this.orgapp = orgapp;
			this.orgAdminAPIclients = orgAdminAPIclients;
			this.publicapis = publicapis;

			this.apiscopeset = new APIScopeSet(feideconnect, orgAdminAPIclients, publicapis);

			this._super();

			this.tmp = new TemplateEngine(template);

			this.ebind("click", ".actSaveChanges", "actSaveChanges");

		},


		"actSaveChanges": function(e) {
			e.preventDefault();
			var that = this;


			var data = {};


			var items = [];
			this.el.find("input.scopeauthentry").each(function(i, item) {
				var clientid = $(item).data("clientid");
				var scope = $(item).data("scopeid");
				var checked = $(item).prop("checked");

				if (!data[clientid]) {
					data[clientid] = [];
				}
				if (checked) {
					data[clientid].push(scope);	
				}
				
			});
			var orgid = this.orgapp.orgid.substring(7);



			var toUpdate = [];
			for(var key in data) {
				toUpdate.push({
					"client": key,
					"scopes": data[key]
				});
			}


			return toUpdate.reduce(function(current, client) {
				// console.error("UPDATING", orgid, client.client, client.scopes);
				return that.feideconnect.updateOrgAuthorizations(orgid, client.client, client.scopes);
			}, Promise.resolve())
				.then(function() {
					that.orgapp.app.setErrorMessage("Successfully updated API authorizations.", "success");
				})
				.catch(function(err) {
					that.orgapp.app.setErrorMessage("Failed to update API Authorizations", "danger", err);
				})
				.then(function() {
					return that.reload();
				});
		},


		"initLoad": function() {
			return Promise.all([
					this.orgAdminAPIclients.onLoaded(),
					this.apiscopeset.onLoaded(),
				])
				.then(this.proxy("draw"))
				.then(this.proxy("_initLoaded")).catch(function(err) {
					console.error("Error loading [OrgAdminAPIAuthorizationPane]", err);
				});
		},

		"reload": function() {
			var that = this;
			this.orgAdminAPIclients.load()
				.then(function() {
					that.apiscopeset.updateOrgAdminAPIclients(that.orgAdminAPIclients);
					return that.draw();
				});
		},	

		"draw": function() {
			var that = this;
			var clientview = this.apiscopeset.getClientView();
			var view = {
				"_config": that.feideconnect.getConfig(),
				"clients": clientview
			};

			this.el.children().detach();
			return this.tmp.render(this.el, view);

		}
	}).extend(EventEmitter);

	return OrgAdminAPIAuthorizationPane;

});