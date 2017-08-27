function SolveStackFrame(field_matrix) {
	this.succeeded = true;
	this.failed = false;
	
	this.color_index = -1; //color_index is incremented at the start of each attempt.
	this.fields_to_reset = [];
	
	this.needs_reset = false;
	this.field_matrix = field_matrix;
	
	var possible_fields = [];
	for(var i = 0; i < field_matrix.length; i++)
		possible_fields.push([]); //Segregate fields by number of remaining options.
	for(var i = 0; i < field_matrix.length; i++) {
		for(var j = 0; j < field_matrix[i].length; j++) {
		
			var curr_field = field_matrix[i][j];
			if(curr_field.options.length === 0) {
				this.failed = true;
				this.succeeded = false;
				return;
			}
			if(curr_field.is_set) continue;
			
			possible_fields[curr_field.options.length-1].push(curr_field);
			//console.log("" + i + ", " + j);
			this.succeeded = false;
		}
	}
	
	var length_index = 0;
	while(possible_fields[length_index].length === 0) {
		length_index++;
		if(length_index >= possible_fields.length) return;
	}
	
	var field_index = Math.floor(Math.random()*possible_fields[length_index].length);
	this.field_to_set = possible_fields[length_index][field_index];
	this.color_index_list = [];
	this.create_color_index_list();
}

SolveStackFrame.prototype.create_color_index_list = function() {
	for(var i = 0; i < this.field_to_set.options.length; i++) {
		this.color_index_list.push(i);
	}
	
	for(var i = this.color_index_list.length-1; i > 0; i--) {
		var j = Math.floor(Math.random()*(i+1));
		
		var temp = this.color_index_list[i];
		this.color_index_list[i] = this.color_index_list[j];
		this.color_index_list[j] = temp;
	}
}

SolveStackFrame.prototype.solving_succeeded = function() {
	return this.succeeded;
}

SolveStackFrame.prototype.solving_failed = function() {
	return this.failed;
}

//Postcondition: frame has failed, solving is done, or a new field has been set.
SolveStackFrame.prototype.continue_frame = function() {
	if(this.failed) return -1;
	if(this.succeeded) return 1;
	
	if(this.needs_reset) this.reset();
	this.color_index++;
	
	while(this.color_index < this.field_to_set.options.length) {
		var retval = this.field_to_set.set_value(this.color_index_list[this.color_index], this.fields_to_reset);
		this.needs_reset = true;
		if(retval === 1) return 0; //Field set successfully but solving still in progress.
		//Next call to take_solver_step will create the next frame.
		
		this.reset();
		this.color_index++;
	}
	
	this.failed = true;
	return -1; //End of possibilities reached.
}

SolveStackFrame.prototype.reset = function() {
	if(this.all_fields_set || !this.needs_reset) return -1;
	
	for(var i = 0; i < this.fields_to_reset.length; i++)
		this.fields_to_reset[i].unset_value();
	
	//Should really use a set (without duplicates) taken from constraining fields
	//of unset fields here.
	for(var i = 0; i < this.field_matrix.length; i++)
		for(var j = 0; j < this.field_matrix[i].length; j++)
			this.field_matrix[i][j].update_options();
	
	this.needs_reset = false;
	this.fields_to_reset = [];
}

