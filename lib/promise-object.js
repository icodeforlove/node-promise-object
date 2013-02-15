/*jshint node:true*/
(function () {
	'use strict';
	
	var when = require('when'),
		self = {};

	self.isFunction = function(obj) {
		return typeof obj === 'function';
	};

	self.Class = function () {};

	self.Class.create = function (proto) {
		var mappedArgsRegExp = /\$(deferred|self|super)/;

		function mapArgs (func, scope, params, superMethod) {
			function buildArgsArray (args) {
				for (var param in params) {
					if (params[param] === '$self') {
						args.push(scope);
					} else if (params[param] === '$super' && superMethod) {
						args.push(superMethod);
					} else  if (params[param].substr(0,1) !== '$') {
						break;
					}
				}
			}

			return function () {
				var args = [];

				if (params.indexOf('$deferred') === 0) {
					var deferred = when.defer();

					args.push(deferred);
					
					buildArgsArray(args);
					
					args = args.concat(Array.prototype.slice.call(arguments));

					func.apply(scope, args);

					return deferred.promise;
				
				} else {
					buildArgsArray(args);

					args = args.concat(Array.prototype.slice.call(arguments));
					
					return func.apply(scope, args);
				}
			};
		}

		function mapMethod (scope, name, method, superMethod) {
			var args = method.toString().match(/^function \(([a-z0-9_$,\s]+)\)/i);

			if (args && mappedArgsRegExp.test(args[1])) {
				args = args[1].replace(/\s/g, '').split(',');

				return mapArgs(method, scope, args, superMethod);
			} else if (name === 'initialize') {
				return method.bind(scope);
			} else {
				return method;
			}
		}

		var Self = this,
			instance = function (cookie) {
				if (cookie !== self.isFunction && self.isFunction(this.initialize)) {
					for (var method in this) this[method] = mapMethod(this, method, this[method]);
					
					this.initialize.apply(this, arguments);
				}
			};

		instance.prototype = new Self(self.isFunction); // pass in magic cookie

		function makeMethod (key) {
			(function (f, sf) {
				if (!self.isFunction(f) || !self.isFunction(sf)) {
					instance.prototype[key] = f;
				} else {
					instance.prototype[key] = function () {
						sf = mapMethod(instance.prototype, key, sf);
						f = mapMethod(instance.prototype, key, f, sf);
						return f.apply(instance.prototype, arguments);
					};
				}
			}(proto[key], instance.prototype[key]));
		}

		// deal with mixins
		if (arguments.length > 1) {
			var protos = Array.prototype.slice.call(arguments);
			
			proto = protos.pop();

			protos.forEach(function (proto) {
				for (var key in proto) {
					// auto initialize mixins
					if (key == 'initialize') {
						
						(function (f, sf) {
							instance.prototype[key] = !self.isFunction(f) || !self.isFunction(sf) ? f : function () {
								f.apply(this, arguments);
								return sf.apply(this, arguments);
							};
						}(proto[key], instance.prototype[key]));
					} else {
						instance.prototype[key] = proto[key];
					}
				}
			});
		}

		for (var key in proto) makeMethod(key);

		instance.prototype.constructor = instance;
		instance.extend = this.extend || this.create;
		return instance;
	};

	module.exports = self.Class;
})();