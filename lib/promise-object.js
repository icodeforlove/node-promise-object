/*jshint node:true*/
(function () {
	'use strict';
	
	function ExtendedMethod (name, func, superFunc) {
		this.name = name;
		this.func = func;
		this.superFunc = superFunc;
	}

	var when = require('when'),
		self = {};

	self.isFunction = function(obj) {
		return typeof obj === 'function';
	};

	self.Class = function () {};

	self.Class.create = function (proto) {
		var mappedArgsRegExp = /\$(deferred|self|super|config)/;

		function mapPseudoArgs (scope, func, params, superMethod) {
			function mapArgsArray (args, actualArgsArray) {
				for (var param in params) {
					if (params[param] === '$self') {
						args.push(scope);
					} else if (params[param] === '$super' && superMethod) {
						args.push(superMethod);
					} else if (params[param].substr(0,1) !== '$') {
						break;
					}
				}

				// ensure that config object is an object
				if (params.indexOf('$config') !== -1) actualArgsArray[0] = actualArgsArray[0] || {};
			}

			return function () {
				var args = [],
					actualArgsArray = Array.prototype.slice.call(arguments);

				if (params.indexOf('$deferred') === 0) {
					var deferred = when.defer();

					args.push(deferred);
					
					mapArgsArray(args, actualArgsArray);
					
					args = args.concat(actualArgsArray);

					func.apply(scope, args);

					return deferred.promise;
				
				} else {
					mapArgsArray(args, actualArgsArray);

					args = args.concat(actualArgsArray);
					
					return func.apply(scope, args);
				}
			};
		}

		function getPseudoArgs (string) {
			var args = string.match(/^function \(([a-z0-9_$,\s]+)\)/i);
			return (args && mappedArgsRegExp.test(args[1])) ? args : false;
		}

		function mapMethod (scope, name, method, superMethod) {
			var methodString = method.toString(),
				args = getPseudoArgs(methodString);

			if (args) {
				args = args[1].replace(/\s/g, '').split(',');

				return mapPseudoArgs(scope, method, args, superMethod);
			} else if (method instanceof ExtendedMethod) {
				var f = method.func,
					sf = null,
					current = method.superFunc,
					chain = [];

				while (current instanceof ExtendedMethod) {
					chain.push(current);
					current = current.superFunc instanceof ExtendedMethod ? current.superFunc : null;
				}

				if (chain.length) {
					chain.reverse().forEach(function (current) {
						var superFunc = mapMethod(scope, current.name, current.superFunc, sf);
						sf = mapMethod(scope, current.name, current.func, superFunc);
					});
				} else {
					sf = method.superFunc;
				}

				if (!getPseudoArgs(String(sf))) sf = sf.bind(scope);

				sf = mapMethod(scope, name, sf);
				
				return mapMethod(scope, name, f, sf);
			} else {
				return method.bind(scope);
			}
		}

		var Self = this,
			instance = function (cookie) {
				if (cookie !== self.isFunction && (self.isFunction(this.initialize) || this.initialize instanceof ExtendedMethod)) {
					for (var method in this) if ((this[method] instanceof ExtendedMethod) || self.isFunction(this[method])) {
						this[method] = mapMethod(this, method, this[method]);	
					}

					this.initialize.apply(this, arguments);
				}
			};

		instance.prototype = new Self(self.isFunction); // pass in magic cookie

		function makeMethod (key) {
			(function (f, sf) {
				if (!self.isFunction(f) && !(f instanceof ExtendedMethod) || !self.isFunction(sf) && !(sf instanceof ExtendedMethod)) {
					instance.prototype[key] = f;
				} else {
					instance.prototype[key] = new ExtendedMethod(key, f, sf);
				}
			}(proto[key], instance.prototype[key]));
		}

		for (var key in proto) makeMethod(key);

		instance.prototype.constructor = instance;
		instance.extend = this.extend || this.create;

		return instance;
	};

	module.exports = self.Class;
})();