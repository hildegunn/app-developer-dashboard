define(function(require, exports, module) {

	var 
		moment = require('bower/momentjs/moment'),
		Model = require('./Model'),
		ScopeDef = require('./ScopeDef')
	;

	function parseDate (input) {
		var x = input.substring(0, 19) + 'Z';
		console.log("About to parse date " + input, x);
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

		/**
		 * Returns the scope representing basic access for this API Gatekeeper.
		 * 
		 * @return {[type]} Scope, like this `gk_foodleapi`
		 */
		"getBasicScope": function() {
			return "gk_" + this.id;
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
				res.scopes = [];
			}

			return res;			
		}

	});

	// --- Static functions: ----

	APIGK.getAPIfromScope = function(scope) {
		var match = scope.match(/^gk_([a-z0-9\-]+)(_([a-z0-9\-]+))?$/);
		if (match !== null) return match[1];
		return null;
	};

	return APIGK;


});

