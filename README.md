# FeideConnectJS – Feide Connect Javascript Library


# Installation

Installed via bower.

in bower.json:

	"feideconnectjs": "git@github.com:feideconnect/feideconnect.js.git",

# Usage

The Feide Connect Javascript Library can be loaded using AMD loaded such as requirejs:


```js
	var
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,

	var config = {
		"client_id": "xxxxxxxx-xxxx-4006-xxxx-ab64d17a5xxx",
		"redirect_uri": "http://sp.example.org/",
		"debug": true,
		"instance": "dev"
	};

	var f = new FeideConnect(config);
```


The config object is merged with JSO config, and you may override JSO configuration directly here. The debug property will be passed on to JSO.

The instance property, can be set to `dev` or `pilot`.










