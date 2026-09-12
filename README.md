# Grade Evaluator

A responsive, accessible web application for calculating student grade averages across four quarters. Enter quarterly grades for each subject, and the app automatically computes per-subject averages, assigns Passed/Failed remarks, and displays a total average — all in the browser with no server required.

Built with vanilla HTML, CSS, and JavaScript, styled with Bootstrap 5, and designed with accessibility (ARIA, keyboard navigation, screen-reader support) in mind.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Browser Support](#browser-support)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Quarterly Grade Entry** — Input grades for Q1, Q2, Q3, and Q4 for each subject.
- **Automatic Average Calculation** — Per-subject averages are computed live once all four quarters contain valid grades.
- **Remarks System** — Each subject receives a **Passed** (green) or **Failed** (red) badge based on a 75-point passing threshold.
- **Total Average** — A footer row displays the overall average across all subjects and its corresponding remarks.
- **Dynamic Subjects** — Add new subjects or remove existing ones at any time.
- **Reset Grades** — Clear all quarter grades for a single subject with one click (with confirmation).
- **Editable Subject Names** — Rename any subject inline; names are validated for uniqueness and requiredness.
- **Grade Validation** — Only numeric values from 0 to 100 (with up to 2 decimal places) are accepted; invalid input is blocked and flagged.
- **Name-First Guard** — Grade fields are disabled until a subject name is entered, preventing orphaned data.
- **Toast Notifications** — Success toasts confirm actions like subject removal, grade reset, and name updates.
- **Confirmation Modals** — Destructive actions (clear grades, remove subject) require explicit confirmation.
- **School Year Badge** — Automatically displays the current school year (e.g., "S.Y. 2026–2027").
- **Responsive Design** — Works on mobile, tablet, and desktop viewports.
- **Print-Friendly** — Clean print styles hide interactive controls for easy printing.
- **Reduced Motion** — Respects the `prefers-reduced-motion` user preference.

---

## Project Structure

```
grade-evaluator/
├── index.html          # Main HTML structure (Bootstrap 5 layout, table, modals)
├── css/
│   └── style.css       # Custom styles (variables, table, inputs, toasts, responsive)
├── js/
│   └── script.js       # Application logic (validation, calculations, DOM management)
└── images/
    └── logo.png        # Favicon / brand logo
```

### File Details

| File | Purpose |
|------|---------|
| `index.html` | The single-page markup containing the grade table, confirmation modal, toast container, and live regions. Loads Bootstrap 5, Bootstrap Icons, and Google Fonts via CDN. |
| `css/style.css` | All custom styling including CSS custom properties, table layout, input states, toast animations, responsive breakpoints, print styles, and reduced-motion overrides. |
| `js/script.js` | All application logic: grade validation, average calculation, subject management (add/remove/reset), name validation, toast notifications, modal handling, and event delegation. |
| `images/logo.png` | The favicon displayed in the browser tab. |

---

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge — latest two versions)
- An internet connection (required for CDN-loaded dependencies: Bootstrap, Bootstrap Icons, Google Fonts)

> **No build tools, package managers, or server software are required.** This is a zero-dependency frontend project.

---

## Installation

### Option 1: Clone the Repository

```bash
git clone https://github.com/CesarF1204/grade-evaluator.git
cd grade-evaluator
```

### Option 2: Download

Download the project files and extract them to a local directory.

---

## Usage

### Running the Project

Simply open `index.html` in your browser:

```bash
# macOS / Linux
open index.html

# Windows
start index.html
```

### How to Use

1. **Enter a subject name** — The app starts with five default subjects (English, Mathematics, Science, Filipino, Social Studies). Click any subject name to edit it.
2. **Input quarterly grades** — Enter a grade (0–100) for Q1, Q2, Q3, and Q4. Grades support up to 2 decimal places (e.g., `89.5`).
3. **View the average** — Once all four quarters have a valid grade, the subject's average and remarks (Passed/Failed) appear automatically.
4. **Check the total average** — The footer row shows the overall average across all subjects and its remarks.
5. **Add a subject** — Click the **"+ Add subject"** button below the table to add a new row.
6. **Reset grades** — Click the reset icon (↺) in a subject's Action column to clear all its quarter grades.
7. **Remove a subject** — Click the delete icon (🗑) in a subject's Action column to remove the entire row.

### Grade Entry Rules

| Rule | Details |
|------|---------|
| Range | 0 to 100 (inclusive) |
| Decimals | Up to 2 decimal places (e.g., `92.75`) |
| Invalid input | Letters, symbols, negatives, and values > 100 are blocked |
| Partial grades | Average is only shown when **all four** quarters have valid grades |
| Passing grade | 75 or above = Passed; below 75 = Failed |

---

## Configuration

This project has **no environment variables, configuration files, or build settings**. All behavior is controlled directly in the source files:

- **Passing grade threshold** — Defined as `PASSING_GRADE = 75` in `js/script.js` (line 38). Change this value to adjust the passing mark.
- **Default subjects** — Defined in `index.html` within the `#ge_subjects_body` tbody.
- **Styling** — CSS custom properties are defined in `css/style.css` under `:root` (colors, spacing, shadows, etc.).

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

The app uses modern CSS (custom properties, `flexbox`, `grid`) and JavaScript (ES6+ `const`/`let`, arrow functions, spread operator, `Array.prototype.some`) that are supported in all modern browsers.

---

## Accessibility

The Grade Evaluator is built with accessibility as a core requirement:

- **ARIA labels** — All interactive elements have descriptive `aria-label` attributes.
- **ARIA live regions** — Screen readers announce dynamic updates (e.g., "Subject added", validation errors).
- **Keyboard navigation** — Full keyboard support including Tab, Enter, and Escape.
- **Focus management** — Focus is directed logically (e.g., to the name field when grades are blocked, to the first grade field after naming a subject).
- **Focus indicators** — Visible focus rings on all interactive elements.
- **Color independence** — Remarks are conveyed with text labels ("Passed"/"Failed") in addition to color.
- **Reduced motion** — Animations and transitions are disabled for users who prefer reduced motion.
- **Semantic HTML** — Proper table structure with `<thead>`, `<tbody>`, `<tfoot>`, and `<caption>`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Styles not loading | Ensure you have an active internet connection (Bootstrap and fonts are loaded via CDN). |
| Grades not calculating | All four quarter fields must contain valid grades (0–100). Partial entries will not produce an average. |
| "Enter the subject name first" tooltip | Grade fields are disabled until a subject name is entered. Click the name field and type a name first. |
| "This subject name is already in the list" | Subject names must be unique. Choose a different name for the duplicate. |
| Toast notifications not appearing | Check that JavaScript is enabled in your browser. |
| Layout issues on small screens | The table is responsive; scroll horizontally if needed. Ensure your browser is up to date. |
| Changes lost on page refresh | This app does not persist data to a server or local storage. All data exists only during the current session. |

---

## Contributing

Contributions are welcome! Here's how to get involved:

1. **Fork** the repository on GitHub.
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the existing code style and conventions.
4. **Test** your changes across multiple browsers.
5. **Commit** with a clear, descriptive message:
   ```bash
   git commit -m "Add: description of your change"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** against the `main` branch.

### Code Style

- Use `const` and `let` (never `var`).
- Use camelCase for variable and function names.
- Prefix CSS classes with `ge-` to avoid collisions.
- Include JSDoc comments for all functions.
- Keep functions small and focused on a single responsibility.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Author

**Cesar Francisco**

- GitHub: [@CesarF1204](https://github.com/CesarF1204)
