JS-based Latin Squares solver/visualization.

Allows creation of randomized puzzles with a specified size and number of initial
constraints. Constraints can also be manually added. Also includes two predefined
puzzles. One is unsolvable and takes the solver a relatively long time to
determine it is unsolvable. The other exhibits heavy-tailed behavior: usually it
will be solved quickly, but occassionally it will require a lot of backtracking.

The solver uses a backtracking search with forward checking. It is possible to
specify a number of allowed backtracks before restarting, and a number of allowed
restarts before failing.

Constraints and prospective assignments are displayed as a color as well as a
number. The display will be updated in real time as the solution is found. Given
the recursive nature of the solver and the use of single-threaded JavaScript, an
execution stack was simulated to facilitate the updating of the display while the
solution is in progress.

The purpose of this solver is to illustrate certain interesting behaviors of the
algorithm. As such there is an adjustable delay between each step of the solution.
