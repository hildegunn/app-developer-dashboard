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



	var Entity = Model.extend({

		/**
		 * Takes a scope definition as input and returns all scopes that is defined in the 
		 * scopedef, sorted into available, requested and accepted lists.
		 * 
		 * @param  {[type]} scopedef Typically a global scope definition.
		 * @return {[type]}          [description]
		 */
		"getScopes": function(scopedef) {

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
				}
			}
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
		}



	});

	return Entity;


});