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
			//console.log(key);
			(function (f, sf) {
				c.prototype[key] = !self.isFunction(f) || !self.isFunction(sf) ? f : function () {this._super = sf;return f.apply(this, arguments);};
			}(proto[key], c.prototype[key]));
		}

		for (var key in proto) makeMethod(key);

		c.prototype.constructor = c;
		c.extend = this.extend || this.create;
		return c;
	};

	self.Object = self.Class.create({
		initialize: function () {
			this._listeners = {};
		},
		// public
		addEventListener: function(type, listener, capture) {
			if (typeof this._listeners[type] == 'undefined'){
				this._listeners[type] = [];
			}

			this._listeners[type].push(listener);
		},
		removeEventListener: function(type, listener) {
			if (this._listeners[type] instanceof Array){
				var listeners = this._listeners[type];
				for (var i=0, l=listeners.length; i < l; i++){
		
					if (listeners[i] == listener){
						listeners.splice(i, 1);
						break;
					}
				}
			}
		},
		dispatchEvent: function(event, details, originalEvent) {
			event = (typeof event == 'string') ? { type: event } : event;
			event.target = (!event.target) ? this : event.target;
			event.timestamp = new Date().getTime();
			if (!event.type){
				throw new Error('missing "type" property');
			}

			// attach original event
			if (typeof originalEvent != 'undefined') event.originalEvent = originalEvent;
			
			// add details to event
			if (typeof details != 'undefined') for (var detail in details) event[detail] = details[detail];

			this._callListeners(event);
		},
		
		// private
		_callListeners: function(event) {
			if (this._listeners[event.type] instanceof Array){
				var listeners = this._listeners[event.type];
				for (var i=0, l=listeners.length; i < l; i++){
					listeners[i](this, event);
				}
			}
		}
	});

	module.exports = self.Object;
})();
