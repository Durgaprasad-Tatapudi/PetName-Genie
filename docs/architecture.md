# PetName Genie - System Architecture

## Overview
PetName Genie is a Client-Side Web Application utilizing a modular JavaScript architecture. It follows the Separation of Concerns principle, isolating data, logic, and presentation.

## Tech Stack
-   **Frontend**: HTML5, CSS3 (Custom Variables), JavaScript (ES6 Modules)
-   **Data**: JSON (Local Datasets)
-   **Storage**: localStorage (Favorites), sessionStorage (History)

## Component Structure
1.  **Presentation Layer**: `index.html` structure and CSS methods for styling and responsiveness.
2.  **Logic Layer**:
    -   `app.js`: Main Controller, event listeners, DOM manipulation.
    -   `nameGenerator.js`: Core Algorithm for filtering and pattern matching.
    -   `utils.js`: Helper functions (randomizers, fetch wrappers).
3.  **Data Layer**:
    -   `pd_names_dataset.json`: Base names and expansion rules.
    -   `name_meanings.json`: Dictionary of meanings.

## Data Flow
1.  User selects criteria (Type, Gender, Emotion).
2.  `app.js` captures input and calls `generateNames()`.
3.  `nameGenerator.js` queries JSON data, applies filters, and instantiates patterns.
4.  Resulting name object (Name + Meaning + Tags) is returned.
5.  `app.js` renders the result card to the DOM.
