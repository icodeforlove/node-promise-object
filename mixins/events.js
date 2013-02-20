module.exports = {
	// public

	addEventListener: function(type, listener, capture) {
		this._listeners = this._listeners || {};

		if (typeof this._listeners[type] == 'undefined'){
			this._listeners[type] = [];
		}

		this._listeners[type].push(listener);
	},
	removeEventListener: function(type, listener) {
		this._listeners = this._listeners || {};
		
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
		this._listeners = this._listeners || {};
		
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
		this._listeners = this._listeners || {};
		
		if (this._listeners[event.type] instanceof Array){
			var listeners = this._listeners[event.type];
			for (var i=0, l=listeners.length; i < l; i++){
				listeners[i](this, event);
			}
		}
	}
};