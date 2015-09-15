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
		}
	});

	return ScopeDef;

});

