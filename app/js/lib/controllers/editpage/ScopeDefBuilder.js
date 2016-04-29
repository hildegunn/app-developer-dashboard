define(function(require, exports, module) {
	"use strict";

	var
		dust = require('dust'),
		Controller = require('../Controller'),

		ScopeDef = require('../../models/ScopeDef'),
		OrgListSelector = require('./OrgListSelector'),

		EventEmitter = require('../../EventEmitter'),
		utils = require('../../utils'),
		$ = require('jquery');


	var template = require('text!templates/ScopeDefBuilder.html');



	var ScopeDefBuilder = Controller.extend({
		"init": function(feideconnect, app) {

			var that = this;

			this.feideconnect = feideconnect;
			this.app = app;

			this.apigk = null;
			this.apigkUpdated = null;

			this._super();

			this.orglistselector = null;
			this.orgselection = [];

			dust.loadSource(dust.compile(template, "ScopeDefBuilder"));

			this.ebind("click", ".actAddSubScope", "actAddSubScope");
			this.ebind("click", ".actRemoveSubscope", "actRemoveSubscope");

			this.el.on("click", ".actScopesSaveChanges", $.proxy(this.actScopesSaveChanges, this));

			this.el.on("click", "button.actorgadmintarget", function(e) {
				e.preventDefault();
				that.orglistselector.makeSelection()
					.then($.proxy(that.setOrgSelection, that));
			});
			this.el.on("click", "#basicOrgAdminPolicy", function(e) {
				that.updateOrgScopeControllers();
			});
			this.el.on("click", ".scopePolicyOrgAdmin", function(e) {
				that.updateOrgScopeControllers();
			});


		},

		"updateOrgScopeControllers": function() {

			// console.error("updateOrgScopeControllers");
			var that = this;
			var t = this.el.find("#basicOrgAdminPolicy");
			if (t.prop("checked")) {
				t.closest("form").find(".orgadmintarget").hide();
			} else {
				t.closest("form").find(".orgadmintarget").show();
			}

			this.el.find(".subScopeEntry").each(function(i, item) {
				var x = $(item).find("input.scopePolicyOrgAdmin")
				if (x.prop("checked")) {
					// console.error("")
					x.closest("form").find(".orgadmintarget").hide();
				} else {
					x.closest("form").find(".orgadmintarget").show();
				}
			});

		},


		"getDef": function() {

			var scopedef = new ScopeDef();
			var that = this;

			scopedef.title = this.el.find("#basicTitle").val();
			scopedef.descr = this.el.find("#basicDescr").val();
			if (this.el.find("#basicPolicy").prop("checked")) {
				scopedef.policy.auto = true;
			}
			if (!scopedef.policy.hasOwnProperty("orgadmin")) {
				scopedef.policy.orgadmin = {};
			}
			if (this.el.find("#basicOrgAdminPolicy").prop("checked")) {
				scopedef.policy.orgadmin.moderate = false;
			} else {
				scopedef.policy.orgadmin.moderate = true;
				scopedef.policy.orgadmin.target = this.orgselection;

			}

			this.el.find(".subScopeEntry").each(function(i, item) {
				var entry = {
					policy: {
						"auto": false
					}
				};
				var scope = $(item).find(".scopeID").val();
				entry.title = $(item).find(".scopeTitle").val();
				entry.descr = $(item).find(".scopeDescr").val();
				if ($(item).find(".scopePolicy").prop("checked")) {
					entry.policy.auto = true;
				}
				entry.policy.orgadmin = {};
				if ($(item).find(".scopePolicyOrgAdmin").prop("checked")) {
					entry.policy.orgadmin.moderate = false;
				} else {
					entry.policy.orgadmin.moderate = true;
					entry.policy.orgadmin.target = that.orgselection;
				}

				scopedef.subscopes[scope] = entry;
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

			// console.error("Save API GK", JSON.stringify(obj, undefined, 2)); 
			// return;
			this.emit("save", obj);

		},

		"setAPIGK": function(apigk) {
			this.apigk = apigk;
			this.apigkUpdated = $.extend({}, apigk);


			this.orgselection = this.apigkUpdated.scopedef.getOrgList();

			// console.error("Log", this.apigkUpdated, this.orgselection);
			this.updateUI();
		},


		"setOrgSelection": function(list) {

			this.orgselection = list;
			this.updateOrgList();

		},


		"updateOrgList": function() {
			var that = this;
			// var list = [];
			// if (this.apigkUpdated.scopedef.policy.orgadmin && this.apigkUpdated.scopedef.policy.orgadmin.target) {
			// 	list = this.apigkUpdated.scopedef.policy.orgadmin.target;
			// }
			this.el.find(".shortorglist").each(function(i, item) {
				$(item).empty().append(that.orgselection.length);
			});
		},

		"updateUI": function() {

			var that = this;

			var view = {
				"existing": this.apigk.getView(),
				"updated": this.apigkUpdated.getView()
			};

			dust.render("ScopeDefBuilder", view, function(err, out) {

				that.el.empty();
				that.el.append(out);

				that.updateOrgScopeControllers();
				that.updateOrgList();

				var list = that.apigkUpdated.scopedef.getOrgList();

				that.orglistselector = new OrgListSelector(that.feideconnect, that.app.providerdata, list);
				// that.orglistselector.makeSelection()
				// 	.then($.proxy(that.setOrgSelection, that));

			});

		}

	}).extend(EventEmitter);

	return ScopeDefBuilder;


});