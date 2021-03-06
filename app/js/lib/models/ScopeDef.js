define(function(require, exports, module) {
	"use strict";	

	var 
		Model = require('./Model'),
		$ = require('jquery')
		;

	var ScopeDef = Model.extend({

		"init": function(props) {

			this.title = "Basic access";
			this.subscopes = {};
			this.policy = {
				"auto": false,
				"orgadmin": {
					"moderate": false
				}
			};

			this._super(props);

		},


		/*
		 * Provide a scope that is controlled upon this scope policy definition
		 * Check whether or not this scope has orgadmin policy for moderation...
		 */
		"isScopeOrgAdmin": function(scope) {

			if (scope.isBasic) {
				return (this.policy.orgadmin && this.policy.orgadmin.moderate);
			}
			return (this.subscopes && this.subscopes[scope.subscope] && this.subscopes[scope.subscope].policy && 
				this.subscopes[scope.subscope].policy.orgadmin && this.subscopes[scope.subscope].policy.orgadmin.moderate);

		},

		"getOrgList": function() {

			if (this.policy.orgadmin && this.policy.orgadmin.target) {
				return this.policy.orgadmin.target;
			}
			if (this.subscopes) {
				for(var key in this.subscopes) {
					if (this.subscopes[key].policy.orgadmin && this.subscopes[key].policy.orgadmin.target) {
						return this.subscopes[key].policy.orgadmin.target;
					}
				}	
			}
			return [];
		},

		"getRealmList": function() {

			var matcher = /^feide\|realm\|(.*?)$/;
			var realms = this.getOrgList().reduce(function(prev, curr) {
				var m = curr.match(matcher);
				if (m) {
					// console.error(m);
					prev.push(m[1]);
					return prev;
				}
				return prev;
			}, []);
			return realms;
		},
			
		"addEmptySubScope": function() {

			var i = 1;
			var scope = 'new' + i;
			while (this.subscopes.hasOwnProperty(scope)) {
				++i;
				scope = 'new' + i;
			}

			this.subscopes[scope] = {
				"title": "",
				"descr": "",
				"policy": {
					"auto": false,
					"orgadmin": {
						"moderate": false
					}
				}
			};

		},

		"getBasicScopeDescr": function() {
			var x = {
				"title": this.title
			};
			if (this.descr) {
				x.descr = this.descr;
			}
			return x;
		},

		"getSubScopeDescr": function(subscope) {
			var x = {};
			if (this.subscopes && this.subscopes[subscope]) {
				x.title = this.subscopes[subscope].title;
				x.descr = this.subscopes[subscope].descr;
				return x;
			}
			return null;
		},

		"getScopeDescr": function(scope) {

			if (scope.isBasic) {
				return this.getBasicScopeDescr();
			}
			if (scope.subscope) {
				return this.getSubScopeDescr(scope.subscope);
			}
			return null;
		},

		"getView": function() {
			var res = this._super();

			var s = [], x;
			if (res.subscopes) {
				for (var key in res.subscopes) {
					x = $.extend({}, res.subscopes[key]);
					x.scope = key;
					s.push(x);
				}
			}
			res.subscopes = s;
			return res;
		},

		"getRequestView": function(apigk, client) {
			var bs = apigk.getBasicScope();
			var sd = this.getView();
			sd.apigkid = apigk.id;
			sd.fullid = bs;
			sd.status = {};
			if (client.scopeIsAccepted(bs)) {
				sd.status.accepted = true;
				sd.status.checked = true;
			} else if (client.scopeIsRequested(bs)) {
				sd.status.requested = true;
				sd.status.checked = true;
			}

			if (sd.subscopes) {
				for (var i = 0; i < sd.subscopes.length; i++) {
					sd.subscopes[i].status = {};
					var siq = bs + '_' + sd.subscopes[i].scope;
					sd.subscopes[i].fullid = siq;
					if (client.scopeIsAccepted(siq)) {
						sd.subscopes[i].status.accepted = true;
						sd.subscopes[i].status.checked = true;
					} else if (client.scopeIsRequested(siq)) {
						sd.subscopes[i].status.requested = true;
						sd.subscopes[i].status.checked = true;
						sd.status.requested = true;
					}

				}

			}
			return sd;
		}
	});

	return ScopeDef;

});

