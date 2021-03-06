function Field(num_options, display_element) {
	this.value = 0;
	this.options = [];
	this.max_option = num_options;
	this.constraint_set = [];
	this.display = display_element;
	this.is_initial_constraint = false;
	this.is_set = false;
	this.set_externally = false;
	
	this.update_options();
}

Field.prototype.remove_option = function(opt) {
	var index = this.options.indexOf(opt);
	if(index != -1)
		this.options.splice(index, 1);
}

//Sets this field's value; choice is an index into options to determine what
//value to set. Assumes options are up-to-date (use update_options first if not).
Field.prototype.set_value = function(choice, fields_set) {
	if(this.is_set) return 0;
	if(this.options.length === 0) return -1;
	
	//var choice = Math.floor(Math.random()*this.options.length);
	this.value = this.options[choice];
	this.display.style.backgroundColor = hue_to_hex(this.value / this.max_option);
	this.display.appendChild(document.createTextNode(this.value.toString())); //TEMP
	this.is_set = true;
	fields_set.push(this);
	
	for(var i = 0; i < this.constraint_set.length; i++)
	{
		var other = this.constraint_set[i];
		if(other.is_initial_constraint) continue;
		
		other.remove_option(this.value);
		if(other.options.length === 0) return -1;
		//Maybe need to store val & change things anyway to ensure things are put back properly?
		if(!other.is_set && other.options.length === 1) {
			//var retval = other.set_value(fields_set); //With this it's constraint propogation?
			var retval = other.set_value_externally();
			if(retval === -1) return -1;
			fields_set.push(other);
		}
	}
	
	return 1;
}

//Assumes there is only one possible value left
Field.prototype.set_value_externally = function() {
	if(this.is_set) return 0;
	if(this.options.length != 1) return -1;
	
	this.value = this.options[0];
	this.display.style.backgroundColor = hue_to_hex(this.value / this.max_option);
	this.display.appendChild(document.createTextNode(this.value.toString())); //TEMP
	this.is_set = true;
	this.set_externally = true;
	
	for(var i = 0; i < this.constraint_set.length; i++)
		this.constraint_set[i].remove_option(this.value);
	
	return 1;
}

Field.prototype.set_as_initial_constraint = function(value_arg) {
	if(this.is_set) return 0;
	if(this.options.length === 0) return -1;
	
	if(value_arg === undefined || value_arg === null) {
		choice = Math.floor(Math.random()*this.options.length);
		this.value = this.options[choice];
	}
	else {
		if(value_arg <= 0 || value_arg > this.max_option) return -1;
		this.value = value_arg;
	}
	
	this.display.style.backgroundColor = hue_to_hex(this.value / this.max_option);
	this.display.appendChild(document.createTextNode(this.value.toString())); //TEMP
	this.is_set = true;
	this.is_initial_constraint = true;
	
	return 1;
}

Field.prototype.unset_as_initial_constraint = function() {
	if(!this.is_initial_constraint) return 0;
	
	this.is_initial_constraint = false;
	this.unset_value();
	return 1;
}

Field.prototype.unset_value = function() {
	if(!this.is_set) return 0;
	if(this.is_initial_constraint) return -1;
	
	var old_val = this.value;
	this.value = 0;
	this.display.style.backgroundColor = "white";
	this.display.removeChild(this.display.lastChild); //TEMP
	this.is_set = false;
	this.set_externally = false;
	
	return 1;
}

Field.prototype.update_options = function() {
	this.options = [];
	
	if(this.is_set) { //If a field is set, its value is its only possible option.
		this.options.push(this.value);
	}
	else {
		for(var i = 1; i <= this.max_option; i++)
			this.options.push(i);
	}
	
	for(var i = 0; i < this.constraint_set.length; i++)
		if(this.constraint_set[i].is_set)
			this.remove_option(this.constraint_set[i].value);
	
	return this.options.length;
}

Field.prototype.add_constraint = function(new_constraint) {
	this.constraint_set.push(new_constraint);
}

Field.prototype.concat_constraints = function(new_constraints) {
	this.constraint_set = this.constraint_set.concat(new_constraints);
}

Field.prototype.display_select = function() {
	this.display.style.border = "3px solid #000000";
}

Field.prototype.display_deselect = function() {
	this.display.style.border = "3px solid #FFFFFF";
}

var solve_call_stack = [];

function take_solver_step(field_matrix) {
	//Precondition: some fields have just been set or solving has just started
	//(i.e. time to make a new frame).
	if(solve_call_stack === undefined || solve_call_stack === null) return -1;
	
	//Create new frame, return success if that frame has nothing to do.
	var curr_frame = new SolveStackFrame(field_matrix);
	solve_call_stack.push(curr_frame);
	if(curr_frame.solving_succeeded()) return 1; //All done
	
	while(curr_frame.continue_frame() === -1) {
		solve_call_stack.pop();
		backtracks_done++;
		total_backtracks_done++;
		
		if(solve_call_stack.length > 0) {
			curr_frame = stack_peek();
		}
		else return -1;
	}
	return 0;
}

function stack_peek() {
	if(solve_call_stack === undefined || solve_call_stack === null) return null;
	if(solve_call_stack.length == 0) return null;
	return solve_call_stack[solve_call_stack.length-1];
}

function compare_num_options(a, b) {
	return a.options.length - b.options.length;
}

function reset_puzzle(field_matrix) {
	for(var i = 0; i < field_matrix.length; i++)
		for(var j = 0; j < field_matrix[i].length; j++)
			field_matrix[i][j].unset_value();
	
	for(var i = 0; i < field_matrix.length; i++)
		for(var j = 0; j < field_matrix[i].length; j++)
			field_matrix[i][j].update_options();
}

function hue_to_hex(h) {
	var rgb;
	var hp = (h*6)%6;
	var x = Math.floor(15*(1 - Math.abs(hp%2 - 1)));
	switch(Math.floor(hp)) {
		case 0 : rgb = [15, x, 0];
		break;
		case 1 : rgb = [x, 15, 0];
		break;
		case 2 : rgb = [0, 15, x];
		break;
		case 3 : rgb = [0, x, 15];
		break;
		case 4 : rgb = [x, 0, 15];
		break;
		case 5 : rgb = [15, 0, x];
		break;
		default : rgb = [15,15,15];
	}
	return "#" + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
}
