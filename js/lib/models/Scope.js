define(function(require, exports, module) {
	"use strict";	

	var 
		Model = require('./Model')
		;

	var Scope = Model.extend({

		"init": function(props) {



			this._super(props);


			if (props.scope) {
				var foundbasic = props.scope.match(/^gk_([a-z0-9]+)$/);
				if (foundbasic) {
					this.isBasic = true;
					this.apigk = foundbasic[1];
				} else {

					var foundsubscope = props.scope.match(/^gk_([a-z0-9]+)_([a-z0-9]+)$/);
					if (foundsubscope) {
						this.isBasic = false;
						this.apigk = foundsubscope[1];
						this.subscope = foundsubscope[2];
					}
				}
			}

		},

		/*
		 * Does this scope belong to a given apigk?
		 */
		"belongsTo": function(apigk) {
			// console.log("Compare ", this.apigk, apigk.id);
			if (!this.apigk) {
				return false;
			}
			if (this.apigk === apigk.id) {
				return true;
			}
			return false;
		}



		// "getView": function() {
		// 	var res = this._super();
		// 	return res;
		// }
		
	});

	return Scope;

});

