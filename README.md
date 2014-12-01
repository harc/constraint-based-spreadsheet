# Constraint-Based Spreadsheet

In a standard spreadsheet application, the relationships defined by formulas are strictly one-way: if the formula for `expenses` is `=rent+groceries`, then entering a new value for `rent` or `groceries` will cause the value of `expenses` to change, but entering a new value for `expenses` will simply replace its formula with the new value, leaving the other cells unchanged. There is no *direct* way for the user to set the value of a cell like `expenses` while still maintaining that cell's relationship to the other cells. Instead, the user must repeatedly enter different values for the other cells until the formula for `expenses` happens to yield the desired value. In our simple example, this kind of experimentation is not all that difficult or time-consuming (and it would be even easier to find an analytical solution) but in larger, more complex spreadsheets, it can be a significant burden to the user.

The *Constraint-Based Spreadsheet* project is an attempt to make spreadsheets more powerful and user-friendly by replacing formulas with multi-way constraints. A constraint, unlike a formula, does not belong to or specify the value of a single cell. Rather, it specifies how the values of different cells relate to each other. The same cell can be referenced in (and influenced by) any number of constraints. When the user changes the value of a cell, the system automatically finds new values for the other cells (giving preference to smaller changes) such that all of the constraints are satisfied. If the user doesn't like these new values, it's because she hasn't yet communicated all of the relevant constraints to the system. Adding more constraints will further restrict the solution space and lead to the desired solution.

## User Interface

* When the user adds a constraint, any cell that's referenced and doesn't already exist will be created automatically.
* When the user deletes a cell, its current value gets inlined into each constraint that referenced that cell. (This was Bret's suggestion.)
* The user can **lock** a cell to keep the solver from modifying the value of that cell in order to satisfy constraints.

## Interesting / Tricky Bits

* When the user changes the value of a cell:
    *  The solver spreads the resulting "error"  more or less evenly among the other cells. (**TODO: Explain how this is implemented.**) Another alternative would have been to change a single cell at a time to reduce the error as much as possible, but that felt too jerky / unfair most of the time.
    *  If, after a certain amount of time, the solver still hasn't found a solution that uses the new value, it will assume that there is no such solution, and change the value of that cell in order to satisfy the constraints.
* It is possible for the user to enter a set of constraints that doesn't have a solution, i.e., that is unsatisfiable. When this happens, the solver will keep trying anyway. There is a "spinny" icon that you can click on to interrupt the solver. (It will start up again the next time you add a constraint or modify the value of a cell.)

## Future work

* Improvements to the user interface
* Merge this project with RelaxCanvas so that the spreadsheet can generate graphs, etc.

## Trash

* Constraints are higher-level than formulas, because they  can specify exactly what you want.
* CBS eliminates the need for trial and error / searching. (The system does that for you.)


(Problem: discards formula.)

(Problem: can only have one formula per cell.)

According to Wikipedia:

> The user of the spreadsheet can make changes in any stored value and observe the effects on calculated values. This makes the spreadsheet useful for "what-if" analysis since many cases can be rapidly investigated without tedious manual recalculation.

Most of the time we do this kind of "what if" analysis, it's because we're looking for values that will satisfy a constraint (or a set of constraints), e.g., the budget in a business plan should equal $2M. Traditional spreadsheets do not allow users to enter these kinds of constraints. Since these constraints are not explicit in the spreadsheet, the system can't do anything to help the user.

The constraint-based spreadsheet is a generalization of typical (formula-based) spreadsheets that enables users to state what 

Spreadsheets are a tremendously useful tool for end-users and programmers alike. Just type in some numbers and a couple of formulas, and there's your budget / inventory / financial projections / whatever.