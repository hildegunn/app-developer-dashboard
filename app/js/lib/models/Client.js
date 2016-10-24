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
			res.entityType = 'client';

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

		"getAPIGKview": function(apigk) {
			var v = this.getView();
			v.sd = apigk.scopedef.getRequestView(apigk, this);

			v.orgadminscopematrix = Entity.getOrgAdminScopeMatrix(apigk, this);

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
