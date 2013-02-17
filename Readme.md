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
* **$super** returns the parent method
* **$self** alternative to var self = this;
* **$config** ensures that the first argument is an object

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
## config example
```javascript
var User = PromiseObject.create({
	initialize: function ($config) {
		this._name = $config.name;
	}
});

new User({name: 'joe'});
new User(); // this does not error out because $config was replaced with an empty object
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
any method can be extended upon, **$super** is used to request the parent method
```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.create({
	initialize: function (name) {
		this._name = name;
	},

	getInfo: function ($deferred) {
		setTimeout(function () {
			$deferred.resolve({age: 12});
		}, 0);
	}
});

var Admin = User.extend({
	initialize: function ($super, name) {
		$super(name);
	},

	getInfo: function ($deferred, $super) {
		$super().then(function (info) {
			info.moreStuff = 123;

			$deferred.resolve(info);

		}, $deferred.reject);
	}
});

var joe = new Admin('joe');
joe.getInfo(function (info) {
	
});
```