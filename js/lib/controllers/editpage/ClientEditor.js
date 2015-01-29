define(function(require, exports, module) {

	var 
		dust = require('dust'),
		Pane = require('../Pane'),
		Client = require('../../models/Client'),
		Editor = require('./Editor'),
		scopePolicy = require('../../../../etc/scopepolicy'),
		utils = require('../../utils')
		;


	var clientTemplate = require('text!templates/ClientEditor.html');



	var ClientEditor = Editor.extend({
		"init": function(app, feideconnect) {
			
			var that = this;
			this.editor = "clients";
			this._super(app, feideconnect);

			var x = dust.compile(clientTemplate, "clienteditor");
			dust.loadSource(x);

			this.ebind("click", ".actSaveChanges", "actSaveChanges");
			this.ebind("click", ".actScopeAdd", "actScopeAdd");
			this.ebind("click", ".actScopeRemove", "actScopeRemove");
			this.ebind("click", ".actDelete", "actDelete");
		
		},

		"logoUploaded": function(data) {
			var that = this;
			that.feideconnect.clientsUpdateLogo(this.current.id, data, function() {
				console.log("Successfully posted logo to feideconnect");
				var url = "http://api.dev.feideconnect.no:6543/clientadm/clients/" + that.current.id + "/logo?r=" + utils.guid();
				that.el.find('.itemlogo').attr("src", url);
			});

		},

		"edit": function(item, setTab) {

			var that = this;
			this.current = item;

			var view = item.getView(this.feideconnect);

			var scopes = item.getScopes(scopePolicy);

			console.log("SCOPES", scopes);
			
			if (this.feideconnect) {
				$.extend(view, {
					"oauth": that.feideconnect.getConfig(),
					"scopelist": scopes
				});
			}
			

			console.log("view is ", view);

			dust.render("clienteditor", view, function(err, out) {
				// console.log(out);

				var tab = that.currentTab;
				if (setTab) tab = setTab;
				that.el.empty().append(out);
				that.selectTab(tab);

			});

			this.activate();
		},
		"actScopeAdd": function(e) {
			e.preventDefault();
			var scopeid = $(e.currentTarget).closest(".scopeEntry").data("scopeid");

			this.current.addScope(scopeid);
			var obj = this.current.getStorable();
			var that = this;
			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});


			console.log("trying to actScopeAdd ", scopeid);
		},
		"actScopeRemove": function(e) {
			e.preventDefault();
			var scopeid = $(e.currentTarget).closest(".scopeEntry").data("scopeid");
			console.log("trying to actScopeRemove  ", scopeid);

			this.current.removeScope(scopeid);
			var obj = this.current.getStorable();
			var that = this;
			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});

		},

		"actSaveChanges": function(e) {
			e.preventDefault();

			console.log("About to sacve changes");

			this.current.setName(this.el.find("#name").val());
			this.current.setDescr(this.el.find("#descr").val());
			this.current.setOneRedirectURI(this.el.find("#redirect_uri").val());

			var obj = this.current.getStorable();

			console.error("Get storable", obj);



			var that = this;
			this.feideconnect.clientsUpdate(obj, function(savedClient) {
				var x = new Client(savedClient);
				that.edit(x);
				that.emit("saved", x);
			});

		},
		"actDelete": function(e) {
			e.preventDefault();
			var that = this;
			this.feideconnect.clientsDelete(this.current.id, function(data) {
				that.emit("deleted", that.current.id);
			});
		}

	});

	return ClientEditor;


});