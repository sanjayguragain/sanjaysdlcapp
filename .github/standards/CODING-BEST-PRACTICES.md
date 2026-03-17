# Coding Rules

## Primary objective

- Write code that any team member can easily understand, change, extend, and
  maintain.
- Optimize for clarity first. Clear code improves readability, changeability,
  extensibility, and maintainability.

## General rules

1. Follow the project's existing conventions and the standard conventions of the language and framework.
2. Prefer the simplest solution that correctly solves the problem.
3. Reduce complexity whenever possible.
4. When modifying code, leave the surrounding code cleaner than you found it.
5. Fix root causes, not just symptoms.

## Design rules

1. Keep configuration at higher levels of the system, not buried in low-level implementation details.
2. Prefer polymorphism over large if/else or switch/case structures when behavior varies by type or role.
3. Isolate concurrency and multi-threading code from business logic.
4. Do not add configurability unless there is a real and demonstrated need for it.
5. Use dependency injection to reduce coupling and improve testability.
6. Follow the Law of Demeter: a class, function, or module should interact only with its direct dependencies.

## Understandability rules

1. Be consistent in naming, structure, formatting, and patterns.
2. Use explanatory variables when they make code easier to understand.
3. Encapsulate boundary conditions in a single, obvious place.
4. Prefer value objects over primitive types when domain meaning matters.
5. Avoid hidden logical dependencies between methods, state, or call order.
6. Prefer positive conditionals over negative conditionals.

## Naming rules

1. Choose descriptive, specific, and unambiguous names.
2. Make meaningful distinctions between different concepts.
3. Use names that are easy to pronounce and discuss.
4. Use names that are easy to search for.
5. Replace magic numbers with named constants.
6. Do not encode type, scope, or implementation details into names.

## Function rules

1. Keep functions small.
2. Make each function do one thing.
3. Use descriptive function names.
4. Prefer fewer parameters.
5. Avoid side effects unless they are the explicit purpose of the function.
6. Do not use flag arguments; split behavior into separate functions or methods instead.

## Comment rules

1. Prefer self-explanatory code over comments.
2. Do not add comments that merely restate the code.
3. Do not add noisy or obvious comments.
4. Do not use closing-brace comments.
5. Do not leave commented-out code in the codebase.
6. Use comments only to explain intent, clarify non-obvious logic, or warn about important consequences.

## Source code structure rules

1. Separate different concepts vertically.
2. Keep related code physically close together.
3. Declare variables as close as possible to where they are used.
4. Keep dependent functions close to each other.
5. Keep similar functions close to each other.
6. Organize code so higher-level flow appears before lower-level details when practical.
7. Keep lines reasonably short.
8. Do not use horizontal alignment for visual decoration.
9. Use whitespace to group related code and separate unrelated code.
10. Preserve consistent indentation.

## Objects and data structure rules

1. Hide internal representation and implementation details.
2. Use plain data structures for passive data and objects for behavior; avoid hybrid abstractions that do both poorly.
3. Keep classes and structures small.
4. Give each class or structure a single, focused responsibility.
5. Keep the number of instance variables small.
6. Ensure base classes do not depend on knowledge of derived classes.
7. Prefer explicit functions or polymorphism over behavior-selection patterns that obscure intent.
8. Prefer instance methods over static methods unless there is a strong reason to use static behavior.

## Test rules

1. Prefer one logical assertion per test.
2. Make tests easy to read.
3. Keep tests fast.
4. Keep tests independent from one another.
5. Ensure tests are repeatable and deterministic.

## Code smell rules

1. Avoid rigidity: do not create designs where small changes trigger many unrelated changes.
2. Avoid fragility: do not create designs where one change breaks unrelated behavior.
3. Avoid immobility: do not tightly couple code so it becomes hard to reuse.
4. Avoid needless complexity.
5. Avoid needless repetition.
6. Avoid opacity: do not produce code that is hard to understand.

## Final self-check before submitting code

1. Confirm the solution is the simplest correct design.
2. Confirm names are clear and consistent.
3. Confirm functions and classes have one focused responsibility.
4. Confirm comments are necessary and useful.
5. Confirm configuration, dependencies, and concurrency are properly isolated.
6. Confirm tests are readable, independent, fast, and deterministic.
7. Confirm the change improves the codebase overall, not just the immediate task.