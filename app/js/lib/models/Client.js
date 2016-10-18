define(function(require, exports, module) {
	"use strict";

	var
		moment = require('bower/momentjs/moment'),
		APIGK = require('./APIGK'),
		Entity = require('./Entity'),
		Scope = require('./Scope'),
		utils = require('../utils');

	function parseDate(input) {
		var x = input.substring(0, 19) + 'Z';
		return moment(x);
	}


	var Client = Entity.extend({

		"getView": function() {
			var res = this._super();

			return res;
		},


		"hasEnabledTestUsers": function() {


			if (!this.authproviders) {
				return false;
			}
			
			var i;
			for(i = 0; i < this.authproviders.length; i++) {
				if (this.authproviders[i] === 'all') {
					return true;
				}
				if (this.authproviders[i] === 'other|feidetest') {
					return true;
				}
			}
			return false;

		},


		"getAPIAuthView": function() {
			var view = [];
			// console.error("this.scopeauthorizations", this);
			if (this.hasOwnProperty("scopeauthorizations")) {

				for (var key in this.scopeauthorizations) {
					var x = {};
					x.scope = key;
					x.authorized = this.scopeauthorizations[key];
					view.push(x);
				}
			}

			return view;
		},


		/**
		 * Feed this with a the clients orgauthorizations, and it will return a matrix
		 * containing rows of organizations, and which scopes they have authorized.
		 * 
		 * @param  {[type]} orgauthorizations [description]
		 * @return {[type]}                   [description]
		 */
		"getOrgAdminScopeMatrix": function(apigk) {
			var i, j;
			var data = {
				"scopes": [],
				"orgs": []
			};

			var orgauthorization = this.orgauthorization;
			var orgs = apigk.scopedef.getRealmList();
			var allScopes = this.getScopesObjects();
			var scopes = apigk.getOrgTargetedScopes(allScopes);

			if (scopes.length === 0) {
				// console.error("   ====> No orgadmin scopes here. ", this.name);
				return null;
			}

			for (i = 0; i < scopes.length; i++) {
				data.scopes.push({
					"scope": scopes[i],
					"descr": apigk.scopedef.getScopeDescr(scopes[i])
				});
			}

			for (i = 0; i < orgs.length; i++) {
				var org = orgs[i];
				var orgentry = {
					"org": org,
					"scopes": []
				};
				// console.error("ORGentry", orgentry);

				for (j = 0; j < scopes.length; j++) {
					orgentry.scopes.push(this.hasOrgAuthorized(org, scopes[j]));
				}
				data.orgs.push(orgentry);

			}

			return data;
		},



		"getAPIGKview": function(apigk) {

			var that = this;
			var bs = apigk.getBasicScope();
			var v = this.getView();


			v.sd = apigk.scopedef.getView();
			v.sd.apigkid = apigk.id;

			v.sd.status = {};
			if (this.scopeIsAccepted(bs)) {
				v.sd.status.accepted = true;
			} else if (this.scopeIsRequested(bs)) {
				v.sd.status.requested = true;
			}

			if (v.sd.subscopes) {
				for (var i = 0; i < v.sd.subscopes.length; i++) {
					v.sd.subscopes[i].status = {};
					var siq = bs + '_' + v.sd.subscopes[i].scope;
					if (this.scopeIsAccepted(siq)) {
						v.sd.subscopes[i].status.accepted = true;
					} else if (this.scopeIsRequested(siq)) {
						v.sd.subscopes[i].status.requested = true;
						v.sd.requested = true;
					}
				}
			}

			v.orgadminscopematrix = this.getOrgAdminScopeMatrix(apigk);

			return v;

		},


		"setOneRedirectURI": function(redirect_uri) {
			if (!this.redirect_uri) {
				redirect_uri = [];
			}
			if (redirect_uri.length < 1) {
				this.redirect_uri.push(redirect_uri);
			} else {
				this.redirect_uri[0] = redirect_uri;
			}

		},


		/*
		 * Returns an array with API Gatekeeper IDs represented by scopes found in 
		 * scopes_requested.
		 */
		"getAPIscopes": function() {
			var apis = {},
				api;
			if (!this.scopes_requested) {
				return apis;
			}
			if (!this.scopes_requested.length) {
				return apis;
			}
			for (var i = 0; i < this.scopes_requested.length; i++) {
				api = APIGK.getAPIfromScope(this.scopes_requested[i]);
				if (api !== null) {
					apis[api] = true;
				}
			}
			return utils.getKeys(apis);
		},

		"hasOrgAuthorized": function(realm, scope) {

			// console.error("About to check if has orgauthrizatsion", this.orgauthorization, scope, realm);
			if (!this.orgauthorization) {
				return false;
			}
			if (!this.orgauthorization[realm]) {
				return false;
			}
			for (var i = 0; i < this.orgauthorization[realm].length; i++) {
				if (this.orgauthorization[realm][i] === scope.scope) {
					return true;
				}
			}
			return false;
		}

	});

	return Client;


});
