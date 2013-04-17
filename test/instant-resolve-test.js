var vows = require('vows'),
	assert = require('assert'),
	when = require('whenplus'),
	PromiseObject = require('../lib/promise-object');

var Class1 = PromiseObject.create({
	initialize: function ($config) {

	},

	checkNumbers: function ($deferred, numbers) {
		when.mapUnfulfilled(numbers, this.checkNumber).allLimit(1).done($deferred.resolve, $deferred.reject);
	},

	checkNumber: function ($deferred, number) {
		if (number % 2 === 0) {
			setTimeout(function () {
				$deferred.resolve(number);
			}, 0);
		} else {
			$deferred.resolve(number);
		}
	}
});

var suite = vows.describe('Instant Resolve');
suite.addBatch({
	'mapUnfulfilled with instant resolve': {
		topic: function () {
			var self = this;

			var example = new Class1();
			example.checkNumbers([1,2,3,4]).then(function (numbers) {
				self.callback(null, numbers);
			});
		},

		'expected params': function (numbers) {
			assert.deepEqual(numbers, [1,2,3,4]);
		}
	}
});
exports.suite = suite;