define(function(require, exports, module) {
	"use strict";	

	var 
		$ = require('jquery'),
		moment = require('bower/momentjs/moment'),
		Model = require('./Model'),
		Client = require('./Client'),
		ScopeDef = require('./ScopeDef')
	;

	function parseDate (input) {
		var x = input.substring(0, 19) + 'Z';
		// console.log("About to parse date " + input, x);
		return moment(x);
	}


	var APIGK = Model.extend({
		"init": function(props) {

			if (props.scopedef) {
				this.scopedef = new ScopeDef(props.scopedef);
				delete props.scopedef;
			}

			this._super(props);
		},

		"increaseClientRequestCounter": function() {
			if  (!this.clientRequestCounter) {
				this.clientRequestCounter = 0;
			}
			this.clientRequestCounter++;
		},

		"getView": function() {
			var res = this._super();

			if (this.created) {
				res.created = parseDate(this.created);
				res.createdAgo = res.created.fromNow();
				res.createdH = res.created.format('D. MMM YYYY');
			}

			if  (this.updated) {
				res.updated = parseDate(this.updated);
				res.updatedAgo = res.updated.fromNow();
				res.updatedH = res.updated.format('D. MMM YYYY');
			}

			if (this.scopedef) {
				res.scopedef = this.scopedef.getView();
			} else {
				res.scopedef = [];
			}

			res.clientRequests = 0;
			res.hasClientRequests = false;
			if (this.clientRequestCounter && this.clientRequestCounter > 0) {
				res.clientRequests = this.clientRequestCounter;
				res.hasClientRequests = true;
			}

			return res;			
		},

		"getClientView": function(client) {
			// console.error("Client ", client);
			// if (typeof client !== 'object') throw new Error("Cannot getClientView without providing a valid Client object");
			// if (new Client()  instanceof Client.prototype) {
			// 	throw new Error("Cannot getClientView without providing a valid Client object.");
			// }

			var that = this;
			var bs = this.getBasicScope();
			var authz = client.scopeIsAccepted(bs);
			var v = this.getView();

			v.sd = $.extend({}, v.scopedef);
			// v.sd.clientid = apigk.id;
			v.sd.authz = authz;

			v.sd.req = false;
			if (!client.scopeIsAccepted(bs) && client.scopeIsRequested(bs)) {
				v.sd.req = true;
			}

			if (v.sd.subscopes) {
				for(var i = 0; i < v.sd.subscopes.length; i++) {
					v.sd.subscopes[i].status = {};
					var siq = bs + '_' + v.sd.subscopes[i].scope;
					if (client.scopeIsAccepted(siq)) {
						v.sd.subscopes[i].status.accepted = true;
						v.sd.subscopes[i].status.checked = true;
					} else if (client.scopeIsRequested(siq)) {
						v.sd.subscopes[i].status.requested = true;
						v.sd.subscopes[i].status.checked = true;
						v.sd.req = true;
					}

				}

			}

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
		if (match !== null) {return match[1];}
		return null;
	};

	return APIGK;


});

