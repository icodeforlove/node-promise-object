## promise-object
	gives you the ability to create promise methods just by setting the first parameter to deferred and also binds those methods to the instance

## installation
	npm install promise-object

## example

```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.extend({
	initialize: function (userId, success, error) {
		this.userId = userId;
	},

	getUserInfo: function (deferred) {
		var user = {id: this.userId};

		this.getFollowerCount(this.userId).then(function (followers) {
			user.followers = followers;
			deferred.resolve(user);
		});
	},

	getFollowerCount: function (deferred, userId) {
		setTimeout(function () {
			deferred.resolve(1234);
		}, 1000);
	}
});

var user = new User(123).getUserInfo().then(success, error);
```
