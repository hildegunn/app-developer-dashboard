# Controllers


## Loading

Building a loadable controller:


```javascript

	var OrgRoleSelector = Controller.extend({

		"init": function(el) {
			// Second paramter is boolean whether to automatically start initLoad()
			this._super(el, false); 
		},

		// Here we implemement the loader, and return a promise.
		"initLoad": function() {

			var that = this;

			return new Promise(function(resolve, reject) {

				// Implement loading the object content .

			}).then(this.proxy("draw"))
				.then(that.proxy("_initLoaded"));

		}
	});	
```

Implement the `initLoad()` method. It must call `_initLoaded()` when completed.



Using a loadable controller:

```javascript

	var or = new OrgRoleSelector();
	or.initLoad();

	or.onLoaded()
		.then(function() {
			console.log("Done");
		});
```


### Loader Timeout

Default timeout is 5000 ms. To test loader timeout:


```javascript

		"initLoad": function() {

			var that = this;

			return new Promise(function(resolve, reject) {

				// Implement loading the object content .

			})
				.then(this.proxy("draw"))
				.then(function() {
					return new Promise(function(resolve, reject) {
						setTimeout(function() {
							resolve()
						}, 6000);
					})
				})
				.then(that.proxy("_initLoaded"));
		}
```
