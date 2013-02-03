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
		var mappedArgsRegExp = /deferred|self/;

		function mapArgs (func, scope, params) {
			return function () {
				if (params.indexOf('deferred') !== -1) {
					var deferred = when.defer();

					var args = [deferred];
					if (params.indexOf('self') !== -1) args.push(scope);
					args = args.concat(Array.prototype.slice.call(arguments));

					func.apply(scope, args);

					return deferred.promise;
				} else {
					return func.apply(scope, [scope].concat(Array.prototype.slice.call(arguments)));
				}
			};

		}

		var Self = this,
			c = function (magic) { // only if there is no magic cookie
				if (magic !== self.isFunction && self.isFunction(this.initialize)) {
					for (var method in this) {
						var args = this[method].toString().match(/^function \(([a-z0-9_$,\s]+)\)/i);

						if (args && mappedArgsRegExp.test(args[1])) {
							args = args[1].replace(/\s/g, '').split(',');

							this[method] = mapArgs(this[method], this, args);
						}
					}
					
					this.initialize.apply(this, arguments);
				}
			};

		c.prototype = new Self(self.isFunction); // private method as magic cookie

		function makeMethod (key) {
			(function (f, sf) {
				c.prototype[key] = !self.isFunction(f) || !self.isFunction(sf) ? f : function () {this._super = sf;return f.apply(this, arguments);};
			}(proto[key], c.prototype[key]));
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
							c.prototype[key] = !self.isFunction(f) || !self.isFunction(sf) ? f : function () {
								f.apply(this, arguments);
								return sf.apply(this, arguments);
							};
						}(proto[key], c.prototype[key]));
					} else {
						c.prototype[key] = proto[key];
					}
				}
			});
		}

		for (var key in proto) makeMethod(key);

		c.prototype.constructor = c;
		c.extend = this.extend || this.create;
		return c;
	};

	module.exports = self.Class;
})();