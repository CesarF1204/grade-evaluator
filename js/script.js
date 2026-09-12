/**
 * DOCU: This script is used to power the Grade Evaluator's subject <br>
 * average calculation. <br>
 * Each subject lives in its own <tbody> row: quarter grade inputs are <br>
 * marked with the `.ge-input` class, the editable subject names use the <br>
 * `.ge-name-input` class, the subject's Average cell is the <br>
 * <td> with the `text-primary-emphasis` styling class, and the Remarks <br>
 * badge and the footer Total Average are kept in sync. <br>
 * Only numeric, non-empty values are included in the average, and an <br>
 * average is only calculated once all four quarters (Q1–Q4) hold valid <br>
 * grades; incomplete rows keep a blank Average cell (no partial / 0 fills). <br>
 */

/**
 * DOCU: This block holds the selector constants used to locate the quarter <br>
 * grade inputs, the Average cell, the Remarks badge, the footer Total Average <br>
 * cell, the subject rows, the subject name input, the add-subject button, and <br>
 * the subjects <tbody>, plus the minimum passing grade for "Passed" remarks. <br>
 */
const GRADE_INPUT_SELECTOR = '.ge-input';
const AVERAGE_CELL_SELECTOR = 'td.text-primary-emphasis';
const REMARKS_BADGE_SELECTOR = 'td.text-start .badge';
const TOTAL_AVERAGE_CELL_SELECTOR = 'tfoot td.fw-bold';
const SUBJECT_ROWS_SELECTOR = 'tbody.ge-subjects tr';
const SUBJECT_NAME_INPUT_SELECTOR = '.ge-name-input';
const ADD_BUTTON_SELECTOR = '.ge-add-btn';
const SUBJECTS_BODY_SELECTOR = 'tbody.ge-subjects';
const PASSING_GRADE = 75;
/**
 * Strict grade format: 0-100, whole or with up to 2 decimal places.
 * Rejects negatives, >100, >2 decimals, letters, symbols, and
 * scientific notation (which the character filter also blocks).
 */
const GRADE_PATTERN = /^\d{1,3}(?:\.\d{1,2})?$/;
const GRADE_INVALID_MESSAGE = 'Enter a grade from 0 to 100, with up to 2 decimal places.';

/**
 * DOCU: This function is used to check whether a raw grade string is a <br>
 * strictly valid grade: matches the allowed format (digits with at most <br>
 * 2 decimal places) and falls within the 0-100 range. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function isValidGradeValue
 * @param {string} raw - the raw input value to validate
 * @returns {boolean} true when the value is a valid grade
 * @author Cesar
 */
const isValidGradeValue = (raw) => {
    if (!GRADE_PATTERN.test(raw)) return false;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 && value <= 100;
};

/**
 * DOCU: This function is used to sanitize a grade input while the user is <br>
 * typing. It strips every character that is not a digit or a decimal <br>
 * point (blocking letters, symbols, math operators, whitespace, and <br>
 * scientific notation), keeps only the first decimal point (blocking <br>
 * multiple decimal points), and caps the decimal portion at 2 places. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function sanitizeGradeValue
 * @param {string} raw - the raw value currently typed by the user
 * @returns {string} the sanitized value safe to place back in the input
 * @author Cesar
 */
const sanitizeGradeValue = (raw) => {
    let value = raw.replace(/[^0-9.]/g, '');

    const firstDot = value.indexOf('.');
    if (firstDot !== -1) {
        const whole = value.slice(0, firstDot);
        const decimals = value.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
        value = `${whole}.${decimals}`;
    }

    return value;
};

/**
 * DOCU: This function is used to attach or remove a Bootstrap tooltip on a <br>
 * quarter grade input. When the field is invalid, the tooltip carries the <br>
 * validation message and appears when hovering (or focusing) the input. <br>
 * When the field becomes valid or empty, the tooltip is fully disposed so <br>
 * the default "Enter grade" title is restored. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function updateGradeTooltip
 * @param {object} input - the quarter grade input element
 * @param {string|null} message - the validation message, or null to remove the tooltip
 * @author Cesar
 */
const updateGradeTooltip = (input, message) => {
    if (window.bootstrap && bootstrap.Tooltip) {
        const existingTooltip = bootstrap.Tooltip.getInstance(input);
        if (existingTooltip) existingTooltip.dispose();
    }

    if (message) {
        input.title = message; // Bootstrap reads `title` for the tooltip content
        input.setAttribute('data-bs-toggle', 'tooltip');
        input.setAttribute('data-bs-placement', 'top');
        input.setAttribute('data-bs-trigger', 'hover focus');
        if (window.bootstrap && bootstrap.Tooltip) {
            bootstrap.Tooltip.getOrCreateInstance(input);
        }
        return;
    }

    input.removeAttribute('data-bs-toggle');
    input.removeAttribute('data-bs-placement');
    input.removeAttribute('data-bs-trigger');
    input.title = 'Enter grade'; // restore the default hint
};

/**
 * DOCU: This function is used to round an average grade to the nearest <br>
 * whole number (e.g. 88.75 → 89). <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function roundGrade
 * @param {number} value - the computed average grade to be rounded
 * @author Cesar
 */
const roundGrade = (value) => Math.round(value);

/**
 * DOCU: This function is used to parse a single grade input value. <br>
 * It returns the numeric grade, or null when the input is empty or <br>
 * non-numeric. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function parseGrade
 * @param {object} input - the DOM element holding the raw grade value
 * @author Cesar
 */
const parseGrade = (input) => {
    const raw = input.value.trim();
    if (raw === '') return null;

    // Only strictly valid grades (format + 0-100 range) may be used
    // in the average calculation; invalid values are always excluded.
    if (!isValidGradeValue(raw)) return null;

    return Number(raw);
};

/**
 * DOCU: This function is used to validate one quarter grade input and <br>
 * reflect the result with Bootstrap validation styles. Invalid fields get <br>
 * `is-invalid` (red border + feedback message), valid non-empty fields get <br>
 * `is-valid`, and empty fields are cleared because quarterly grades may <br>
 * legitimately not all be available yet. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function validateGradeInput
 * @param {object} input - the quarter grade input element to validate
 * @author Cesar
 */
const validateGradeInput = (input) => {
    const raw = input.value.trim();

    input.classList.remove('is-valid', 'is-invalid');

    if (raw === '') {
        // empty fields are allowed — no error state or tooltip
        updateGradeTooltip(input, null);
        return;
    }

    const valid = isValidGradeValue(raw);
    input.classList.add(valid ? 'is-valid' : 'is-invalid');
    // invalid fields get a hover/focus tooltip explaining the allowed format
    updateGradeTooltip(input, valid ? null : GRADE_INVALID_MESSAGE);
};

/**
 * DOCU: This function is used to sanitize the value of a quarter grade <br>
 * input in place, so invalid characters can never persist in the field. <br>
 * It returns true when the sanitized value changed from what the user typed. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function sanitizeGradeInput
 * @param {object} input - the quarter grade input element to sanitize
 * @returns {boolean} true when the value was modified by sanitizing
 * @author Cesar
 */
const sanitizeGradeInput = (input) => {
    const sanitized = sanitizeGradeValue(input.value);
    if (sanitized === input.value) return false;

    input.value = sanitized;
    return true;
};

/**
 * DOCU: This function is used to calculate the average of all valid <br>
 * quarterly grade inputs for one subject row. <br>
 * It returns null unless all four quarterly grade inputs hold <br>
 * strictly valid grades (empty or invalid quarters block the average). <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function calculateSubjectAverage
 * @param {object} row - the subject table row containing the quarter grade inputs
 * @author Cesar
 */
const calculateSubjectAverage = (row) => {
    const gradeInputs = Array.from(row.querySelectorAll(GRADE_INPUT_SELECTOR));

    // The average only exists when all four quarters are complete and
    // valid: empty or invalid quarters never count as 0 or partial data.
    if (gradeInputs.length !== 4) return null;
    if (!gradeInputs.every((input) => parseGrade(input) !== null)) return null;

    const grades = gradeInputs.map(parseGrade);
    const total = grades.reduce((sum, grade) => sum + grade, 0);
    return total / grades.length;
};

/**
 * DOCU: This function is used to render the rounded average and the <br>
 * Remarks badge for one subject row. <br>
 * It shows "—" / "Incomplete" when the average is null, otherwise it <br>
 * displays the rounded average and marks the row "Passed" or "Failed". <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function displaySubjectAverage
 * @param {object} row - the subject table row to be updated
 * @param {number|null} average - the computed subject average, or null when no valid grades exist
 * @author Cesar
 */
const displaySubjectAverage = (row, average) => {
    const averageCell = row.querySelector(AVERAGE_CELL_SELECTOR);
    const remarksBadge = row.querySelector(REMARKS_BADGE_SELECTOR);

    if (average === null) {
        averageCell.textContent = '—'; // dash fallback until all four quarters are complete
        if (remarksBadge) {
            remarksBadge.textContent = 'Incomplete';
            remarksBadge.className = 'badge rounded-pill text-warning-emphasis bg-warning-subtle fw-medium';
        }
        return;
    }

    averageCell.textContent = roundGrade(average);

    if (remarksBadge) {
        const passed = average >= PASSING_GRADE;
        remarksBadge.textContent = passed ? 'Passed' : 'Failed';
        remarksBadge.className = `badge rounded-pill ${
            passed
                ? 'text-success-emphasis bg-success-subtle'
                : 'text-danger-emphasis bg-danger-subtle'
        } fw-medium`;
    }
};

/**
 * DOCU: This function is used to recalculate every subject row's average <br>
 * and the footer Total Average. <br>
 * It loops through all subject rows, renders each average and remarks, <br>
 * and updates the Total Average cell — which only shows a value when <br>
 * every subject row has a completed, valid individual average. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function updateAllAverages
 * @author Cesar
 */
const updateAllAverages = () => {
    const subjectRows = document.querySelectorAll(SUBJECT_ROWS_SELECTOR);
    let total = 0;
    let gradedCount = 0;

    subjectRows.forEach((row) => {
        const average = calculateSubjectAverage(row);
        displaySubjectAverage(row, average);

        if (average !== null) {
            total += average;
            gradedCount += 1;
        }
    });

    const totalAverageCell = document.querySelector(TOTAL_AVERAGE_CELL_SELECTOR);
    if (totalAverageCell) {
        // The Total Average only exists when EVERY subject has a completed
        // individual average (all four quarters valid). Incomplete subjects
        // are never treated as 0 and never averaged partially; the "—" dash
        // is the fallback display while the total cannot be calculated.
        const allComplete = gradedCount === subjectRows.length && gradedCount > 0;
        totalAverageCell.textContent = allComplete ? roundGrade(total / gradedCount) : '—';
    }
};

/**
 * DOCU: This section covers the dynamic subject rows and the "+" <br>
 * add-row control underneath the last subject row. <br>
 * The control lives in its own <tbody> in the markup, so it always <br>
 * stays below the newest last row. <br>
 */

/**
 * DOCU: This function is used to build a new, blank subject row that <br>
 * matches the existing table structure. <br>
 * It creates the subject name field, four empty quarter inputs, the <br>
 * Average cell, and the Remarks badge. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function createSubjectRow
 * @author Cesar
 */
const createSubjectRow = () => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.className = 'text-start';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'form-control form-control-sm px-2 ge-name-input';
    nameInput.placeholder = 'Subject name';
    nameInput.title = 'Click to edit subject name';
    nameInput.setAttribute('aria-label', 'Subject name');
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);

    for (let quarter = 0; quarter < 4; quarter += 1) {
        const cell = document.createElement('td');
        const gradeInput = document.createElement('input');
        gradeInput.type = 'text';
        gradeInput.inputMode = 'decimal';
        gradeInput.autocomplete = 'off';
        gradeInput.className = 'form-control form-control-sm text-center px-1 ge-input';
        gradeInput.min = '0';
        gradeInput.max = '100';
        gradeInput.step = '0.01';
        gradeInput.placeholder = '0-100';
        gradeInput.title = 'Enter grade';
        gradeInput.setAttribute('aria-label', `Quarter ${quarter + 1} grade`);
        cell.appendChild(gradeInput);
        row.appendChild(cell);
    }

    const averageCell = document.createElement('td');
    averageCell.className = 'fw-semibold text-primary-emphasis';
    row.appendChild(averageCell);

    const remarksCell = document.createElement('td');
    remarksCell.className = 'text-start';
    remarksCell.innerHTML =
        '<span class="badge rounded-pill text-warning-emphasis bg-warning-subtle fw-medium">Incomplete</span>';
    row.appendChild(remarksCell);

    return row;
};

/**
 * DOCU: This function is used to wire up the single "+" add-subject <br>
 * control. <br>
 * The button is created once in the HTML (inside its own <tbody> under <br>
 * the subject rows), so exactly one listener is ever attached — no <br>
 * duplicate buttons or broken listeners. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function initAddSubjectControl
 * @author Cesar
 */
const initAddSubjectControl = () => {
    const addButton = document.querySelector(ADD_BUTTON_SELECTOR);
    const subjectsBody = document.querySelector(SUBJECTS_BODY_SELECTOR);
    if (!addButton || !subjectsBody) return;

    addButton.addEventListener('click', () => {
        const lastRow = subjectsBody.querySelector('tr:last-of-type');
        if (!lastRow) return;

        const newRow = createSubjectRow();
        lastRow.after(newRow); // control <tbody> stays below the new last row

        updateAllAverages(); // show "—"/Incomplete for the blank row
        newRow.querySelector(SUBJECT_NAME_INPUT_SELECTOR).focus();
    });
};

/**
 * DOCU: This function is used to initialize the Grade Evaluator and keep <br>
 * every subject's average live. <br>
 * Recalculation happens whenever a quarterly grade is added, changed, or <br>
 * removed, and each row is computed independently so subjects never <br>
 * affect one another. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function initGradeEvaluator
 * @author Cesar
 */
const initGradeEvaluator = () => {
    updateAllAverages();
    initAddSubjectControl();

    // Event delegation: one listener handles all quarter inputs,
    // including those in dynamically added rows. While typing, the value
    // is sanitized (invalid characters stripped) and validated live with
    // Bootstrap styles; only valid values ever reach the averages.
    document.addEventListener('input', (event) => {
        if (event.target.matches(GRADE_INPUT_SELECTOR)) {
            sanitizeGradeInput(event.target);
            validateGradeInput(event.target);
            updateAllAverages();
        }
    });

    // On blur (and on form-level checks), show final validation feedback.
    document.addEventListener('blur', (event) => {
        if (event.target.matches && event.target.matches(GRADE_INPUT_SELECTOR)) {
            validateGradeInput(event.target);
        }
    }, true);
};

document.addEventListener('DOMContentLoaded', initGradeEvaluator);
