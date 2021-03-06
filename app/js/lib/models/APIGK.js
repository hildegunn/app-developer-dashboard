define(function(require, exports, module) {
	"use strict";

	var
		Entity = require('./Entity'),
		ScopeDef = require('./ScopeDef');

	function parseURL(url) {
		var l = document.createElement("a");
		l.href = url;
		return l;
	}



	var APIGK = Entity.extend({
		"init": function(props) {

			if (props.scopedef) {
				this.scopedef = new ScopeDef(props.scopedef);
				delete props.scopedef;
			}

			this._super(props);
		},



		"setStatusPublic": function(ispublic) {
			this.setStatusProp("public", ispublic);
		},

		"setStatusProp": function(prop, value) {
			var props = this.getStatusProps();
			props[prop] = value;
			this.setStatusProps(props);
		},

		"getStatusProps": function() {
			var props = {};
			if (typeof this.status === 'undefined' || this.status === null) {
				return props;
			}
			for (var i = 0; i < this.status.length; i++) {
				props[this.status[i]] = true;
			}
			return props;
		},

		"setStatusProps": function(props) {
			var proplist = [];
			for (var key in props) {
				if (props[key] === true) {
					proplist.push(key);
				}
			}
			this.status = proplist;
		},


		"searchMatch": function(term) {
			var re = new RegExp(term);
			if (this.name && this.name.toLowerCase().match(re)) {
				return true;
			}
			if (this.descr && this.descr.toLowerCase().match(re)) {
				return true;
			}
			return false;
		},

		"increaseClientRequestCounter": function() {
			if (!this.clientRequestCounter) {
				this.clientRequestCounter = 0;
			}
			this.clientRequestCounter++;
		},


		"getView": function() {
			var res = this._super();

			if (this.scopedef) {
				res.scopedef = this.scopedef.getView();
			} else {
				res.scopedef = [];
			}

			// console.error("typeo f", typeof this.owner, this.owner);

			res.statuses = this.getStatusProps();

			// We want to get this from Core API. Seems reasonable to introduce this at the same time
			// as we start to register which remote API gatekeeper to use for each API.
			res.baseurl = 'https://' + this.id + '.dataporten-api.no/';

			res.clientRequests = 0;
			res.hasClientRequests = false;
			if (this.clientRequestCounter && this.clientRequestCounter > 0) {
				res.clientRequests = this.clientRequestCounter;
				res.hasClientRequests = true;
			}
			if (this.endpoints) {
				var url = parseURL(this.endpoints[0]);
				res.exampleHost = url.hostname;
				var path = url.pathname;
				if (path.substring(path.length - 1, 1) === '/') {
					path = path.substring(0, path.length - 1);
				}
				res.examplePathPrefix = path;
			}

			return res;
		},



		/**
		 * This view is used in orgadmin, when you feed a set of scopes, and wheter each of them is either 
		 * authorized or not.
		 */
		"getOrgAdminView": function(scopes) {

			var view = this.getView();

			var that = this;
			view.scopeauths = scopes.map(function(x) {
				var xv = {
					"authorized": x.authorized,
					"scope": that.scopedef.getScopeDescr(x.scope)
				};
				xv.scope.id = x.scope.scope;
				return xv;
			});

			return view;

		},



		"getOrgTargetedScopes": function(scopes) {
			var list = [];

			for (var i = 0; i < scopes.length; i++) {
				if (!scopes[i].belongsTo(this)) {
					// console.error("Skipping scope because it does not belong to " + this.id, scopes[i]);
					continue;
				}
				if (!this.scopedef.isScopeOrgAdmin(scopes[i])) {
					// console.error("Skipping scope because it is not orgadmin scope ", scopes[i]);
					continue;
				}
				list.push(scopes[i]);
			}

			return list;

		},

		"getClientView": function(client) {
			var v = this.getView();
			v.sd = this.scopedef.getRequestView(this, client);

			v.orgadminscopematrix = Entity.getOrgAdminScopeMatrix(this, client);

			// console.error("Get client view of API Gatekeeper", JSON.stringify(v.scopematrix, undefined, 4));
			// console.error("Get client view of API Gatekeeper", JSON.stringify(v, undefined, 4));

			return v;
		},

		/**
		 * Returns the scope representing basic access for this API Gatekeeper.
		 * 
		 * @return {[type]} Scope, like this `gk_foodleapi`
		 */
		"getBasicScope": function() {
			return "gk_" + this.id;
		}



	});

	// --- Static functions: ----

	APIGK.getAPIfromScope = function(scope) {
		var match = scope.match(/^gk_([a-z0-9\-]+)(_([a-z0-9\-]+))?$/);
		if (match !== null) {
			return match[1];
		}
		return null;
	};

	return APIGK;


});
