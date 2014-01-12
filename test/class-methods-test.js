var vows = require('vows'),
	assert = require('assert'),
	PromiseObject = require('../lib/promise-object');

var Class = PromiseObject.create({
	initialize: function () {

	},

	$method: function () {
		return 'class method';
	},

	method: function () {
		return 'prototype method';
	},

	$deferredMethod: function ($deferred) {
		$deferred.resolve('class method');
	},

	deferredMethod: function ($deferred) {
		$deferred.resolve('prototype method');
	},

	$stringProperty: 'class string',

	stringProperty: 'prototype string',

	$intProperty: 1,

	intProperty: 2,

	$objectProperty: {value: 1},

	objectProperty: {value: 2}
});

var Class2 = Class.extend({
	$deferredMethod: function ($deferred, $super) {
		$super().done(function (result) {
			$deferred.resolve(result + ' two');
		});
	}
});

var Class3 = Class2.extend({
	$deferredMethod: function ($deferred, $super) {
		$super().done(function (result) {
			$deferred.resolve(result + ' three');
		});
	}
});

var suite = vows.describe('Class Methods Tests');

suite.addBatch({
	'test methods': {
		topic: new Class(),

		'returns prototype method': function (topic) {
			assert.equal(topic.method(), 'prototype method');
		},

		'returns class method': function (topic) {
			assert.equal(Class.method(), 'class method');
		}
	},

	'test properties': {
		topic: new Class(),

		'test prototype properties': function (topic) {
			assert.equal(topic.stringProperty, 'prototype string');
			assert.equal(topic.intProperty, 2);
			assert.equal(topic.objectProperty.value, 2);
		},

		'test class properties': function (topic) {
			assert.equal(Class.stringProperty, 'class string');
			assert.equal(Class.intProperty, 1);
			assert.equal(Class.objectProperty.value, 1);
		},

		'returns class method': function (topic) {
			assert.equal(Class.method(), 'class method');
		}
	},

	'test deferred instance method': {
		topic: function () {
			var self = this,
				instance = new Class();

			instance.deferredMethod().then(function (result) {
				self.callback(null, result);
			});
		},

		'expected success': function (result) {
			assert.equal(result, 'prototype method');
		}
	},

	'test deferred class method': {
		topic: function () {
			var self = this;

			Class.deferredMethod().then(function (result) {
				self.callback(null, result);
			});
		},

		'expected success': function (result) {
			assert.equal(result, 'class method');
		}
	},

	'test deferred class extended method': {
		topic: function () {
			var self = this;

			Class3.deferredMethod().then(function (result) {
				self.callback(null, result);
			});
		},

		'expected success': function (result) {
			assert.equal(result, 'class method two three');
		}
	}
});
exports.suite = suite;