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
const REMARKS_BADGE_SELECTOR = 'td.text-center .badge';
const TOTAL_AVERAGE_REMARKS_SELECTOR = '#total_average_remarks';
const TOTAL_AVERAGE_CELL_SELECTOR = '#ge_total_average';
const SUBJECT_ROWS_SELECTOR = '#ge_subjects_body tr';
const SUBJECT_NAME_INPUT_SELECTOR = '.ge-name-input';
const ADD_BUTTON_SELECTOR = '#ge_add_subject_button';
const SUBJECTS_BODY_SELECTOR = '#ge_subjects_body';
const SUBJECT_ROW_SELECTOR = 'tr';
const RESET_BUTTON_SELECTOR = '.ge-action-reset';
const RESET_TOOLTIP_HOST_SELECTOR = '.ge-tooltip-host';
const DELETE_BUTTON_SELECTOR = '.ge-action-delete';
const CONFIRM_MODAL_SELECTOR = '#ge_confirm_modal';
const CONFIRM_MODAL_TITLE_SELECTOR = '#ge_confirm_modal_title';
const CONFIRM_MODAL_BODY_SELECTOR = '#ge_confirm_modal_body';
const CONFIRM_MODAL_ACTION_SELECTOR = '#ge_confirm_modal_action';
const LIVE_REGION_SELECTOR = '#ge_live_region';
const PASSING_GRADE = 75;
/**
 * Cached reference to the Total Average Remarks cell in the footer.
 * Set once on init and reused for all subsequent updates.
 */
let totalAverageRemarksCell = null;
/**
 * Strict grade format: 0-100, whole or with up to 2 decimal places.
 * Rejects negatives, >100, >2 decimals, letters, symbols, and
 * scientific notation (which the character filter also blocks).
 */
const GRADE_PATTERN = /^\d{1,3}(?:\.\d{1,2})?$/;
const GRADE_INVALID_MESSAGE = 'Enter a grade from 0 to 100, with up to 2 decimal places.';
const NAME_REQUIRED_MESSAGE = 'Subject name is required';
const GRADE_BLOCKED_TITLE = 'Enter the subject name first';
const NAME_REQUIRED_ANNOUNCEMENT = 'Please enter a subject name before entering a grade.';

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
 * DOCU: This function is used to remove unnecessary leading zeros from a <br>
 * sanitized grade value while preserving its numeric meaning. A whole-number <br>
 * portion made entirely of zeros collapses to a single "0", and leading zeros <br>
 * before other digits are stripped (e.g. "005" → "5", "000" → "0", "00.5" → <br>
 * "0.5"). The decimal portion is left untouched. Values that already have no <br>
 * unnecessary leading zeros, empty values, and bare decimal points are <br>
 * returned unchanged so the typing flow stays natural. <br>
 * Last Updated Date: September 13, 2026 <br>
 * @function normalizeLeadingZeros
 * @param {string} value - the sanitized grade value (digits and at most one decimal point)
 * @returns {string} the value with unnecessary leading zeros removed
 * @author Cesar
 */
const normalizeLeadingZeros = (value) => {
    // Skip empty values and bare decimal points to avoid disrupting typing
    if (!value || value === '.') return value;

    const firstDot = value.indexOf('.');

    // Split into whole and decimal portions (decimal portion includes the dot)
    const hasDot = firstDot !== -1;
    const whole = hasDot ? value.slice(0, firstDot) : value;
    const decimalPart = hasDot ? value.slice(firstDot) : '';

    // Only normalize when the whole part actually has unnecessary leading zeros:
    // it must have more than one digit and start with '0'
    if (whole.length <= 1 || whole[0] !== '0') return value;

    // Strip leading zeros from the whole part; collapse all-zero strings to "0"
    const stripped = whole.replace(/^0+/, '');
    const normalizedWhole = stripped === '' ? '0' : stripped;

    return normalizedWhole + decimalPart;
};

/**
 * DOCU: This function is used to sanitize a grade input while the user is <br>
 * typing. It strips every character that is not a digit or a decimal <br>
 * point (blocking letters, symbols, math operators, whitespace, and <br>
 * scientific notation), keeps only the first decimal point (blocking <br>
 * multiple decimal points), caps the decimal portion at 2 places, and <br>
 * normalizes unnecessary leading zeros. <br>
 * Last Updated Date: September 13, 2026 <br>
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

    return normalizeLeadingZeros(value);
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

    averageCell.textContent = roundGrade(average) + '%';

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
    // The Total Average only exists when EVERY subject has a completed
    // individual average (all four quarters valid). Incomplete subjects
    // are never treated as 0 and never averaged partially; the "—" dash
    // is the fallback display while the total cannot be calculated.
    const allComplete = gradedCount === subjectRows.length && gradedCount > 0;
    const totalAverage = allComplete ? roundGrade(total / gradedCount) : null;

    if (totalAverageCell) {
        totalAverageCell.textContent = totalAverage !== null ? totalAverage + '%' : '—';
    }

    // Update Total Average Remarks based on all subjects' remarks and the Total Average
    updateTotalAverageRemarks(subjectRows, totalAverage);
};

/**
 * DOCU: Pure function that calculates the Total Average Remarks based on
 * the remarks of all subjects and the overall Total Average. Returns the
 * appropriate status string without any DOM manipulation.
 * Priority rules:
 * 1. If any subject has "Incomplete" → "—" (highest priority)
 * 2. If any subject has "Failed" → "Unqualified"
 * 3. If all subjects have "Passed" AND Total Average >= 75 → "Promoted"
 * 4. If all subjects have "Passed" AND Total Average < 75 → "Unqualified"
 * 5. Otherwise (empty/missing/indeterminate) → "—" (fallback)
 * Last Updated Date: September 13, 2026
 * @function calculateTotalAverageRemarks
 * @param {NodeList} subjectRows - all subject table rows to evaluate
 * @param {number|null} totalAverage - the rounded overall Total Average, or null when not all subjects have valid averages
 * @returns {string} the calculated Total Average Remarks value
 * @author Cesar
 */
const calculateTotalAverageRemarks = (subjectRows, totalAverage) => {
    // Collect all subject remarks
    const remarks = [];
    subjectRows.forEach((row) => {
        const remarksBadge = row.querySelector(REMARKS_BADGE_SELECTOR);
        if (remarksBadge) {
            const remark = remarksBadge.textContent.trim();
            if (remark) {
                remarks.push(remark);
            }
        }
    });

    // If no remarks collected (no subjects or all empty), use fallback
    if (remarks.length === 0) {
        return '—';
    }

    // Priority 1: Incomplete has highest priority - if any subject is Incomplete, result is "—"
    if (remarks.some((r) => r === 'Incomplete')) {
        return '—';
    }
    // Priority 2: Failed takes priority over Promoted
    if (remarks.some((r) => r === 'Failed')) {
        return 'Unqualified';
    }
    // At this point, every subject remark is "Passed"
    // Priority 3: All Passed AND Total Average >= 75 → Promoted
    if (totalAverage !== null && totalAverage >= 75) {
        return 'Promoted';
    }
    // Priority 4: All Passed AND Total Average < 75 → Unqualified
    return 'Unqualified';
};

/**
 * DOCU: Updates the Total Average Remarks cell with the calculated value.
 * Uses cached DOM reference for better performance.
 * Last Updated Date: September 13, 2026
 * @function updateTotalAverageRemarks
 * @param {NodeList} subjectRows - all subject table rows to evaluate
 * @param {number|null} totalAverage - the rounded overall Total Average, or null when not all subjects have valid averages
 * @author Cesar
 */
const updateTotalAverageRemarks = (subjectRows, totalAverage) => {
    if (!totalAverageRemarksCell) return;

    const remarks = calculateTotalAverageRemarks(subjectRows, totalAverage);
    totalAverageRemarksCell.textContent = remarks;
    totalAverageRemarksCell.className = `text-center fw-bold fs-6 ge-total-remark ge-total-remark--${remarks.toLowerCase().replace('—', 'none')}`;
};

/**
 * DOCU: Sets the default/fallback value "—" for Total Average Remarks.
 * Called once on initialization before any calculations occur.
 * Last Updated Date: September 12, 2026
 * @function setDefaultTotalAverageRemarks
 * @author Cesar
 */
const setDefaultTotalAverageRemarks = () => {
    totalAverageRemarksCell = document.querySelector(TOTAL_AVERAGE_REMARKS_SELECTOR);
    
    if (totalAverageRemarksCell && totalAverageRemarksCell.textContent.trim() === '') {
        totalAverageRemarksCell.textContent = '—';
    }
};

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
    nameInput.placeholder = 'e.g. Mathematics';
    nameInput.title = 'Enter the subject name';
    nameInput.maxLength = 60;
    nameInput.setAttribute('aria-label', 'Subject name');
    nameInput.setAttribute('data-ge-name-input', '');
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
    remarksCell.className = 'text-center';
    remarksCell.innerHTML =
        '<span class="badge rounded-pill text-warning-emphasis bg-warning-subtle fw-medium">Incomplete</span>';
    row.appendChild(remarksCell);

    row.appendChild(createActionCell());

    // A brand-new row has no subject name yet, so its grade fields
    // start blocked until the user enters a valid name
    syncGradeInputsState(row);

    return row;
};

/**
 * DOCU: This function is used to build the Action cell with the Clear <br>
 * all subject grades (clear values) and Delete (remove subject) icon <br>
 * buttons for a subject row. <br>
 * Buttons carry Bootstrap tooltip attributes; no IDs are used anywhere so <br>
 * dynamically added rows can never create duplicate IDs or broken handlers <br>
 * (behavior is wired through event delegation instead of per-row listeners). <br>
 * The Clear button starts disabled because a brand-new row has no grades. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function createActionCell
 * @returns {object} the <td> containing the Clear and Delete buttons
 * @author Cesar
 */
const createActionCell = () => {
    const actionCell = document.createElement('td');
    actionCell.className = 'ge-col-action';
    actionCell.innerHTML =
        '<div class="d-inline-flex align-items-center gap-1">' +
        '<span class="d-inline-block ge-tooltip-host" tabindex="0" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Clear all subject grades">' +
        '<button type="button" class="btn btn-sm btn-outline-secondary ge-action-btn ge-action-reset" aria-label="Clear all subject grades" disabled><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i></button>' +
        '</span>' +
        '<button type="button" class="btn btn-sm btn-outline-danger ge-action-btn ge-action-delete" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Remove subject" aria-label="Delete subject"><i class="bi bi-trash3" aria-hidden="true"></i></button>' +
        '</div>';
    return actionCell;
};

/**
 * DOCU: This function is used to clear the Quarter 1–4 grade inputs of one <br>
 * subject row. The subject name is never touched, the row is kept in the <br>
 * table, and validation states/tooltips on the cleared inputs are removed. <br>
 * The Average is cleared too because the required quarterly grades are no <br>
 * longer complete; updateAllAverages() then re-renders the Average cell, <br>
 * the Remarks badge, and the Total Average (blank while any subject is <br>
 * incomplete). Other subjects are never modified. A success toast naming <br>
 * the affected subject is shown once the reset completes. <br>
 * Last Updated Date: September 13, 2026 <br>
 * @function resetSubjectRow
 * @param {object} row - the subject <tr> whose grades should be cleared
 * @author Cesar
 */
const resetSubjectRow = (row) => {
    const subjectName = getSubjectName(row);

    row.querySelectorAll(GRADE_INPUT_SELECTOR).forEach((input) => {
        input.value = '';
        input.classList.remove('is-valid', 'is-invalid');
        updateGradeTooltip(input, null);
    });

    updateClearButtonState(row);
    updateAllAverages();

    const toastMessage = subjectName && subjectName !== 'this subject'
        ? `Grades for ${subjectName} reset successfully.`
        : 'Grade values reset successfully.';
    showSuccessToast(toastMessage);
};

/**
 * DOCU: This function is used to update the tooltip shown when hovering the <br>
 * "Clear all subject grades" button. The tooltip lives on the wrapper <br>
 * `.ge-tooltip-host` span so it stays reachable while the button is <br>
 * disabled. When the button is disabled (no grades entered), the tooltip <br>
 * explains why ("No grade value was entered") and the cursor becomes a <br>
 * not-allowed cursor; when enabled, it shows the action's name. Because <br>
 * Bootstrap caches the tooltip title from `data-bs-title` at instance <br>
 * creation, the tooltip is disposed and recreated whenever the state <br>
 * changes. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function updateResetTooltip
 * @param {object} row - the subject <tr> whose Clear tooltip should be updated
 * @author Cesar
 */
const updateResetTooltip = (row) => {
    const host = row.querySelector(RESET_TOOLTIP_HOST_SELECTOR);
    const clearButton = row.querySelector(RESET_BUTTON_SELECTOR);
    if (!host || !clearButton) return;

    const isDisabled = clearButton.disabled;

    if (window.bootstrap && bootstrap.Tooltip) {
        const existingTooltip = bootstrap.Tooltip.getInstance(host);
        if (existingTooltip) existingTooltip.dispose();
    }

    host.setAttribute('data-bs-title', isDisabled
        ? 'No grade value was entered'
        : 'Clear all subject grades');
    host.classList.toggle('ge-no-grades', isDisabled);

    if (window.bootstrap && bootstrap.Tooltip) {
        bootstrap.Tooltip.getOrCreateInstance(host);
    }
};

/**
 * DOCU: This function is used to enable or disable the "Clear all subject <br>
 * grades" button of one subject row. The button is disabled whenever none <br>
 * of the Quarter 1–4 fields hold any value, and enabled as soon as at <br>
 * least one grade has been entered. The tooltip on the button's wrapper <br>
 * is kept in sync with the disabled state. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function updateClearButtonState
 * @param {object} row - the subject <tr> whose Clear button should be updated
 * @author Cesar
 */
const updateClearButtonState = (row) => {
    const clearButton = row.querySelector(RESET_BUTTON_SELECTOR);
    if (!clearButton) return;

    const hasAnyGrade = [...row.querySelectorAll(GRADE_INPUT_SELECTOR)]
        .some((input) => input.value.trim() !== '');

    clearButton.disabled = !hasAnyGrade;
    updateResetTooltip(row);
};

/**
 * DOCU: This function is used to refresh the disabled/enabled state of the <br>
 * "Clear all subject grades" button on every subject row. Used at startup <br>
 * so server-rendered (pre-filled) rows get the correct state too. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function updateAllClearButtons
 * @author Cesar
 */
const updateAllClearButtons = () => {
    document.querySelectorAll(SUBJECT_ROWS_SELECTOR).forEach(updateClearButtonState);
};

/**
 * DOCU: This function is used to remove one subject row from the table. <br>
 * Tooltips attached to its action buttons are disposed first (preventing <br>
 * orphaned tooltip instances), then the row is deleted. Other subjects are <br>
 * never touched, and the Total Average is recalculated per the existing <br>
 * rules after the row is gone. A success toast confirms the removal once <br>
 * the row is actually gone. <br>
 * Last Updated Date: September 13, 2026 <br>
 * @function deleteSubjectRow
 * @param {object} row - the subject <tr> to remove
 * @author Cesar
 */
const deleteSubjectRow = (row) => {
    if (window.bootstrap && bootstrap.Tooltip) {
        row.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
            const tooltip = bootstrap.Tooltip.getInstance(el);
            if (tooltip) tooltip.dispose();
        });
    }

    row.remove();
    updateAllAverages();
    showSuccessToast('Subject removed successfully.');
};

/**
 * DOCU: This module-level variable holds the action that is waiting for the <br>
 * user to confirm it inside the confirmation modal. It stores the pending <br>
 * subject <tr> and the action type ("reset" or "delete") captured at the <br>
 * moment the destructive button was clicked, and is cleared as soon as the <br>
 * modal is hidden — so clicking Cancel, pressing Esc, or clicking outside <br>
 * always results in no changes. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @var pendingConfirmAction
 * @author Cesar
 */
let pendingConfirmAction = null;

/**
 * DOCU: This function is used to read the current display name of a subject <br>
 * row for use in confirmation messages. Falls back to a generic label when <br>
 * the name field is blank. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function getSubjectDisplayName
 * @param {object} row - the subject <tr> to read the name from
 * @returns {string} the subject's name, or "this subject" when blank
 * @author Cesar
 */
const getSubjectName = (row) => {
    const nameInput = row.querySelector(SUBJECT_NAME_INPUT_SELECTOR);
    const name = nameInput ? nameInput.value.trim() : '';
    return name !== '' ? name : 'this subject';
};

/**
 * DOCU: This function is used to show the shared Bootstrap confirmation <br>
 * modal for a destructive action. It fills in the title, the descriptive <br>
 * body message, and the emphasis of the confirmation button (warning for <br>
 * "Clear All Grades", danger for "Remove Subject"), stores the pending <br>
 * action, and then shows the modal. Only the modal's confirm button <br>
 * (see handleConfirmedAction) ever executes the destructive change. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function showConfirmModal
 * @param {object} options - { type: "reset"|"delete", row: <tr> }
 * @author Cesar
 */
const showConfirmModal = ({ type, row }) => {
    const modalElement = document.querySelector(CONFIRM_MODAL_SELECTOR);
    if (!modalElement) return;

    const subjectName = getSubjectName(row);
    const titleElement = modalElement.querySelector(CONFIRM_MODAL_TITLE_SELECTOR);
    const bodyElement = modalElement.querySelector(CONFIRM_MODAL_BODY_SELECTOR);
    const actionButton = modalElement.querySelector(CONFIRM_MODAL_ACTION_SELECTOR);
    if (!titleElement || !bodyElement || !actionButton) return;

    if (type === 'reset') {
        titleElement.textContent = 'Clear all subject grades?';
        bodyElement.textContent =
            `All Quarter 1–4 grades for "${subjectName}" will be cleared and ` +
            'its Average removed. This cannot be undone with a single click.';
        actionButton.innerHTML =
            '<i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Clear All Grades';
        actionButton.className = 'btn ge-confirm-action px-4 btn-warning';
    } else {
        titleElement.textContent = 'Remove subject?';
        bodyElement.innerHTML =
            `<strong>"${subjectName}"</strong> will be permanently removed from the table. ` +
            '<span class="text-danger fw-semibold">This action cannot be undone.</span>';
        actionButton.innerHTML =
            '<i class="bi bi-trash3 me-1" aria-hidden="true"></i>Remove Subject';
        actionButton.className = 'btn ge-confirm-action px-4 btn-danger';
    }

    // Keep exactly one pending action; re-opening the modal simply replaces it
    pendingConfirmAction = { type, row };

    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();

    // Focus the Cancel button once the modal is visible, so an accidental
    // Enter keypress cancels the action instead of confirming it
    modalElement.addEventListener('shown.bs.modal', () => {
        const cancelButton = modalElement.querySelector('.ge-confirm-cancel');
        if (cancelButton) cancelButton.focus();
    }, { once: true });
};

/**
 * DOCU: This function is called when the user clicks the confirmation button <br>
 * inside the modal. It runs the pending destructive action (clear grades or <br>
 * remove subject), then hides the modal and clears the pending state. If no <br>
 * pending action exists, it does nothing. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function handleConfirmedAction
 * @author Cesar
 */
const handleConfirmedAction = () => {
    if (!pendingConfirmAction) return;

    const { type, row } = pendingConfirmAction;
    pendingConfirmAction = null;

    const modalElement = document.querySelector(CONFIRM_MODAL_SELECTOR);
    const modalInstance = modalElement ? bootstrap.Modal.getInstance(modalElement) : null;
    if (modalInstance) modalInstance.hide();

    if (type === 'reset' && row.isConnected) {
        resetSubjectRow(row);
    } else if (type === 'delete' && row.isConnected) {
        deleteSubjectRow(row);
    }
};

/**
 * DOCU: This function is used to wire up the Reset and Delete actions for <br>
 * every subject row through a single delegated click listener on the <br>
 * subjects <tbody>. Because the listener lives on the <tbody> itself, <br>
 * dynamically added rows automatically get the same two actions without <br>
 * any extra wiring. Neither action executes directly: clicking either <br>
 * button only opens the shared confirmation modal, and the action runs <br>
 * solely after the user clicks its explicit confirm button. <br>
 * Also initializes the Bootstrap tooltips on the action buttons and the <br>
 * confirm-modal listeners (attached once, so no duplicate handlers). <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function initRowActions
 * @author Cesar
 */
const initRowActions = () => {
    const subjectsBody = document.querySelector(SUBJECTS_BODY_SELECTOR);
    if (!subjectsBody) return;

    if (window.bootstrap && bootstrap.Tooltip) {
        subjectsBody.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
            bootstrap.Tooltip.getOrCreateInstance(el);
        });
    }

    subjectsBody.addEventListener('click', (event) => {
        const resetButton = event.target.closest(RESET_BUTTON_SELECTOR);
        if (resetButton) {
            const row = resetButton.closest('tr');
            if (row) showConfirmModal({ type: 'reset', row });
            return;
        }

        const deleteButton = event.target.closest(DELETE_BUTTON_SELECTOR);
        if (deleteButton) {
            const row = deleteButton.closest('tr');
            if (row) showConfirmModal({ type: 'delete', row });
        }
    });

    // Confirmation modal wiring: attached exactly once (the modal is a single,
    // static element in index.html). The destructive action runs ONLY from the
    // explicit confirm button; Cancel, Esc, and the backdrop close button all
    // simply hide the modal with no changes made.
    const modalElement = document.querySelector(CONFIRM_MODAL_SELECTOR);
    if (!modalElement) return;

    const confirmActionButton = modalElement.querySelector(CONFIRM_MODAL_ACTION_SELECTOR);
    if (confirmActionButton) {
        confirmActionButton.addEventListener('click', handleConfirmedAction);
    }

    // Clear the pending action whenever the modal closes by any means
    // (Cancel button, Esc key, backdrop click, or the X close button)
    modalElement.addEventListener('hidden.bs.modal', () => {
        pendingConfirmAction = null;
    });
};

/**
 * DOCU: This function is used to announce a short feedback message through <br>
 * the screen-reader live region (#geLiveRegion). <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function announceMessage
 * @param {string} message - the text to announce
 * @author Cesar
 */
const announceMessage = (message) => {
    const liveRegion = document.querySelector(LIVE_REGION_SELECTOR);
    if (!liveRegion) return;
    liveRegion.textContent = '';
    // Repopulate on the next tick so repeated identical messages re-announce
    window.setTimeout(() => { liveRegion.textContent = message; }, 50);
};

/**
 * DOCU: This function is used to show a brief, self-dismissing success toast
 * notification in the top-right corner of the viewport. The toast reuses the
 * application's design system (success green palette, DM Sans type, soft
 * shadow, rounded corner) and announces its message to assistive technology
 * through the shared #ge live region. Each call creates a single toast;
 * rapid repeated calls produce a vertical stack of distinct toasts that
 * respect one another. The toast slides in from the right, holds for ~3.5s,
 * then fades/slides out and is removed from the DOM. A manual close (X)
 * button is provided for users who want to dismiss early. <br>
 * Last Updated Date: September 13, 2026 <br>
 * @function showSuccessToast
 * @param {string} message - the success message to display
 * @author Cesar
 */
const TOAST_CONTAINER_SELECTOR = '#ge_toast_container';
const TOAST_VISIBLE_DURATION = 3500;
const TOAST_ANIMATION_DURATION = 320;

const showSuccessToast = (message) => {
    if (!message) return;

    const container = document.querySelector(TOAST_CONTAINER_SELECTOR);
    if (!container) return;

    // Surface the feedback for screen readers through the existing live region
    announceMessage(message);

    const toast = document.createElement('div');
    toast.className = 'ge-toast ge-toast-enter';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const icon = document.createElement('span');
    icon.className = 'ge-toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">' +
        '<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>' +
        '</svg>';

    const body = document.createElement('div');
    body.className = 'ge-toast-body';
    body.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'ge-toast-close';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">' +
        '<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>' +
        '</svg>';
    closeButton.addEventListener('click', () => dismissToast(toast));

    toast.appendChild(icon);
    toast.appendChild(body);
    toast.appendChild(closeButton);
    container.appendChild(toast);

    // Force reflow so the enter animation restarts cleanly for repeated toasts
    // with the same message, then swap to the visible state
    void toast.offsetWidth;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.remove('ge-toast-enter');
            toast.classList.add('ge-toast-visible');
        });
    });

    const dismissTimeout = window.setTimeout(() => dismissToast(toast), TOAST_VISIBLE_DURATION);
    toast.__geDismissTimeout = dismissTimeout;
};

const dismissToast = (toast) => {
    if (!toast || toast.__geDismissing) return;
    toast.__geDismissing = true;

    if (toast.__geDismissTimeout) {
        window.clearTimeout(toast.__geDismissTimeout);
        toast.__geDismissTimeout = null;
    }

    toast.classList.remove('ge-toast-visible');
    toast.classList.add('ge-toast-leave');

    const cleanup = () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    };
    window.setTimeout(cleanup, TOAST_ANIMATION_DURATION);
};

/**
 * DOCU: This function is used to validate one subject name input: the name <br>
 * is required (after the user has touched the field) and must be unique <br>
 * among the other subject rows. <br>
 * The invalid state (`.is-invalid-name` + aria-invalid + tooltip title) is <br>
 * shown only on blur or Enter; typing clears the error immediately so it <br>
 * never feels punishing. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function validateSubjectName
 * @param {object} nameInput - the subject name input to validate
 * @param {boolean} showError - true to display the error state, false to only clear it
 * @returns {boolean} true when the name is valid
 * @author Cesar
 */
const validateSubjectName = (nameInput, showError) => {
    const value = nameInput.value.trim();

    // Empty name: only an error once the user has interacted (touched) it
    if (!value) {
        const touched = nameInput.dataset.geTouched === 'true';
        if (touched && showError) {
            nameInput.classList.add('is-invalid-name');
            nameInput.setAttribute('aria-invalid', 'true');
            nameInput.title = NAME_REQUIRED_MESSAGE;
            return false;
        }
        nameInput.classList.remove('is-invalid-name');
        nameInput.removeAttribute('aria-invalid');
        nameInput.title = 'Enter the subject name';
        return !touched;
    }

    // Duplicate name check (case-insensitive) against the other rows
    const isDuplicate = [...document.querySelectorAll(SUBJECTS_BODY_SELECTOR + ' ' + SUBJECT_NAME_INPUT_SELECTOR)]
        .some((other) => other !== nameInput && other.value.trim().toLowerCase() === value.toLowerCase());

    if (isDuplicate && showError) {
        nameInput.classList.add('is-invalid-name');
        nameInput.setAttribute('aria-invalid', 'true');
        nameInput.title = 'This subject name is already in the list';
        announceMessage('This subject name is already in the list. Please choose a different name.');
        return false;
    }

    nameInput.classList.remove('is-invalid-name');
    nameInput.removeAttribute('aria-invalid');
    nameInput.title = 'Enter the subject name';
    return true;
};
/**
 * DOCU: This function is used to sanitize a subject name while typing: it <br>
 * strips leading whitespace (so the value can never start with a space) <br>
 * and collapses repeated spaces into one, while preserving the single <br>
 * spaces between words (e.g. "Computer Science"). <br>
 * The caret position is kept as stable as possible while cleaning. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function sanitizeSubjectNameLive
 * @param {object} nameInput - the subject name input to sanitize
 * @author Cesar
 */
const sanitizeSubjectNameLive = (nameInput) => {
    const original = nameInput.value;
    const cleaned = original.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (cleaned === original) return;

    const caret = nameInput.selectionStart;
    nameInput.value = cleaned;

    // Keep the caret in a sensible place after removing characters
    if (caret !== null) {
        const removedBeforeCaret = Math.max(0, caret - (original.length - cleaned.length));
        const position = cleaned.length === 0 ? 0 : Math.min(Math.max(removedBeforeCaret, 0), cleaned.length);
        nameInput.setSelectionRange(position, position);
    }
};

/**
 * DOCU: This function is used to finalize a subject name when its value is <br>
 * committed (blur or Enter): trailing whitespace is trimmed and the value <br>
 * is written back trimmed, so the stored/displayed name never has <br>
 * leading or trailing spaces. A value of only spaces becomes empty, <br>
 * which validation then treats as "required". <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function commitSubjectNameValue
 * @param {object} nameInput - the subject name input to finalize
 * @author Cesar
 */
const commitSubjectNameValue = (nameInput) => {
    const trimmed = nameInput.value.trim();
    if (trimmed !== nameInput.value) {
        nameInput.value = trimmed;
    }
};

/**
 * DOCU: This function is used to show (or clear) the validation error on a <br>
 * subject name input. Used by both blur validation and the Add Subject <br>
 * guard so every empty/duplicate name error looks and behaves the same. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function showNameError
 * @param {object} nameInput - the subject name input to mark as invalid
 * @param {string} message - the error message (tooltip title)
 * @author Cesar
 */
const showNameError = (nameInput, message) => {
    nameInput.classList.add('is-invalid-name');
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.title = message;
};

/**
 * DOCU: This function is used to check whether an element is fully visible <br>
 * in the current viewport. Used before focusing the Subject Name field so an <br>
 * off-screen field is scrolled into view before it takes the cursor. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function isElementFullyVisible
 * @param {object} element - the element to check
 * @returns {boolean} true when the element is fully inside the viewport
 * @author Cesar
 */
const isElementFullyVisible = (element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    return rect.top >= 0
        && rect.left >= 0
        && rect.bottom <= viewportHeight
        && rect.right <= viewportWidth;
};

/**
 * DOCU: This function is used to check whether one subject row has a valid <br>
 * Subject Name: a value that is not empty after trimming. Whitespace-only <br>
 * names are treated as empty, so grades stay blocked until a real name exists. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function hasValidSubjectName
 * @param {object} row - the subject <tr> to check
 * @returns {boolean} true when the row's Subject Name is valid
 * @author Cesar
 */
const hasValidSubjectName = (row) => {
    const nameInput = row && row.querySelector(SUBJECT_NAME_INPUT_SELECTOR);
    return !!nameInput && nameInput.value.trim() !== '';
};

/**
 * DOCU: This function is used to report the "Subject name is required" error <br>
 * on a row's Subject Name field and move the user into it. The field is <br>
 * focused right away when it is visible; when it is not, it is scrolled <br>
 * into view first and then focused, and a screen-reader announcement <br>
 * explains what is needed (same feedback pattern as the Add Subject guard). <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function focusSubjectNameError
 * @param {object} row - the subject <tr> whose Subject Name should be reported
 * @author Cesar
 */
const focusSubjectNameError = (row) => {
    const nameInput = row && row.querySelector(SUBJECT_NAME_INPUT_SELECTOR);
    if (!nameInput) return;

    // Mark touched so the blur validation keeps the error until a name exists
    nameInput.dataset.geTouched = 'true';
    showNameError(nameInput, NAME_REQUIRED_MESSAGE);
    announceMessage(NAME_REQUIRED_ANNOUNCEMENT);

    if (isElementFullyVisible(nameInput)) {
        nameInput.focus();
        return;
    }

    // Off-screen: scroll the field into view first, then focus it in place
    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameInput.focus({ preventScroll: true });
};

/**
 * DOCU: This function is used to block or unblock one subject row's four <br>
 * grade fields based on its Subject Name. Blocked fields are read-only, <br>
 * removed from the tab order, marked `aria-disabled`, get a not-allowed <br>
 * cursor + muted look, and a tooltip explains why. Once the name becomes <br>
 * valid, the fields are restored to normal editing immediately. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function syncGradeInputsState
 * @param {object} row - the subject <tr> whose grade fields should be synced
 * @author Cesar
 */
const syncGradeInputsState = (row) => {
    if (!row) return;
    const blocked = !hasValidSubjectName(row);

    row.querySelectorAll(GRADE_INPUT_SELECTOR).forEach((gradeInput) => {
        gradeInput.readOnly = blocked;
        gradeInput.tabIndex = blocked ? -1 : 0;
        gradeInput.classList.toggle('ge-input-blocked', blocked);
        if (blocked) {
            gradeInput.setAttribute('aria-disabled', 'true');
            gradeInput.title = GRADE_BLOCKED_TITLE;
        } else {
            gradeInput.removeAttribute('aria-disabled');
            gradeInput.title = 'Enter grade';
        }
    });
};

/**
 * DOCU: This function is used to apply the blocked/unblocked grade state to <br>
 * every subject row. Used at startup so server-rendered rows with an empty <br>
 * Subject Name get their grade fields blocked from the very beginning. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function updateAllGradeInputsState
 * @author Cesar
 */
const updateAllGradeInputsState = () => {
    document.querySelectorAll(SUBJECT_ROWS_SELECTOR).forEach(syncGradeInputsState);
};

/**
 * DOCU: This function is used to prevent any grade editing while a row's <br>
 * Subject Name is empty. Clicks, keyboard focus, and typing on a blocked <br>
 * grade field are intercepted: the attempt is cancelled, the required-name <br>
 * error is shown on the Subject Name field, and the user is scrolled and <br>
 * focused into it. Works for new and existing rows through event delegation. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function initSubjectNameRequiredGuard
 * @author Cesar
 */
const initSubjectNameRequiredGuard = () => {
    const subjectsBody = document.querySelector(SUBJECTS_BODY_SELECTOR);
    if (!subjectsBody) return;

    // Shared redirect: an attempted interaction with a blocked grade field
    // reports the required Subject Name and moves the user into it
    const redirectBlockedGradeAttempt = (event) => {
        if (!event.target.matches(GRADE_INPUT_SELECTOR)) return;

        const row = event.target.closest(SUBJECT_ROW_SELECTOR);
        if (row && hasValidSubjectName(row)) return;

        event.preventDefault();
        focusSubjectNameError(row);
    };

    // Mouse/touch: preventDefault stops the grade field from ever taking focus
    subjectsBody.addEventListener('pointerdown', redirectBlockedGradeAttempt);

    // Fallback for programmatic / edge-case focus: hand focus to the name field
    subjectsBody.addEventListener('focusin', redirectBlockedGradeAttempt);

    // Keyboard fallback: blocked fields cannot be typed into (read-only), but
    // any stray key press is cancelled and reported the same way
    subjectsBody.addEventListener('keydown', (event) => {
        if (event.target.matches(GRADE_INPUT_SELECTOR)) redirectBlockedGradeAttempt(event);
    });
};

/**
 * DOCU: This function is used to validate every existing subject name before <br>
 * a new subject row can be added. <br>
 * Any empty Subject Name is marked as invalid; valid names get their error <br>
 * state cleared immediately. <br>
 * Last Updated Date: September 12, 2026 <br>
 * @function guardExistingSubjectNames
 * @param {object} subjectsBody - the subjects <tbody> to check
 * @returns {object|null} the first invalid name input, or null when all are valid
 * @author Cesar
 */
const guardExistingSubjectNames = (subjectsBody) => {
    const nameInputs = [...subjectsBody.querySelectorAll(SUBJECT_NAME_INPUT_SELECTOR)];
    let firstInvalid = null;

    nameInputs.forEach((nameInput) => {
        if (!nameInput.value.trim()) {
            showNameError(nameInput, NAME_REQUIRED_MESSAGE);
            if (!firstInvalid) firstInvalid = nameInput;
        } else {
            // Valid name: store it trimmed and clear any lingering error
            commitSubjectNameValue(nameInput);
            nameInput.classList.remove('is-invalid-name');
            nameInput.removeAttribute('aria-invalid');
            nameInput.title = 'Enter the subject name';
        }
    });

    return firstInvalid;
};

const initAddSubjectControl = () => {
    const addButton = document.querySelector(ADD_BUTTON_SELECTOR);
    const subjectsBody = document.querySelector(SUBJECTS_BODY_SELECTOR);
    if (!addButton || !subjectsBody) return;

    addButton.addEventListener('click', () => {
        // Guard: every existing subject must have a name before another
        // row can be added (works no matter how many subjects exist)
        const invalidInput = guardExistingSubjectNames(subjectsBody);
        if (invalidInput) {
            // Scroll the first invalid field into view, then focus it so
            // the user can immediately type the missing subject name
            invalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            invalidInput.focus({ preventScroll: true });
            announceMessage('Please enter a subject name for every existing subject before adding another one.');
            return; // new subject is NOT added until the name is provided
        }

        const lastRow = subjectsBody.querySelector('tr:last-of-type');
        if (!lastRow) return;

        const newRow = createSubjectRow();
        lastRow.after(newRow); // control <tbody> stays below the new last row

        updateAllAverages(); // show "—"/Incomplete for the blank row

        // Visual feedback: brief highlight flash on the freshly added row
        newRow.classList.add('ge-row-new');
        newRow.addEventListener('animationend', () => newRow.classList.remove('ge-row-new'), { once: true });

        const nameInput = newRow.querySelector(SUBJECT_NAME_INPUT_SELECTOR);
        nameInput.focus();

        // Sync the Clear button state so its wrapper span gets the
        // ge-no-grades class and shows the disabled (not-allowed) cursor
        updateClearButtonState(newRow);

        // Initialize the Bootstrap tooltips on the new row's action buttons
        if (window.bootstrap && bootstrap.Tooltip) {
            newRow.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
                bootstrap.Tooltip.getOrCreateInstance(el);
            });
        }

        announceMessage('New subject row added. Enter the subject name and its quarterly grades.');
    });

    // Mark name inputs as touched on first focus so empty-on-blur errors
    // only fire for fields the user actually interacted with
    subjectsBody.addEventListener('focusin', (event) => {
        if (event.target.matches(SUBJECT_NAME_INPUT_SELECTOR)) {
            event.target.dataset.geTouched = 'true';
            // Store the original value to detect actual changes before showing toast
            event.target.dataset.originalValue = event.target.value.trim();
        }
    });

    // Validate on blur: trim the committed value first (a spaces-only
    // name becomes empty and is reported as required), then run the
    // required + duplicate checks with inline feedback
    subjectsBody.addEventListener('focusout', (event) => {
        if (event.target.matches(SUBJECT_NAME_INPUT_SELECTOR)) {
            const nameInput = event.target;
            const originalValue = nameInput.dataset.originalValue || '';
            commitSubjectNameValue(nameInput);
            const newValue = nameInput.value.trim();
            const isValid = validateSubjectName(nameInput, true);
            // Re-sync grade access: a name committed to whitespace-only/empty
            // blocks its row's grade fields again
            const row = nameInput.closest(SUBJECT_ROW_SELECTOR);
            if (row) syncGradeInputsState(row);
            // Show toast only when the subject name actually changed (valid, non-empty, and different from original)
            if (isValid && newValue && newValue !== originalValue) {
                showSuccessToast(`Subject name updated to "${newValue}".`);
            }
        }
    });

    // Sanitize live while typing (no leading spaces, single spaces between
    // words) and clear the error state as soon as the value becomes valid
    subjectsBody.addEventListener('input', (event) => {
        if (event.target.matches(SUBJECT_NAME_INPUT_SELECTOR)) {
            sanitizeSubjectNameLive(event.target);
            validateSubjectName(event.target, false);
            // Immediately unblock (or re-block) the row's grade fields as the
            // name becomes valid/empty — whitespace-only counts as empty
            const row = event.target.closest(SUBJECT_ROW_SELECTOR);
            if (row) syncGradeInputsState(row);
        }
    });

    // Enter on a valid name jumps straight to the first quarter grade;
    // Enter on an invalid name shows the error and stays put
    subjectsBody.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.matches(SUBJECT_NAME_INPUT_SELECTOR)) {
            event.preventDefault();
            const nameInput = event.target;
            nameInput.dataset.geTouched = 'true';
            const originalValue = nameInput.dataset.originalValue || '';
            commitSubjectNameValue(nameInput);
            if (validateSubjectName(nameInput, true)) {
                const newValue = nameInput.value.trim();
                // Show toast only when the subject name actually changed (non-empty and different from original)
                if (newValue && newValue !== originalValue) {
                    showSuccessToast(`Subject name updated to "${newValue}".`);
                }
                const row = nameInput.closest(SUBJECT_ROW_SELECTOR);
                const firstGrade = row.querySelector(GRADE_INPUT_SELECTOR);
                if (firstGrade) firstGrade.focus();
            }
        }
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
/**
 * DOCU: Updates the School Year badge in the card header to always
 * reflect the current year and the next year (e.g., "S.Y. 2026–2027").
 */
const updateSchoolYearBadge = () => {
    const schoolYearBadge = document.getElementById('ge_school_year');
    if (!schoolYearBadge) return;

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    schoolYearBadge.textContent = `S.Y. ${currentYear}-${nextYear}`;
};

const initGradeEvaluator = () => {
    // Set default/fallback value for Total Average Remarks before any calculations
    setDefaultTotalAverageRemarks();

    // Dynamically set the School Year badge to current year and next year
    updateSchoolYearBadge();

    updateAllAverages();
    updateAllClearButtons();
    initAddSubjectControl();
    initRowActions();

    // Subject Name must come first: block grade fields of every row whose
    // name is empty (server-rendered rows included) and intercept any grade
    // attempts with a clear required-name error + focus redirect
    initSubjectNameRequiredGuard();
    updateAllGradeInputsState();

    // Event delegation: one listener handles all quarter inputs,
    // including those in dynamically added rows. While typing, the value
    // is sanitized (invalid characters stripped) and validated live with
    // Bootstrap styles. Total Average and Total Average Remarks are NOT
    // recalculated during typing to keep the display stable and avoid
    // distracting updates; they update only when the field loses focus.
    document.addEventListener('input', (event) => {
        if (event.target.matches(GRADE_INPUT_SELECTOR)) {
            sanitizeGradeInput(event.target);
            validateGradeInput(event.target);

            // Live enable/disable of the Clear button for the edited row
            const subjectRow = event.target.closest(SUBJECT_ROW_SELECTOR);
            if (subjectRow) updateClearButtonState(subjectRow);
        }
    });

    // On blur (focus leaves the field), show final validation feedback
    // and recalculate the Total Average and Total Average Remarks. This
    // ensures the totals stay stable while the user types and update only
    // once they finish editing a grade. When moving directly from one
    // grade field to another, this fires before the next field is focused,
    // so the previous field's changes are processed correctly.
    document.addEventListener('blur', (event) => {
        if (event.target.matches && event.target.matches(GRADE_INPUT_SELECTOR)) {
            validateGradeInput(event.target);
            updateAllAverages();
        }
    }, true);
};

document.addEventListener('DOMContentLoaded', initGradeEvaluator);
