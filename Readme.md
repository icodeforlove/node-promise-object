## promise-object
provides a base object that gives you the ability to create promise methods just by setting the first parameter to $deferred and also binds those methods to the instance. It also allows you to extend any method.

## installation
	npm install promise-object

## pseudo params
there are a few rules with these params
* if you want to use **$deferred** it MUST be the first param
* any other pseudo param must be before any real params

these pseudo params are supported
* **$deferred** converts the method into a deferred method
* **$super** returns the parents constructor
* **$self** alternative to var self = this;

example
```javascript
var User = PromiseObject.create({
	initialize: function () {
	},
	someMethod: function ($deferred, $self) {
		// returns this
		$deferred.resolve($self);
	},
	someOtherMethod: function ($self) {
		// returns this
		return $self;
	}
});
```

## promise

```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.create({
	initialize: function (userId, success, error) {
		this._userId = userId;

		this.getUserInfo().then(success, error);
	},

	getUserInfo: function ($deferred) {
		var user = {id: this._userId};

		this.getFollowerCount(this._userId).then(function (name) {
			user.name = name;
			$deferred.resolve(user);
		});
	},

	getFollowerCount: function ($deferred) {
		setTimeout(function () {
			$deferred.resolve('sam');
		}, 1000);
	}
});

new User(123, function (user) {
	console.log(user);
});
```

## extending methods/objects
only the initialize method supports the pseudo param **$super**
```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.create({
	initialize: function (name) {
		this._name = name;
	}
});

var Admin = User.extend({
	initialize: function ($super, name) {
		$super(name);
	}
});

var joe = new Admin('joe');
```