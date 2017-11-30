Constraint-Based Spreadsheet
============================

[![Demo video](https://img.shields.io/badge/Demo%20video-%E2%86%92-9D6EB3.svg?style=flat-square)](http://alexwarth.github.io/media/constraint-based-spreadsheet.mp4) [![Live demo](https://img.shields.io/badge/Live%20demo-%E2%86%92-9D6EB3.svg?style=flat-square)](https://alexwarth.github.io/projects/constraint-based-spreadsheet)


In a standard spreadsheet application, the relationships defined by formulas are strictly one-way: if the formula for `expenses` is `=rent+groceries`, then entering a new value for `rent` or `groceries` will cause the value of `expenses` to change, but entering a new value for `expenses` will simply replace its formula with the new value, leaving the other cells unchanged. There is no *direct* way for the user to set the value of a cell like `expenses` while still maintaining that cell's relationship to the other cells. Instead, the user must repeatedly enter different values for the other cells until the formula for `expenses` happens to yield the desired value. In our simple example, this kind of experimentation is not all that difficult or time-consuming (and it would be even easier to find an analytical solution) but in larger, more complex spreadsheets, it can be a significant burden to the user.

The *Constraint-Based Spreadsheet* project is an attempt to make spreadsheets more powerful and user-friendly by replacing formulas with multi-way constraints. A constraint, unlike a formula, does not belong to or specify the value of a single cell. Rather, it specifies how the values of different cells relate to each other. A single cell can be referenced in (and influenced by) any number of constraints. When the user changes the value of a cell, the system automatically finds new values for the other cells (giving preference to smaller changes) such that all of the constraints are satisfied. If the user doesn't like these new values, it's because she hasn't yet communicated all of the relevant constraints to the system. Adding more constraints will further restrict the solution space and lead to the desired solution.

## User Interface

* When the user adds a constraint, any cell that's referenced and doesn't already exist will be created automatically.
* When the user deletes a cell, its current value gets inlined into each constraint that referenced that cell. (This was Bret's suggestion.)
* The user can **lock** a cell to keep the solver from modifying the value of that cell in order to satisfy constraints.

## Interesting / Tricky Bits

* When the user changes the value of a cell:
    *  The solver spreads the resulting "error"  more or less evenly among the other cells. (**TODO: Explain how this is implemented.**) Another alternative would have been to change one cell at a time to reduce the error as much as possible, but that felt too jerky / unfair most of the time.
    *  If, after a certain amount of time, the solver still hasn't found a solution that uses the new value, it will assume that there is no such solution, and allow itself to change the value of that cell in order to satisfy the constraints.
* It is possible for the user to enter a set of constraints that doesn't have a solution, i.e., that is unsatisfiable. When this happens, the solver will keep trying anyway. There is a "spinny" icon that you can click on to interrupt the solver. (It will start up again the next time you add / modify a constraint or modify the value of a cell.)

## Future work

* Improve the user interface, e.g., there should be icons / buttons on the cells for "lock" and "delete". (They're currently unlabeled.)
* Merge this project with RelaxCanvas so that the spreadsheet can generate graphs, etc.
    * The connection between the graph and the cells will be two-way, so the user can change the value of the cells by manipulating the graph directly.
* Borrow some good ideas from [Lotus Improv](http://en.wikipedia.org/wiki/Lotus_Improv).

## Authors

* [Alex Warth](http://github.com/alexwarth)
