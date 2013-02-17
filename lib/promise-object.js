var when = require('when');

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

function isFunction (obj) {
	return typeof obj === 'function';
};

var Class = function () {};
Class.create = function () {
	var self = this,
		proto,
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

	if (arguments.length > 1) {	
		var mixinObjects = Array.prototype.slice.call(arguments),
			mixins = {};

		proto = mixinObjects.pop();
		
		mixinObjects.forEach(function (mixin) {
			for (var method in mixin) {
				if (method === 'initialize') throw new Error('Mixin: cannot override initialize');
				mixins[method] = mixin[method];
			}
		});

		for (var method in mixins) {
			if (typeof proto[method] !== 'undefined') throw new Error('Mixin: "' + method + '" collision, cannot override class methods');
			proto[method] = mixins[method];
		}
	} else {
		proto = arguments[0];
	}

	for (var key in proto) makeMethod(proto, instance, key);

	instance.prototype.constructor = instance;
	instance.extend = this.extend || this.create;

	return instance;
};

module.exports = Class;