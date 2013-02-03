## promise-object
gives you the ability to create promise methods just by setting the first parameter to deferred and also binds those methods to the instance.

## installation
	npm install promise-object

## magic

when putting deferred as a param it will convert the object into a deferred object, also when putting self it will return the object reference.

```javascript
var User = PromiseObject.create({
	initialize: function () {
	},
	someMethod: function (deferred, self) {
		// returns this
		deferred.resolve(self);
	},
	someOtherMethod: function (self) {
		// returns this
		return self;
	}
});
```

## promise

```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.create({
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

## extending objects
```javascript
var PromiseObject = require('promise-object');

var User = PromiseObject.create({
	initialize: function () {

	}
});

var Admin = User.extend({
	initialize: function () {
		this._super();
	}
});
```

## mixins
```javascript
var PromiseObject = require('promise-object');

var RandomIdMixin =  {
	// this gets ran instantly upon object instantiation
	initialize: function () {
		this.randomId = Math.random();
	},

	userIdToString: function () {
		return String(this.randomId);
	}
};

var User = PromiseObject.create(RandomIdMixin, {
	initialize: function () {
		this._super();

		console.log(this.userIdToString());
	}
});
```