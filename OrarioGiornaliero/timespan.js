function timespan(time) {
	var that = this;
	this.time = time;
	this.hour = this.time.split(':')[0];
	this.minute = this.time.split(':')[1];

	this.toString = function() {
		return this.hour + ":" + this.minute;
	};
}

function validateTime(time) {
	var result = false, m;
	try {		
		var re = /^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/;
		if ((m = time.match(re))) {
			result = (m[1].length === 2 ? "" : "0") + m[1] + ":" + m[2];
		}
		return result;
	} 
	catch(err) {
		return result;
	}
}