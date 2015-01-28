define(function(require, exports, module) {

	var 
		moment = require('bower/momentjs/moment'),
		Model = require('./Model')
	;

	function parseDate (input) {
		var x = input.substring(0, 19) + 'Z';
		console.log("About to parse date " + input, x);
		return moment(x);
	}


	var APIGK = Model.extend({
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


			res.foo = "#bar";

			return res;			
		}
	});

	return APIGK;


});

