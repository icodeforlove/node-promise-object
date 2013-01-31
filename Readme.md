## promise-object
	gives you the ability to create promise methods just by setting the first parameter to deferred and also binds those methods to the instance

## installation
	npm install promise-object

## example

```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.extend({
	initialize: function (userId, success, error) {
		this._super();
		this._userId = userId;

		this.getUserInfo().then(success, error);
	},

	getUserInfo: function (deferred) {
		var user = {id: this._userId};

		this.getFollowerCount(this._userId).then(function (name) {
			user.name = name;
			deferred.resolve(user);
		});
	},

	getFollowerCount: function (deferred) {
		setTimeout(function () {
			deferred.resolve('sam');
		}, 1000);
	}
});

new User(123, function (user) {
	console.log(user);
});
```