define(function(require, exports, module) {
	"use strict";

	var
		moment = require('bower/momentjs/moment'),
		Model = require('./Model'),
		Scope = require('./Scope'),
		utils = require('../utils');


	function parseDate(input) {
		var x = input.substring(0, 19) + 'Z';
		return moment(x);
	}

	// Helper Sorter function to sort scopedef-array
	var ssorter = function(a, b) {
		var x = a.scope || '_';
		var y = b.scope || '_';
		return x < y ? -1 : x > y ? 1 : 0;
	};



	var Entity = Model.extend({

		/**
		 * Takes a scope definition as input and returns all scopes that is defined in the
		 * scopedef, sorted into available, requested and accepted lists.
		 *
		 * @param  {[type]} scopedef Typically a global scope definition.
		 * @return {[type]}          [description]
		 */
		"getScopes": function(scopedef, includeHidden) {

			var res = {
				"available": [],
				"requested": [],
				"accepted": []
			};

			for (var scope in scopedef) {
				var x = scopedef[scope];
				x.scope = scope;
				if (this.scopeIsAccepted(scope)) {
					res.accepted.push(x);
				} else if (this.scopeIsRequested(scope)) {
					res.requested.push(x);
				} else if (x.public) {
					res.available.push(x);
				} else if (includeHidden) {
					res.available.push(x);
				}
			}
			res.available.sort(ssorter);
			res.requested.sort(ssorter);
			res.accepted.sort(ssorter);

			// console.error("Scope list", res);

			return res;
		},


		"setName": function(name) {
			this.name = name;
		},

		"setDescr": function(descr) {
			this.descr = descr;
		},

		"addScopes": function(scopes) {
			for (var i = 0; i < scopes.length; i++) {
				this.addScope(scopes[i]);
			}
		},

		"addScope": function(scope) {
			var exists = false;
			var existingScopes = [];
			var newscopes = [];
			if (this.scopes_requested && this.scopes_requested.length) {
				existingScopes = this.scopes_requested;
			}
			for (var i = 0; i < existingScopes.length; i++) {
				if (existingScopes[i] === scope) {
					exists = true;
				}
				newscopes.push(existingScopes[i]);
			}
			if (!exists) {
				newscopes.push(scope);
			}
			this.scopes_requested = newscopes;
		},

		"removeScope": function(scope) {
			var existingScopes = [];
			var newscopes = [];
			if (this.scopes_requested && this.scopes_requested.length) {
				existingScopes = this.scopes_requested;
			}
			for (var i = 0; i < existingScopes.length; i++) {
				if (existingScopes[i] !== scope) {
					newscopes.push(existingScopes[i]);
				}
			}
			this.scopes_requested = newscopes;
		},




		/**
		 * Check if a scope is found in "scopes"
		 * @param  {[type]} scope [description]
		 * @return {[type]}       [description]
		 */
		"scopeIsAccepted": function(scope) {
			if (!this.scopes) {
				return false;
			}
			if (!this.scopes.length) {
				return false;
			}
			for (var i = 0; i < this.scopes.length; i++) {
				if (scope === this.scopes[i]) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Check if a scope is found in "scopes_requested"
		 * @param  {[type]} scope [description]
		 * @return {[type]}       [description]
		 */
		"scopeIsRequested": function(scope) {
			if (!this.scopes_requested) {
				return false;
			}
			if (!this.scopes_requested.length) {
				return false;
			}
			for (var i = 0; i < this.scopes_requested.length; i++) {
				if (scope === this.scopes_requested[i]) {
					return true;
				}
			}
			return false;
		},



		"getScopesObjects": function() {
			var list = [];
			if (!this.scopes) {
				return list;
			}
			for (var i = 0; i < this.scopes.length; i++) {
				list.push(new Scope({
					"scope": this.scopes[i]
				}));
			}
			return list;
		},

		"getView": function() {
			var res = this._super();
			if (this.created) {
				res.created = parseDate(this.created);
			}

			if (this.updated) {
				res.updated = parseDate(this.updated);
			}

			if (this.organization && this.organization !== null) {
				res.trustOrg = true;
			} else if (this.owner && this.owner !== null) {
				res.trustOwner = true;
			}
			return res;
		}

	});

	/**
	 * Given an api gatekeeper and a client compute a matrix
	 * containing rows of organizations, and which scopes they have authorized.
	 */
	Entity.getOrgAdminScopeMatrix = function(apigk, client) {
		var i, j;
		var data = {
			"scopes": [],
			"orgs": []
		};

		var orgauthorization = client.orgauthorization;
		var orgs = apigk.scopedef.getRealmList();
		var allScopes = client.getScopesObjects();
		var scopes = apigk.getOrgTargetedScopes(allScopes);

		if (scopes.length === 0) {
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

			for (j = 0; j < scopes.length; j++) {
				orgentry.scopes.push(client.hasOrgAuthorized(org, scopes[j]));
			}
			data.orgs.push(orgentry);

		}

		return data;
	};

	return Entity;


});
