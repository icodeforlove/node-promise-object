var when = require('when'),
	_ = require('underscore');

function ExtendedMethod (name, func, superFunc) {
	this.name = name;
	this.func = func;
	this.superFunc = superFunc;
}

function makeMethod (proto, instance, key) {
	var func = proto[key],
		superFunc = instance.prototype[key];

	if (!isFunction(func) && !(func instanceof ExtendedMethod) || !isFunction(superFunc) && !(superFunc instanceof ExtendedMethod)) {
		instance.prototype[key] = func;
	} else {
		instance.prototype[key] = new ExtendedMethod(key, func, superFunc);
	}
}

function mapPseudoArgs (scope, func, params, name, superMethod) {
	function mapArgsArray (args, actualArgsArray) {
		for (var param in params) {
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
		return method.bind(scope);
	}
}

function isFunction (obj) {
	return typeof obj === 'function';
}

function addMixins (args) {
	var mixins = _.extend.apply(null, [{}].concat(_.toArray(args).slice(0, -1)));

	var proto = args[args.length-1];

	for (var method in mixins) {
		if (method === 'initialize') throw new Error('Mixin: cannot override initialize');
		if (typeof proto[method] !== 'undefined') throw new Error('Mixin: "' + method + '" collision, cannot override class methods');
		proto[method] = mixins[method];
	}

	return proto;
}

var Class = function () {};
Class.create = function () {
	var self = this,
		instance = function (cookie) {
			if (cookie !== isFunction && (isFunction(this.initialize) || this.initialize instanceof ExtendedMethod)) {
				for (var method in this) if ((this[method] instanceof ExtendedMethod) || isFunction(this[method])) {
					this[method] = mapMethod(this, method, this[method]);	
				}

				this.initialize.apply(this, arguments);
			}
		};

	// pass in magic cookie
	instance.prototype = new self(isFunction);

	var proto = arguments.length > 1 ? addMixins(arguments) : arguments[0];

	for (var key in proto) makeMethod(proto, instance, key);

	instance.prototype.constructor = instance;
	instance.extend = this.extend || this.create;

	return instance;
};

module.exports = Class;