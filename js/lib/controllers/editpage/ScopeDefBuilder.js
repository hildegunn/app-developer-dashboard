define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Controller = require('../Controller'),
		scopePolicy = require('../../../../etc/scopepolicy'),

		ScopeDef = require('../../models/ScopeDef'),

		EventEmitter = require('../../EventEmitter'),
		utils = require('../../utils'),
		$ = require('jquery')
		;


	var template = require('text!templates/ScopeDefBuilder.html');



	var ScopeDefBuilder = Controller.extend({
		"init": function(feideconnect) {
			
			var that = this;

			this.feideconnect = feideconnect;

			this.apigk = null;
			this.apigkUpdated = null;

			this._super();

			dust.loadSource(dust.compile(template, "ScopeDefBuilder"));

			// this.ebind("click", ".actScopesSaveChanges", "actScopesSaveChanges");
			this.ebind("click", ".actAddSubScope", "actAddSubScope");
			this.ebind("click", ".actRemoveSubscope", "actRemoveSubscope");

			this.el.on("click", ".actScopesSaveChanges", $.proxy(this.actScopesSaveChanges, this));

		
		},

		"getDef": function() {

			var scopedef = new ScopeDef();


			scopedef.title = this.el.find("#basicTitle").val();
			scopedef.descr = this.el.find("#basicDescr").val();
			if (this.el.find("#basicPolicy").prop("checked")) {
				scopedef.policy.auto = true;
			}

			this.el.find(".subScopeEntry").each(function(i, item) {
				var entry = {
					policy: {"auto": false}
				};
				var scope = $(item).find(".scopeID").val();
				entry.title = $(item).find(".scopeTitle").val();
				entry.descr = $(item).find(".scopeDescr").val();
				if ( $(item).find(".scopePolicy").prop("checked")) {
					entry.policy.auto = true;
				}
				scopedef.subscopes[scope] =entry;
			});

			this.apigkUpdated.scopedef = scopedef;

		},

		"actRemoveSubscope": function(e) {
			e.preventDefault();
			$(e.currentTarget).closest(".subScopeEntry").remove();
		},

		"actAddSubScope": function(e) {
			e.preventDefault();

			this.getDef();
			this.apigkUpdated.scopedef.addEmptySubScope();

			
			this.updateUI();
		},

		"actScopesSaveChanges": function(e) {
			e.preventDefault();




			this.getDef();
			var obj = {
				"id": this.apigk.id,
				"scopedef": this.apigkUpdated.scopedef
			};

			this.setAPIGK(this.apigk);

			// console.log("PING SAVE"); return true;


			this.emit("save", obj);


			console.log("Saving ", obj.scopedef);
			// $("#out").empty().append(JSON.stringify(obj.scopedef, undefined, 4));
		},

		"setAPIGK": function(apigk) {
			this.apigk = apigk;
			this.apigkUpdated = $.extend({}, apigk);

			// console.error("API GK View", apigk, apigk.getView());

			this.updateUI();

			// var view = {};
			// if (apigkview.scopedef) {
			// 	view = this.getView(apigkview.scopedef);
			// }
			
			// this.setScopeDef(view);
		},

		"updateUI": function() {

			var that = this;

			var view = {
				"existing": this.apigk.getView(),
				"updated": this.apigkUpdated.getView()
			};
	
			// console.error("About to re-render view", view);

			dust.render("ScopeDefBuilder", view, function(err, out) {

				that.el.empty();
				that.el.append(out);				

			});

		}

	}).extend(EventEmitter);

	return ScopeDefBuilder;


});