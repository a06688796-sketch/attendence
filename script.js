/* ============================================================
   SCHOOL ATTENDANCE MANAGEMENT SYSTEM - SCRIPT
   Pure Vanilla JavaScript ES6 - No frameworks or libraries
   ============================================================ */

/* ==================== STORAGE KEYS ==================== */
const STORAGE_KEYS = {
    STUDENTS: 'sms_students',
    ATTENDANCE: 'sms_attendance',
    DATES: 'sms_dates',
    WORKING_DAYS: 'sms_workingDays'
};

/* ==================== DEFAULT STUDENTS ==================== */
const DEFAULT_STUDENTS = [
    { id: 1, name: 'Abdullah Usman' },
    { id: 2, name: 'Ali Shahzad' },
    { id: 3, name: 'Ayaan Mehmood' },
    { id: 4, name: 'Haroon Junaid' },
    { id: 5, name: 'Mazhar Hussain' },
    { id: 6, name: 'Muhammad Ali Manzoor' },
    { id: 7, name: 'Muhammad Asif Bhatti' },
    { id: 8, name: 'Muhammad Iqbal' },
    { id: 9, name: 'Muhammad Saqlain Farakh' },
    { id: 10, name: 'Muhammad Umer Shabir' },
    { id: 11, name: 'Ch Hassan' },
    { id: 12, name: 'Ehsan Akram' }
];

const TOTAL_WORKING_DAYS_DEFAULT = 48;

/* ==================== APPLICATION STATE ==================== */
let state = {
    students: [],
    attendance: {},      // { studentId: { "2026-07-16": "P", ... } }
    dates: [],           // ["2026-07-16", ...]
    workingDays: TOTAL_WORKING_DAYS_DEFAULT
};

/* ==================== DOM REFERENCES ==================== */
const dom = {
    // Dashboard
    totalStudents: document.getElementById('totalStudents'),
    presentToday: document.getElementById('presentToday'),
    absentToday: document.getElementById('absentToday'),
    totalDays: document.getElementById('totalDays'),
    avgAttendance: document.getElementById('avgAttendance'),
    headerDate: document.getElementById('headerDate'),

    // Controls
    startAttendanceBtn: document.getElementById('startAttendanceBtn'),
    addStudentBtn: document.getElementById('addStudentBtn'),
    searchInput: document.getElementById('searchInput'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),

    // Table
    tableWrapper: document.getElementById('tableWrapper'),
    attendanceTable: document.getElementById('attendanceTable'),
    tableHead: document.querySelector('#attendanceTable thead tr'),
    tableBody: document.getElementById('tableBody'),
    tableEmpty: document.getElementById('tableEmpty'),

    // Modal
    studentModal: document.getElementById('studentModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalClose: document.getElementById('modalClose'),
    modalCancel: document.getElementById('modalCancel'),
    modalSave: document.getElementById('modalSave'),
    editStudentId: document.getElementById('editStudentId'),
    studentName: document.getElementById('studentName'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // Theme toggle
    themeToggle: document.getElementById('themeToggle'),
    iconMoon: document.querySelector('.icon-moon'),
    iconSun: document.querySelector('.icon-sun')
};

/* ==================== UTILITY FUNCTIONS ==================== */

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Format date string to a readable format
 */
function formatDateDisplay(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Generate unique ID for students
 */
function generateId() {
    if (state.students.length === 0) return 1;
    return Math.max(...state.students.map(s => s.id)) + 1;
}

/**
 * Get roll number from array index
 */
function getRollNo(index) {
    return index + 1;
}

/* ==================== LOCAL STORAGE ==================== */

/**
 * Save entire state to localStorage
 */
function saveState() {
    try {
        state.dates = [...new Set(state.dates)];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(state.students));
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(state.attendance));
        localStorage.setItem(STORAGE_KEYS.DATES, JSON.stringify(state.dates));
        localStorage.setItem(STORAGE_KEYS.WORKING_DAYS, JSON.stringify(state.workingDays));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

/**
 * Load state from localStorage, or initialize with defaults
 */
function loadState() {
    try {
        const students = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        const attendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
        const dates = localStorage.getItem(STORAGE_KEYS.DATES);
        const workingDays = localStorage.getItem(STORAGE_KEYS.WORKING_DAYS);

        if (students) {
            state.students = JSON.parse(students);
            state.attendance = JSON.parse(attendance || '{}');
            state.dates = [...new Set(JSON.parse(dates || '[]'))];
            state.workingDays = JSON.parse(workingDays || String(TOTAL_WORKING_DAYS_DEFAULT));
        } else {
            // First load: initialize with default students
            initializeDefaults();
        }
    } catch (e) {
        console.error('Failed to load state:', e);
        initializeDefaults();
    }
}

/**
 * Initialize with default data
 */
function initializeDefaults() {
    state.students = DEFAULT_STUDENTS.map(s => ({ ...s }));
    state.attendance = {};
    state.dates = [];
    state.workingDays = TOTAL_WORKING_DAYS_DEFAULT;

    // Initialize attendance objects for each student
    state.students.forEach(s => {
        state.attendance[s.id] = {};
    });

    saveState();
}

/* ==================== HEADER DATE ==================== */

function updateHeaderDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dom.headerDate.textContent = now.toLocaleDateString('en-US', options);
}

/* ==================== DASHBOARD ==================== */

function updateDashboard() {
    // Total students
    dom.totalStudents.textContent = state.students.length;

    // Total working days
    dom.totalDays.textContent = state.workingDays;

    // Present/Absent today
    const todayStr = getTodayStr();
    let presentCount = 0;
    let absentCount = 0;

    state.students.forEach(s => {
        const record = state.attendance[s.id];
        if (record && record[todayStr] === 'P') presentCount++;
        else if (record && record[todayStr] === 'A') absentCount++;
    });

    dom.presentToday.textContent = presentCount;
    dom.absentToday.textContent = absentCount;

    // Average attendance %
    const avg = calculateAverageAttendance();
    dom.avgAttendance.textContent = avg + '%';

    // Color the average
    dom.avgAttendance.parentElement.querySelector('.card-value').style.color = getPercentColor(avg);
}

/**
 * Calculate average attendance across all students
 */
function calculateAverageAttendance() {
    if (state.students.length === 0 || state.workingDays === 0) return '0.00';

    let totalPresent = 0;
    state.students.forEach(s => {
        const record = state.attendance[s.id] || {};
        totalPresent += countPresent(record);
    });

    const avg = (totalPresent / (state.students.length * state.workingDays)) * 100;
    return avg.toFixed(2);
}

/**
 * Count present days for a student's attendance record
 */
function countPresent(record) {
    let count = 0;
    for (const key in record) {
        if (record[key] === 'P') count++;
    }
    return count;
}

/**
 * Get color class based on percentage value
 */
function getPercentColor(percent) {
    const val = parseFloat(percent);
    if (val >= 90) return '#16A34A';
    if (val >= 75) return '#EA580C';
    return '#DC2626';
}

/**
 * Get CSS class for percentage badge
 */
function getPercentClass(percent) {
    const val = parseFloat(percent);
    if (val >= 90) return 'percent-green';
    if (val >= 75) return 'percent-orange';
    return 'percent-red';
}

/* ==================== TABLE RENDERING ==================== */

function renderTable() {
    renderTableHeader();
    renderTableBody();
    updateDashboard();
    toggleEmptyState();
}

/**
 * Render table header with date columns
 */
function renderTableHeader() {
    // Clear existing date columns (keep roll, name, %, actions)
    const headerRow = dom.tableHead;
    headerRow.innerHTML = '';

    // Roll No
    const thRoll = document.createElement('th');
    thRoll.className = 'col-roll sticky-col';
    thRoll.textContent = 'Roll No';
    headerRow.appendChild(thRoll);

    // Student Name
    const thName = document.createElement('th');
    thName.className = 'col-name sticky-col-name';
    thName.textContent = 'Student Name';
    headerRow.appendChild(thName);

    // Date columns
    state.dates.forEach(dateStr => {
        const th = document.createElement('th');
        th.className = 'col-date';
        th.innerHTML = `<div class="date-header-cell"><button class="col-delete-btn" onclick="deleteDate('${dateStr}')" title="Delete column">&times;</button></div>`;
        headerRow.appendChild(th);
    });

    // Attendance %
    const thPercent = document.createElement('th');
    thPercent.className = 'col-percent';
    thPercent.textContent = 'Attendance %';
    headerRow.appendChild(thPercent);

    // Actions
    const thActions = document.createElement('th');
    thActions.className = 'col-actions';
    thActions.textContent = 'Actions';
    headerRow.appendChild(thActions);
}

/**
 * Render table body with student rows
 */
function renderTableBody() {
    const searchTerm = dom.searchInput.value.toLowerCase().trim();
    dom.tableBody.innerHTML = '';

    state.students.forEach((student, index) => {
        const rollNo = getRollNo(index);

        // Apply search filter
        if (searchTerm) {
            const matchName = student.name.toLowerCase().includes(searchTerm);
            const matchRoll = String(rollNo).includes(searchTerm);
            if (!matchName && !matchRoll) return;
        }

        const tr = document.createElement('tr');
        tr.dataset.studentId = student.id;

        // Roll No
        const tdRoll = document.createElement('td');
        tdRoll.className = 'sticky-cell';
        tdRoll.innerHTML = `<span class="roll-no">${rollNo}</span>`;
        tr.appendChild(tdRoll);

        // Student Name
        const tdName = document.createElement('td');
        tdName.className = 'sticky-cell-name';
        tdName.textContent = student.name;
        tr.appendChild(tdName);

        // Attendance cells for each date
        state.dates.forEach(dateStr => {
            const td = document.createElement('td');
            const cell = createAttendanceCell(student.id, dateStr);
            td.appendChild(cell);
            tr.appendChild(td);
        });

        // Percentage
        const tdPercent = document.createElement('td');
        const percent = calculateStudentPercent(student.id);
        const percentBadge = document.createElement('span');
        percentBadge.className = `percent-cell ${getPercentClass(percent)}`;
        percentBadge.textContent = percent + '%';
        tdPercent.appendChild(percentBadge);
        tr.appendChild(tdPercent);

        // Actions
        const tdActions = document.createElement('td');
        tdActions.innerHTML = `
            <div class="actions-cell">
                <button class="btn-icon" onclick="editStudent(${student.id})" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="deleteStudent(${student.id})" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
        tr.appendChild(tdActions);

        dom.tableBody.appendChild(tr);
    });
}

/**
 * Create an attendance cell element
 */
function createAttendanceCell(studentId, dateStr) {
    const cell = document.createElement('div');
    const record = state.attendance[studentId] || {};
    const status = record[dateStr] || '';

    cell.className = 'attendance-cell';
    cell.dataset.studentId = studentId;
    cell.dataset.date = dateStr;

    if (status === 'P') {
        cell.classList.add('cell-present');
        cell.textContent = 'P';
    } else if (status === 'A') {
        cell.classList.add('cell-absent');
        cell.textContent = 'A';
    } else {
        cell.classList.add('cell-empty');
        cell.textContent = '—';
    }

    cell.addEventListener('click', handleAttendanceClick);
    return cell;
}

/**
 * Handle click on attendance cell to toggle status
 */
function handleAttendanceClick(e) {
    const cell = e.currentTarget;
    const studentId = parseInt(cell.dataset.studentId);
    const dateStr = cell.dataset.date;

    // Ensure attendance record exists
    if (!state.attendance[studentId]) {
        state.attendance[studentId] = {};
    }

    const currentStatus = state.attendance[studentId][dateStr] || '';

    // Cycle: Empty -> P -> A -> Empty
    let newStatus;
    if (currentStatus === '') {
        newStatus = 'P';
    } else if (currentStatus === 'P') {
        newStatus = 'A';
    } else {
        newStatus = '';
    }

    // Update state
    if (newStatus === '') {
        delete state.attendance[studentId][dateStr];
    } else {
        state.attendance[studentId][dateStr] = newStatus;
    }

    // Update cell appearance
    cell.className = 'attendance-cell';
    if (newStatus === 'P') {
        cell.classList.add('cell-present');
        cell.textContent = 'P';
    } else if (newStatus === 'A') {
        cell.classList.add('cell-absent');
        cell.textContent = 'A';
    } else {
        cell.classList.add('cell-empty');
        cell.textContent = '—';
    }

    // Update percentage in the same row
    const row = cell.closest('tr');
    if (row) {
        const percentCell = row.querySelector('.percent-cell');
        if (percentCell) {
            const percent = calculateStudentPercent(studentId);
            percentCell.textContent = percent + '%';
            percentCell.className = `percent-cell ${getPercentClass(percent)}`;
        }
    }

    // Update dashboard and save
    updateDashboard();
    saveState();
}

/**
 * Calculate attendance percentage for a single student
 */
function calculateStudentPercent(studentId) {
    if (state.workingDays === 0) return '0.00';
    const record = state.attendance[studentId] || {};
    const present = countPresent(record);
    const percent = (present / state.workingDays) * 100;
    return percent.toFixed(2);
}

/**
 * Toggle empty state message
 */
function toggleEmptyState() {
    if (state.students.length === 0) {
        dom.tableEmpty.classList.add('visible');
        dom.tableWrapper.style.display = 'none';
    } else {
        dom.tableEmpty.classList.remove('visible');
        dom.tableWrapper.style.display = '';
    }
}

/* ==================== START ATTENDANCE ==================== */

function startAttendance() {
    let nextYear, nextMonth, nextDay;

    if (state.dates.length > 0) {
        const last = state.dates[state.dates.length - 1].split('-').map(Number);
        nextYear = last[0];
        nextMonth = last[1];
        nextDay = last[2] + 1;

        const daysInMonth = new Date(nextYear, nextMonth, 0).getDate();
        if (nextDay > daysInMonth) {
            nextDay = 1;
            nextMonth++;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear++;
            }
        }
    } else {
        const now = new Date();
        nextYear = now.getFullYear();
        nextMonth = now.getMonth() + 1;
        nextDay = now.getDate() + 1;

        const daysInMonth = new Date(nextYear, nextMonth, 0).getDate();
        if (nextDay > daysInMonth) {
            nextDay = 1;
            nextMonth++;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextYear++;
            }
        }
    }

    const nextDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;

    state.dates.push(nextDateStr);
    state.workingDays++;

    state.students.forEach(s => {
        if (!state.attendance[s.id]) {
            state.attendance[s.id] = {};
        }
    });

    saveState();
    renderTable();
    showToast(`Attendance column added: ${formatDateDisplay(nextDateStr)}`);

    setTimeout(() => {
        dom.tableWrapper.scrollLeft = dom.tableWrapper.scrollWidth;
    }, 100);
}

function deleteDate(dateStr) {
    if (!confirm(`Delete attendance column for ${formatDateDisplay(dateStr)}?`)) return;

    state.dates = state.dates.filter(d => d !== dateStr);
    state.workingDays--;

    state.students.forEach(s => {
        if (state.attendance[s.id]) {
            delete state.attendance[s.id][dateStr];
        }
    });

    saveState();
    renderTable();
    showToast('Column deleted');
}

/* ==================== STUDENT MANAGEMENT ==================== */

function openAddStudentModal() {
    dom.modalTitle.textContent = 'Add Student';
    dom.modalSave.textContent = 'Add Student';
    dom.editStudentId.value = '';
    dom.studentName.value = '';
    dom.studentModal.classList.add('active');
    dom.studentName.focus();
}

function openEditStudentModal(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    dom.modalTitle.textContent = 'Edit Student';
    dom.modalSave.textContent = 'Save Changes';
    dom.editStudentId.value = studentId;
    dom.studentName.value = student.name;
    dom.studentModal.classList.add('active');
    dom.studentName.focus();
}

function closeModal() {
    dom.studentModal.classList.remove('active');
}

function saveStudent() {
    const name = dom.studentName.value.trim();
    if (!name) {
        showToast('Please enter a student name', 'error');
        dom.studentName.focus();
        return;
    }

    const editId = dom.editStudentId.value;

    if (editId) {
        // Edit existing student
        const student = state.students.find(s => s.id === parseInt(editId));
        if (student) {
            student.name = name;
            showToast('Student updated successfully');
        }
    } else {
        // Add new student
        const newId = generateId();
        state.students.push({ id: newId, name });
        state.attendance[newId] = {};
        showToast('Student added successfully');
    }

    closeModal();
    saveState();
    renderTable();
}

function editStudent(studentId) {
    openEditStudentModal(studentId);
}

function deleteStudent(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    if (!confirm(`Delete "${student.name}"? This cannot be undone.`)) return;

    state.students = state.students.filter(s => s.id !== studentId);
    delete state.attendance[studentId];

    saveState();
    renderTable();
    showToast('Student deleted');
}

/* ==================== SEARCH ==================== */

function handleSearch() {
    renderTableBody();
}

/* ==================== COLUMN NAVIGATION ==================== */

function scrollPrev() {
    dom.tableWrapper.scrollBy({ left: -200, behavior: 'smooth' });
}

function scrollNext() {
    dom.tableWrapper.scrollBy({ left: 200, behavior: 'smooth' });
}

/* ==================== TOAST NOTIFICATIONS ==================== */

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ==================== DARK MODE ==================== */

function loadTheme() {
    const dark = localStorage.getItem('sms_darkMode') === 'true';
    if (dark) {
        document.body.classList.add('dark');
        dom.iconMoon.style.display = 'none';
        dom.iconSun.style.display = '';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('sms_darkMode', isDark);
    dom.iconMoon.style.display = isDark ? 'none' : '';
    dom.iconSun.style.display = isDark ? '' : 'none';
}

/* ==================== EVENT LISTENERS ==================== */

function initEventListeners() {
    // Start Attendance
    dom.startAttendanceBtn.addEventListener('click', startAttendance);

    // Add Student
    dom.addStudentBtn.addEventListener('click', openAddStudentModal);

    // Search
    dom.searchInput.addEventListener('input', handleSearch);

    // Navigation
    dom.prevBtn.addEventListener('click', scrollPrev);
    dom.nextBtn.addEventListener('click', scrollNext);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Don't trigger when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollPrev();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollNext();
        }
    });

    // Modal
    dom.modalClose.addEventListener('click', closeModal);
    dom.modalCancel.addEventListener('click', closeModal);
    dom.modalSave.addEventListener('click', saveStudent);

    // Close modal on overlay click
    dom.studentModal.addEventListener('click', (e) => {
        if (e.target === dom.studentModal) closeModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dom.studentModal.classList.contains('active')) {
            closeModal();
        }
    });

    // Save student on Enter in modal
    dom.studentName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveStudent();
    });

    // Theme toggle
    dom.themeToggle.addEventListener('click', toggleTheme);
}

/* ==================== INITIALIZATION ==================== */

function init() {
    // Load data from localStorage
    loadState();

    // Load theme preference
    loadTheme();

    // Update header date
    updateHeaderDate();

    // Render the attendance table
    renderTable();

    // Attach event listeners
    initEventListeners();

    // Update header date every minute
    setInterval(updateHeaderDate, 60000);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
