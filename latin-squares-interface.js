var puzzle_to_solve;
var solver_interval = null;

var is_running = false;
var can_set_constraints = false;

var palette_selection;

var backtrack_limit;
var backtracks_done = 0;
var total_backtracks_done = 0;

var restart_limit;
var restarts_done = 0;

//ONCLICK FUNCTIONS

function solve_button_clicked() {
	if(puzzle_to_solve === undefined || puzzle_to_solve == null) {
		window.alert("No puzzle to solve");
		return -1;
	}
	if(is_running) return -1;
	
	var delay_input = document.getElementById("time_input");
	var restart_input = document.getElementById("restart_input");
	var fail_input = document.getElementById("fail_input");
	
	var delay = 100;
	if(delay_input != undefined && delay_input != null) {
		delay = parseInt(delay_input.value);
		if(isNaN(delay) || delay < 0) delay = 100;
	}
	
	if(restart_input != undefined && restart_input != null) {
		backtrack_limit = parseInt(restart_input.value);
		if(isNaN(backtrack_limit) || backtrack_limit < 0)
			backtrack_limit = undefined;
	}
	else {
		backtrack_limit = undefined;
	}
	//Don't reset backtracks_done; needs to be preserved over pauses.
	if(fail_input != undefined && fail_input != null) {
		restart_limit = parseInt(fail_input.value);
		if(isNaN(restart_limit) || restart_limit < 0)
			restart_limit = undefined;
	}
	else {
		restart_limit = undefined;
	}
	
	solver_interval = setInterval(solver_callback, delay);
	is_running = true;
	make_constraints_fixed();
	set_status("Running");
}

//Create a new puzzle according to the values in the input fields.
function create_puzzle_clicked() {
	if(is_running) return;
	
	var size_input = document.getElementById("size_input");
	var constraints_input = document.getElementById("constraints_input");
	var display_area = document.getElementById("display_area");
	var row_template = document.getElementById("display_row_template");
	var field_template = document.getElementById("field_template");
	if(size_input === null || constraints_input === null || display_area === null
		|| row_template === null || field_template === null) return;
	
	//Check that a valid board size is given
	var size = parseInt(size_input.value);
	var num_constraints = parseInt(constraints_input.value);
	if(isNaN(size)) {
		window.alert("A board size must be specified.");
		return;
	}
	else if(size <= 0) {
		window.alert("Board size must be greater than zero.");
		return;
	}
	else if(size > 30) {
		window.alert("Board size above 30 is not supported.");
		//30 chosen because, with a larger board, the numbers will make the fields distort.
		return;
	}
	if(isNaN(num_constraints)) {
		window.alert("The number of initial constraints must be specified.");
		return;
	}
	else if(num_constraints < 0) {
		window.alert("Number of constraints cannot be negative.");
		return;
	}
	else if(num_constraints > size*size) {
		window.alert("There cannot be more constraints than grid squares.");
		return;
	}
	
	field_matrix = create_puzzle_grid(size, display_area, row_template, field_template);
	create_initial_constraints(field_matrix, num_constraints);
	create_palette(size);
	
	puzzle_to_solve = field_matrix;
	reset_button_clicked(); //To get correct initial possibilities
	make_constraints_settable();
}

//Creates a pattern that can demonstrate a heavy-tailed distribution of solving
//times (number of backtracks). Always creates 10x10.
function create_heavy_tailed_pattern() {
	if(is_running) return;
	
	var display_area = document.getElementById("display_area");
	var row_template = document.getElementById("display_row_template");
	var field_template = document.getElementById("field_template");
	if(display_area === null || row_template === null || field_template === null) return;
	
	field_matrix = create_puzzle_grid(10, display_area, row_template, field_template);
	create_palette(10);
	
	//Creating the pattern:
	for(var i = 0; i < 4; i++) {
		field_matrix[3-i][i].set_as_initial_constraint(10);
		field_matrix[i+4][i+4].set_as_initial_constraint(10);
		
		field_matrix[5-i][i+2].set_as_initial_constraint(7);
		if(i < 3) field_matrix[9-i][i+7].set_as_initial_constraint(7);
	}
	
	puzzle_to_solve = field_matrix;
	reset_button_clicked(); //To get correct initial possibilities
	make_constraints_settable();
}

//Creates a pattern where the diagonal is filled with one colour, except for
//one cell, which is a different colour (this pattern has no solution). This
//pattern can be made at various board sizes.
function create_impossible_pattern() {
	if(is_running) return;
	
	var size_input = document.getElementById("size_input");
	var display_area = document.getElementById("display_area");
	var row_template = document.getElementById("display_row_template");
	var field_template = document.getElementById("field_template");
	if(size_input === null || display_area === null || row_template === null ||
		field_template === null) return;
	
	//Check that a valid board size is given
	var size = parseInt(size_input.value);
	var num_constraints = parseInt(constraints_input.value);
	if(isNaN(size)) {
		window.alert("A board size must be specified.");
		return;
	}
	else if(size < 2) {
		window.alert("Pattern requires a board size of at least 2");
		return;
	}
	else if(size > 30) {
		window.alert("Board size above 30 is not supported.");
		return;
	}
	
	field_matrix = create_puzzle_grid(size, display_area, row_template, field_template);
	create_palette(size);
	
	//Creating the pattern:
	var off_index = Math.floor(size/2);
	var blue_val = Math.floor(2*size/3);
	for(var i = 0; i < size; i++) {
		if(i === off_index) field_matrix[i][i].set_as_initial_constraint(size);
		else field_matrix[i][i].set_as_initial_constraint(blue_val);
	}
	
	puzzle_to_solve = field_matrix;
	reset_button_clicked(); //To get correct initial possibilities
	make_constraints_settable();
}

function stop_button_clicked() {
	if(!is_running) return;
	
	clearInterval(solver_interval);
	solver_interval = null;
	is_running = false;
	//Should call this pause really
	
	set_status("Paused");
}

function reset_button_clicked() {
	if(is_running) return;
	
	solve_call_stack = [];
	backtracks_done = 0;
	total_backtracks_done = 0;
	restarts_done = 0;
	if(puzzle_to_solve != undefined && puzzle_to_solve != null) {
		reset_puzzle(puzzle_to_solve);
		make_constraints_settable();
	}
	
	set_status("Ready");
}

function palette_field_clicked() {
	if(!can_set_constraints) return;
	
	if(palette_selection != undefined && palette_selection != null) {
		palette_selection.display_deselect();
	}
	
	this.display_select();
	palette_selection = this;
}

function puzzle_field_clicked() {
	if(!can_set_constraints) return;
	if(palette_selection === undefined || palette_selection === null) return;
	
	this.unset_as_initial_constraint();
	if(palette_selection.is_initial_constraint) { //Otherwise is unsetting field.
		this.set_as_initial_constraint(palette_selection.value);
	}
	
	reset_button_clicked(); //Maintain possibilities.
}

//SOLVER CALLBACK

function solver_callback() {
	//Is it time to restart?
	if(backtrack_limit != undefined && backtrack_limit != null) {
		if(backtracks_done > backtrack_limit) {
			backtracks_done = 0;
			reset_puzzle(puzzle_to_solve);
			solve_call_stack = [];
			restarts_done++;
		}
	}
	
	var retval = take_solver_step(puzzle_to_solve);
	if(restart_limit != undefined && restart_limit != null)
		if(restarts_done > restart_limit)
			retval = -2;
	update_counters();
	
	//console.log(retval.toString());
	if(retval != 0)
	{
		clearInterval(solver_interval);
		solver_interval = null;
		is_running = false;
		
		if(retval === -1) {
			reset_button_clicked();
			set_status("Failed: No Solution", "red");
		}
		else if(retval === -2) {
			reset_button_clicked();
			set_status("Failed: Limit Reached", "red");
		}
		else set_status("Solved", "blue");
	}
}

//PUZZLE CREATION

//Creates a new puzzle grid with all fields empty, puts it in display_area.
function create_puzzle_grid(size, display_area, row_template, field_template) {
	//Destroy the old board
	var temp;
	while(temp = display_area.lastChild) display_area.removeChild(temp);
	
	//Create a new board
	var field_matrix = [];
	for(var i = 0; i < size; i++) {
		var new_row = row_template.cloneNode();
		new_row.id = "row_"+i.toString();
		new_row.style.display = "flex";
		display_area.appendChild(new_row);
		
		var field_matrix_row = [];
		field_matrix.push(field_matrix_row);
		
		for(var j = 0; j < size; j++) {
			var field_element = field_template.cloneNode();
			field_element.id = "field_"+i.toString()+"_"+j.toString();
			field_element.style.display = "block";
			new_row.appendChild(field_element);
			
			var field_object = new Field(size, field_element);
			field_matrix_row.push(field_object);
			field_element.onclick = puzzle_field_clicked.bind(field_object);
		}
	}
	
	//Add sets of constraining fields. Could be faster but whatever.
	for(var i1 = 0; i1 < size; i1++)
	{
		for(var j1 = 0; j1 < size; j1++)
		{
			for(var i2 = 0; i2 < size; i2++)
				if(i2 != i1)
					field_matrix[i1][j1].add_constraint(field_matrix[i2][j1]);
			for(var j2 = 0; j2 < size; j2++)
				if(j2 != j1)
					field_matrix[i1][j1].add_constraint(field_matrix[i1][j2]);
		}
	}
	
	return field_matrix;
}

//Selects num_constraints fields and fills each with a random value.
function create_initial_constraints(field_matrix, num_constraints) {
	var usable_fields = [];
	var chosen_fields = [];
	for(var i = 0; i < field_matrix.length; i++) {
		usable_fields = usable_fields.concat(field_matrix[i]);
	}
	
	for(var i = 0; i < num_constraints && usable_fields.length > 0; i++) {
		var choice = Math.floor(Math.random()*usable_fields.length);
		chosen_fields.push(usable_fields[choice]);
		usable_fields.splice(choice, 1);
	}
	
	for(var i = 0; i < chosen_fields.length; i++) {
		chosen_fields[i].update_options();
		var retval = chosen_fields[i].set_as_initial_constraint();
		if(retval != 1) {
			window.alert("Chosen constraint field is already over-determined");
			return;
		}
	}
}

function create_palette(size) {
	var palette = document.getElementById("palette_area");
	var field_template = document.getElementById("palette_field_template");
	if(palette === undefined || palette === null) return;
	if(field_template === undefined || field_template === null) return;
	
	//Remove old options.
	var temp;
	while(temp = palette.lastChild) palette.removeChild(temp);
	
	//Create blanke option.
	var field_element = field_template.cloneNode();
	field_element.id = "palette_field_blank";
	field_element.style.display = "block";
	field_element.appendChild(document.createTextNode("Clear"));
	palette.appendChild(field_element);
	
	var field_object = new Field(size, field_element);
	field_element.onclick = palette_field_clicked.bind(field_object);
	
	//Create color options.
	for(var i = 0; i < size; i++) {
		field_element = field_template.cloneNode();
		field_element.id = "palette_field_"+i.toString();
		field_element.style.display = "block";
		palette.appendChild(field_element);
		
		field_object = new Field(size, field_element);
		field_object.set_as_initial_constraint(i+1);
		field_element.onclick = palette_field_clicked.bind(field_object);
	}
}

//OTHER

function make_constraints_settable() {
	var palette = document.getElementById("palette_bar");
	
	can_set_constraints = true;
	if(palette != undefined && palette != null) {
		palette.style.visibility = "visible";
	}
}

function make_constraints_fixed() {
	var palette = document.getElementById("palette_bar");
	
	can_set_constraints = false;
	if(palette != undefined && palette != null) {
		palette.style.visibility = "hidden";
	}
}

function update_counters() {
	var backt = document.getElementById("backtracks_since_restart_display");
	var total_backt = document.getElementById("total_backtracks_display");
	var res = document.getElementById("restarts_display");
	if(backt === undefined || total_backt === undefined || res === undefined) return;
	
	backt.lastChild.nodeValue = backtracks_done.toString();
	total_backt.lastChild.nodeValue = total_backtracks_done.toString();
	res.lastChild.nodeValue = restarts_done.toString();
}

function set_status(status_text, status_color) {
	var stat_disp = document.getElementById("status_display");
	if(stat_disp === undefined || stat_disp === null) return;
	
	if(status_color === undefined || status_color === null)
		status_color = "black";
	
	stat_disp.lastChild.nodeValue = status_text;
	stat_disp.style.color = status_color
}
