define(function(require, exports, module) {
	"use strict";	

	var 
		Model = require('./Model')
		;

	var Owner = Model.extend({

		"getView": function() {
			var res = this._super();
			return res;
		}
	});

	return Owner;

});

