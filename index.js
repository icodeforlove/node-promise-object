var when = require('whenplus'),
	_ = require('underscore');

function isFunction (obj) {
	return _.isFunction(obj) || obj instanceof ExtendedMethod;
}

function ExtendedMethod (name, func, superFunc) {
	this.name = name;
	this.func = func;
	this.superFunc = superFunc;
}

function makeMethod (func, instance, key, doNotUsePrototype) {
	var superFunc = (doNotUsePrototype ? instance : instance.prototype || instance)[key];

	if (!isFunction(func) || !isFunction(superFunc)) {
		return func;
	} else {
		return new ExtendedMethod(key, func, superFunc);
	}
}

function mapPseudoArgs (scope, func, params, name, superMethod) {
	function mapArgsArray (args, actualArgsArray) {

		for (var param in params) {
			if (typeof params[param] !== 'string') continue;

			if (params[param] === '$self') {
				args.push(scope);
			} else if (params[param] === '$super') {
				if (!superMethod) throw new Error('Pseudo $super Argument: "' + name + '" has no super method');
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
	return (args && /\$(deferred|self|super|config)/.test(args[1])) ? args : false;
}

function mapMethod (scope, name, method, superMethod) {
	var methodString = method.toString(),
		args = getPseudoArgs(methodString);

	if (args) {
		args = args[1].replace(/\s/g, '').split(',');

		return mapPseudoArgs(scope, method, args, name, superMethod);
	} else if (method instanceof ExtendedMethod) {
		var superFunc,
			current = method.superFunc,
			chain = [];

		while (current instanceof ExtendedMethod) {
			chain.push(current);
			current = current.superFunc instanceof ExtendedMethod ? current.superFunc : null;
		}

		if (chain.length) {
			chain.reverse().forEach(function (current) {
				var superSuperFunc = mapMethod(scope, current.name, current.superFunc, superFunc);
				superFunc = mapMethod(scope, current.name, current.func, superSuperFunc);
			});
		} else {
			superFunc = method.superFunc;
		}

		if (!getPseudoArgs(String(superFunc))) superFunc = superFunc.bind(scope);

		superFunc = mapMethod(scope, name, superFunc);

		return mapMethod(scope, name, method.func, superFunc);
	} else {

		//console.log(method, scope)
		return method.bind(scope);
	}
}

function addMixins (args) {
	var mixins = _.toArray(args).slice(0, -1),
		proto = args[args.length-1];

	mixins.forEach(function (mixin) {
		for (var method in mixin) {
			if (method === 'initialize') {
				if (!proto.___mixin_initializers___) proto.___mixin_initializers___ = [];
				proto.___mixin_initializers___.push(mixin[method]);
				continue;
			}

			if (typeof proto[method] !== 'undefined') throw new Error('Mixin: "' + method + '" collision, cannot override class methods');
			proto[method] = mixin[method];
		}
	});

	return proto;
}

var Class = function () {};
Class.create = function () {
	var Self = this,
		instance = function (cookie) {
			var self = this;

			self.reopen = function (properties) {
				for (var property in properties) {
					self[property] = makeMethod(properties[property], self, property);
					self[property] = isFunction(self[property]) ? mapMethod(self, property, self[property]) : self[property];
				}
			};

			if (cookie !== isFunction && isFunction(this.initialize)) {
				for (var method in this) if (method.substr(0, 1) !== '$' && isFunction(this[method])) {
					this[method] = mapMethod(this, method, this[method]);
				}

				if (this.___mixin_initializers___) {
					this.___mixin_initializers___.forEach(function (initializer) {
						initializer.apply(self);
					});
					delete this.___mixin_initializers___;
				}

				this.initialize.apply(this, arguments);
			}
		};

	// pass in magic cookie
	instance.prototype = new Self(isFunction);

	var proto = arguments.length > 1 ? addMixins(arguments) : arguments[0];

	for (var key in proto) {
		instance.prototype[key] = makeMethod(proto[key], instance, key);
	}

	for (key in instance.prototype) {
		if (key.substr(0, 1) === '$') {
			instance[key.substr(1)] = isFunction(instance.prototype[key]) ? mapMethod(instance.prototype, key, instance.prototype[key]) : instance.prototype[key];
		}
	}

	instance.prototype.constructor = instance;
	instance.extend = this.extend || this.create;
	instance.reopen = function (properties) {
		for (var property in properties) {
			instance.prototype['$' + property] = makeMethod(properties[property], instance, '$' + property);
			instance[property] = isFunction(instance.prototype['$' + property]) ? mapMethod(instance, property, instance.prototype['$' + property]) : instance.prototype['$' + property];
		}
	};

	return instance;
};
module.exports = Class;