const STORAGE_KEYS = {
  users: 'carecall_users',
  groups: 'carecall_groups',
  students: 'carecall_students',
  callLogs: 'carecall_call_logs'
};

const DEFAULT_ADMIN = {
  id: 'admin',
  fullName: 'Administrator',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  assignedGroups: []
};

const ARBIND_ADMIN = {
  id: 'admin-arbind',
  fullName: 'Arbind',
  username: 'arbind',
  password: 'arbind',
  role: 'admin',
  assignedGroups: []
};

const seedData = {
  users: [DEFAULT_ADMIN],
  groups: [
    { id: 'g1', className: 'Class 5', sectionName: 'A', groupName: 'Group Red' },
    { id: 'g2', className: 'Class 5', sectionName: 'A', groupName: 'Group Blue' },
    { id: 'g3', className: 'Class 6', sectionName: 'B', groupName: 'Group Green' }
  ],
  students: [
    { id: 's1', sno: '1', studentName: 'Aisha Khan', fatherName: 'Azhar Khan', fatherMobile: '+919876543210', motherName: 'Razia Khan', motherMobile: '+919876543211', guardianName: '', guardianMobile: '', email: 'aisha@example.com', cityOfResidence: 'Bengaluru', className: 'Class 5', sectionName: 'A', groupName: 'Group Red', groupId: 'g1' },
    { id: 's2', sno: '2', studentName: 'David Martin', fatherName: 'Robert Martin', fatherMobile: '+919876543212', motherName: 'Nina Martin', motherMobile: '+919876543213', guardianName: '', guardianMobile: '', email: 'david@example.com', cityOfResidence: 'Chennai', className: 'Class 5', sectionName: 'A', groupName: 'Group Red', groupId: 'g1' },
    { id: 's3', sno: '3', studentName: 'Priya Nair', fatherName: 'Sanjay Nair', fatherMobile: '+919876543214', motherName: 'Meera Nair', motherMobile: '', guardianName: 'Anita Nair', guardianMobile: '+919876543215', email: 'priya@example.com', cityOfResidence: 'Kochi', className: 'Class 5', sectionName: 'A', groupName: 'Group Blue', groupId: 'g2' }
  ],
  callLogs: []
};

const readStorage = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
};

const writeStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const getUsers = () => readStorage(STORAGE_KEYS.users, seedData.users);
const getGroups = () => readStorage(STORAGE_KEYS.groups, seedData.groups);
const getStudents = () => readStorage(STORAGE_KEYS.students, seedData.students);
const getCallLogs = () => readStorage(STORAGE_KEYS.callLogs, seedData.callLogs);

const getTeacherOptions = () => getUsers().filter(user => user.role === 'teacher');

const saveUsers = users => writeStorage(STORAGE_KEYS.users, users);
const saveGroups = groups => writeStorage(STORAGE_KEYS.groups, groups);
const saveStudents = students => writeStorage(STORAGE_KEYS.students, students);
const saveCallLogs = logs => writeStorage(STORAGE_KEYS.callLogs, logs);

const currentUser = () => {
  const username = sessionStorage.getItem('carecall_current_user');
  const users = getUsers();
  return users.find(user => user.username === username) || null;
};

const showToast = message => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
};

const csvEscape = value => `"${String(value || '').replace(/"/g, '""')}"`;

const downloadCsv = (filename, rows) => {
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const normalizeHeader = header => String(header || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const parseCsvRows = text => {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some(cell => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
  }

  return rows;
};

const generateGroupId = () => `g${Date.now()}${Math.random().toString(16).slice(2, 7)}`;
const generateStudentId = () => `s${Date.now()}${Math.random().toString(16).slice(2, 7)}`;

const ensureStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    saveUsers([...seedData.users, ARBIND_ADMIN]);
  } else {
    const users = getUsers();
    if (!users.some(user => user.username === ARBIND_ADMIN.username)) {
      saveUsers([...users, ARBIND_ADMIN]);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.groups)) {
    saveGroups(seedData.groups);
  }
  if (!localStorage.getItem(STORAGE_KEYS.students)) {
    saveStudents(seedData.students);
  }
  if (!localStorage.getItem(STORAGE_KEYS.callLogs)) {
    saveCallLogs(seedData.callLogs);
  }
};

function renderNav() {
  const user = currentUser();
  const nav = document.getElementById('nav');
  if (!nav) return;

  const items = user && user.role === 'teacher'
    ? [
        { key: 'teacher-students', label: 'Assigned students' }
      ]
    : [
        { key: 'admin-overview', label: 'Overview' },
        { key: 'admin-groups', label: 'Class & sections' },
        { key: 'admin-teachers', label: 'Teachers' },
        { key: 'admin-import', label: 'CSV import' },
        { key: 'admin-calls', label: 'Call logs' }
      ];

  nav.innerHTML = items.map((item, index) => `<button type="button" class="nav-button ${index === 0 ? 'active' : ''}" data-nav="${item.key}">${item.label}</button>`).join('');

  nav.querySelectorAll('[data-nav]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.nav-button').forEach(btn => btn.classList.toggle('active', btn === button));
      if (user && user.role === 'teacher') {
        document.getElementById('teacher-dashboard').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
      } else {
        const targets = {
          'admin-overview': 'admin-dashboard',
          'admin-groups': 'admin-dashboard',
          'admin-teachers': 'admin-dashboard',
          'admin-import': 'admin-dashboard',
          'admin-calls': 'admin-dashboard'
        };
        document.getElementById('admin-dashboard').classList.remove('hidden');
        document.getElementById('teacher-dashboard').classList.add('hidden');
        const target = targets[button.dataset.nav] || 'admin-dashboard';
        if (target === 'admin-dashboard') {
          document.getElementById('page-title').textContent = button.textContent;
        }
      }
    });
  });
}

function hydrateTeacherGroupSelect() {
  const select = document.getElementById('teacher-group-select');
  if (!select) return;

  const groups = getGroups();
  select.innerHTML = groups.map(group => `<option value="${group.id}">${group.className} / ${group.sectionName} / ${group.groupName}</option>`).join('');
}

function hydrateManualStudentForm() {
  const manualClass = document.getElementById('manual-class');
  const manualSection = document.getElementById('manual-section');
  const manualGroup = document.getElementById('manual-group');
  const manualTeacher = document.getElementById('manual-teacher');
  if (!manualClass || !manualSection || !manualGroup || !manualTeacher) return;

  const groups = getGroups();
  const teachers = getTeacherOptions();
  const classes = [...new Set(groups.map(group => group.className))];
  const currentClass = manualClass.value || '';
  const currentSection = manualSection.value || '';
  const currentGroup = manualGroup.value || '';

  manualTeacher.innerHTML = '<option value="">Select teacher</option>' + teachers.map(teacher => `<option value="${teacher.id}">${teacher.fullName}</option>`).join('');

  manualClass.innerHTML = '<option value="">Select class</option>' + classes.map(className => `<option value="${className}">${className}</option>`).join('');
  if (classes.includes(currentClass)) {
    manualClass.value = currentClass;
  }

  const selectedClass = manualClass.value || classes[0] || '';
  const sections = selectedClass ? [...new Set(groups.filter(group => group.className === selectedClass).map(group => group.sectionName))] : [];
  manualSection.innerHTML = '<option value="">Select section</option>' + sections.map(section => `<option value="${section}">${section}</option>`).join('');
  if (sections.includes(currentSection) && selectedClass === currentClass) {
    manualSection.value = currentSection;
  }

  const selectedSection = manualSection.value || sections[0] || '';
  const groupOptions = selectedClass && selectedSection ? groups.filter(group => group.className === selectedClass && group.sectionName === selectedSection) : [];
  manualGroup.innerHTML = '<option value="">Select group</option>' + groupOptions.map(group => `<option value="${group.id}">${group.groupName}</option>`).join('');
  if (groupOptions.some(group => group.id === currentGroup)) {
    manualGroup.value = currentGroup;
  }

  manualClass.onchange = () => {
    manualSection.value = '';
    manualGroup.value = '';
    hydrateManualStudentForm();
  };
  manualSection.onchange = () => {
    manualGroup.value = '';
    hydrateManualStudentForm();
  };
}

function hydrateImportSelects() {
  const importClass = document.getElementById('import-class');
  const importSection = document.getElementById('import-section');
  const importGroup = document.getElementById('import-group');
  if (!importClass || !importSection || !importGroup) return;

  const groups = getGroups();
  const classes = [...new Set(groups.map(group => group.className))];
  importClass.innerHTML = '<option value="">Select class</option>' + classes.map(cls => `<option value="${cls}">${cls}</option>`).join('');
  const selectedClass = importClass.value || classes[0] || '';
  const sections = selectedClass ? [...new Set(groups.filter(group => group.className === selectedClass).map(group => group.sectionName))] : [];
  importSection.innerHTML = '<option value="">Select section</option>' + sections.map(section => `<option value="${section}">${section}</option>`).join('');
  const selectedSection = importSection.value || sections[0] || '';
  const groupOptions = selectedClass && selectedSection ? groups.filter(group => group.className === selectedClass && group.sectionName === selectedSection) : [];
  importGroup.innerHTML = '<option value="">Select group</option>' + groupOptions.map(group => `<option value="${group.id}">${group.groupName}</option>`).join('');

  importClass.onchange = () => hydrateImportSelects();
  importSection.onchange = () => hydrateImportSelects();
}

function renderStats() {
  const students = getStudents();
  const groups = getGroups();
  const users = getUsers();
  const callLogs = getCallLogs();

  document.getElementById('total-students').textContent = students.length;
  document.getElementById('total-groups').textContent = groups.length;
  document.getElementById('total-teachers').textContent = users.filter(user => user.role === 'teacher').length;
  document.getElementById('total-calls').textContent = callLogs.length;
}

function renderGroupsTable() {
  const groups = getGroups();
  const wrap = document.getElementById('groups-table-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Class</th><th>Section</th><th>Group</th><th>Students</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${groups.map(group => {
          const count = getStudents().filter(student => student.groupId === group.id).length;
          return `<tr>
            <td>${group.className}</td>
            <td>${group.sectionName}</td>
            <td>${group.groupName}</td>
            <td>${count}</td>
            <td><button type="button" class="danger-btn" data-delete-group="${group.id}" style="padding:8px 10px;">Delete</button></td>
          </tr>`;
        }).join('') || '<tr><td colspan="5">No groups created yet.</td></tr>'}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-delete-group]').forEach(button => {
    button.addEventListener('click', () => {
      const groupId = button.dataset.deleteGroup;
      const groups = getGroups();
      const group = groups.find(item => item.id === groupId);
      if (!group) return;

      if (!window.confirm(`Delete group "${group.groupName}"? This will also remove related student records from this group.`)) {
        return;
      }

      const nextGroups = groups.filter(item => item.id !== groupId);
      const nextStudents = getStudents().filter(student => student.groupId !== groupId);
      saveGroups(nextGroups);
      saveStudents(nextStudents);
      renderGroupsTable();
      renderStats();
      renderTeacherTable();
      renderTeacherStudents();
      hydrateImportSelects();
      hydrateManualStudentForm();
      hydrateTeacherGroupSelect();
      showToast('Group deleted');
    });
  });
}

function renderTeacherTable() {
  const wrap = document.getElementById('teacher-table-wrap');
  if (!wrap) return;

  const users = getUsers().filter(user => user.role === 'teacher');
  wrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Teacher</th><th>Username</th><th>Assigned groups</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${users.length ? users.map(user => {
          const assigned = user.assignedGroups.map(groupId => {
            const item = getGroups().find(group => group.id === groupId);
            return item ? `${item.className} / ${item.sectionName} / ${item.groupName}` : 'Unknown';
          }).join(', ');
          return `<tr>
            <td>${user.fullName}</td>
            <td>${user.username}</td>
            <td>${assigned || 'No groups assigned'}</td>
            <td><button type="button" class="danger-btn" data-delete-teacher="${user.id}" style="padding:8px 10px;">Delete</button></td>
          </tr>`;
        }).join('') : '<tr><td colspan="4">No teachers yet.</td></tr>'}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-delete-teacher]').forEach(button => {
    button.addEventListener('click', () => {
      const teacherId = button.dataset.deleteTeacher;
      const users = getUsers();
      const teacher = users.find(user => user.id === teacherId && user.role === 'teacher');
      if (!teacher) return;

      if (!window.confirm(`Delete teacher "${teacher.fullName}"? Their account and direct student assignments will be removed.`)) {
        return;
      }

      saveUsers(users.filter(user => user.id !== teacherId));
      saveStudents(getStudents().map(student => ({
        ...student,
        teacherIds: Array.isArray(student.teacherIds)
          ? student.teacherIds.filter(id => id !== teacherId)
          : student.teacherIds
      })));
      renderTeacherTable();
      renderStats();
      renderNav();
      hydrateManualStudentForm();
      showToast('Teacher deleted');
    });
  });
}

function renderCallLogsTable() {
  const wrap = document.getElementById('call-log-table-wrap');
  if (!wrap) return;

  const logs = getCallLogs();
  wrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Teacher</th><th>Class</th><th>Section</th><th>Student</th><th>Parent</th><th>Summary</th><th>Date</th></tr>
      </thead>
      <tbody>
        ${logs.length ? logs.map(log => `
          <tr>
            <td>${log.teacherName || log.teacherUsername}</td>
            <td>${log.className}</td>
            <td>${log.sectionName}</td>
            <td>${log.studentName}</td>
            <td>${log.parentName}</td>
            <td>${log.callSummary}</td>
            <td>${new Date(log.createdAt).toLocaleString()}</td>
          </tr>
        `).join('') : '<tr><td colspan="7">No call records yet.</td></tr>'}
      </tbody>
    </table>
  `;
}

function getAssignedStudentRows() {
  const user = currentUser();
  if (!user || user.role !== 'teacher') return [];

  return getStudents().filter(student => {
    const sameGroupAssignment = user.assignedGroups.includes(student.groupId);
    const directTeacherMatch = Array.isArray(student.teacherIds) && student.teacherIds.includes(user.id);
    return sameGroupAssignment || directTeacherMatch;
  });
}

function renderTeacherStudents() {
  const user = currentUser();
  const wrap = document.getElementById('teacher-student-table-wrap');
  if (!wrap || !user) return;

  const rows = getAssignedStudentRows();
  wrap.innerHTML = `
    <table>
      <thead>
        <tr><th>S.No</th><th>Student</th><th>Class / Section / Group</th><th>Parent</th><th>Contact</th><th>Call</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map(student => {
          const directParentName = student.parentName || student.fatherName || student.motherName || student.guardianName || 'Guardian';
          const directPhone = student.parentMobile || student.fatherMobile || student.motherMobile || student.guardianMobile || 'No contact';
          const primaryParent = student.parentName ? `${student.parentName}` : (student.fatherName ? `${student.fatherName} (Father)` : student.motherName ? `${student.motherName} (Mother)` : (student.guardianName || 'Guardian'));
          const phone = student.parentMobile || student.fatherMobile || student.motherMobile || student.guardianMobile || 'No contact';
          return `
            <tr>
              <td>${student.sno || ''}</td>
              <td>${student.studentName}</td>
              <td>${student.className} / ${student.sectionName} / ${student.groupName}</td>
              <td>${primaryParent}</td>
              <td>${phone}</td>
              <td>
                <div class="action-row">
                  <a href="tel:${phone.replace(/\s+/g, '')}" class="secondary-btn" style="display:inline-block;padding:8px 10px;text-decoration:none;${phone === 'No contact' ? 'pointer-events:none;opacity:0.5;' : ''}">Call</a>
                  <button type="button" class="primary-btn" data-call-teacher="${student.id}" style="padding:8px 10px;">Log summary</button>
                </div>
              </td>
            </tr>
          `;
        }).join('') : '<tr><td colspan="6">No students assigned to this teacher.</td></tr>'}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('[data-call-teacher]').forEach(button => {
    button.addEventListener('click', () => showSummaryForm(button.dataset.callTeacher));
  });
}

function renderUserMeta() {
  const user = currentUser();
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  if (!user) return;

  userName.textContent = user.fullName;
  userRole.textContent = user.role === 'admin' ? 'Administrator' : 'Teacher';
  userAvatar.textContent = user.fullName.slice(0, 1).toUpperCase();
}

function setLoggedInView() {
  const user = currentUser();
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  const adminDashboard = document.getElementById('admin-dashboard');
  const teacherDashboard = document.getElementById('teacher-dashboard');

  loginScreen.classList.toggle('hidden', !!user);
  appShell.classList.toggle('hidden', !user);
  if (!user) return;

  renderUserMeta();
  renderNav();
  renderStats();
  renderGroupsTable();
  renderTeacherTable();
  renderCallLogsTable();
  renderTeacherStudents();
  hydrateTeacherGroupSelect();
  hydrateManualStudentForm();
  hydrateImportSelects();

  if (user.role === 'teacher') {
    adminDashboard.classList.add('hidden');
    teacherDashboard.classList.remove('hidden');
    document.getElementById('page-title').textContent = 'Teacher dashboard';
    document.getElementById('welcome-label').textContent = 'Teacher portal';
  } else {
    adminDashboard.classList.remove('hidden');
    teacherDashboard.classList.add('hidden');
    document.getElementById('page-title').textContent = 'Admin dashboard';
    document.getElementById('welcome-label').textContent = 'Admin portal';
  }
}

function loginUser(username, password) {
  const users = getUsers();
  const matched = users.find(user => user.username === username && user.password === password);
  if (!matched) {
    showToast('Invalid username or password');
    return;
  }
  sessionStorage.setItem('carecall_current_user', matched.username);
  setLoggedInView();
}

function logoutUser() {
  sessionStorage.removeItem('carecall_current_user');
  setLoggedInView();
}

function showSummaryForm(studentId) {
  const student = getStudents().find(item => item.id === studentId);
  if (!student) return;

  const existingModal = document.getElementById('call-summary-modal');
  if (existingModal) existingModal.remove();
  const callStartedAt = new Date();

  const modal = document.createElement('div');
  modal.id = 'call-summary-modal';
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(18, 32, 26, 0.32)';
  modal.style.display = 'grid';
  modal.style.placeItems = 'center';
  modal.innerHTML = `
    <div style="width:min(520px,90vw);background:white;border-radius:16px;padding:22px;box-shadow:0 20px 44px rgba(0,0,0,0.15);">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;">
        <h3 style="margin:0;">Call summary</h3>
        <button type="button" id="close-call-modal" class="secondary-btn" style="padding:8px 12px;">Close</button>
      </div>
      <form id="call-summary-form" class="stack">
        <div class="row-form">
          <div class="inline-label"><label>Class</label><input name="className" value="${student.className}" readonly /></div>
          <div class="inline-label"><label>Section</label><input name="sectionName" value="${student.sectionName}" readonly /></div>
        </div>
        <div class="inline-label"><label>Student</label><input name="studentName" value="${student.studentName}" readonly /></div>
        <div class="inline-label"><label>Parent / guardian name</label><input name="parentName" value="${student.fatherName || student.motherName || student.guardianName || 'N/A'}" /></div>
        <div class="inline-label"><label>Call date and time</label><input value="${callStartedAt.toLocaleString()}" readonly /></div>
        <div class="inline-label"><label>Call summary</label><textarea name="callSummary" rows="5" required placeholder="Write the summary of the parent conversation..."></textarea></div>
        <button type="submit" class="primary-btn">Save call record</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('close-call-modal').addEventListener('click', () => modal.remove());
  document.getElementById('call-summary-form').addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const entry = {
      id: `log-${Date.now()}`,
      className: formData.get('className'),
      sectionName: formData.get('sectionName'),
      studentName: formData.get('studentName'),
      parentName: formData.get('parentName'),
      callSummary: formData.get('callSummary'),
      teacherUsername: currentUser().username,
      teacherName: currentUser().fullName,
      createdAt: new Date().toISOString()
    };

    const logs = getCallLogs();
    logs.unshift(entry);
    saveCallLogs(logs);
    renderCallLogsTable();
    renderStats();
    modal.remove();
    showToast('Call summary saved');
  });
}

function exportCallLogs(filterTeacher = null) {
  const logs = filterTeacher
    ? getCallLogs().filter(log => (
        (log.teacherUsername && log.teacherUsername === filterTeacher.username) ||
        (log.teacherName && log.teacherName === filterTeacher.fullName)
      ))
    : getCallLogs();

  const headers = ['teacherName', 'teacherUsername', 'className', 'sectionName', 'studentName', 'parentName', 'callSummary', 'createdAt'];
  const rows = [headers.join(',')].concat(logs.map(log => headers.map(header => csvEscape(log[header] || '')).join(',')));

  const fileName = filterTeacher
    ? `${(filterTeacher.username || filterTeacher.fullName || 'teacher').replace(/\s+/g, '_').toLowerCase()}_call_logs.csv`
    : 'carecall_call_logs.csv';

  downloadCsv(fileName, rows);
}

let pendingCsvFile = null;

function handleImportCsv(file) {
  pendingCsvFile = file || null;
  const resultBox = document.getElementById('csv-import-result');

  if (!pendingCsvFile) {
    resultBox.textContent = 'No file selected yet.';
    return;
  }

  resultBox.textContent = `File selected: ${pendingCsvFile.name}`;
}

function uploadCsvToDatabase() {
  const importClass = document.getElementById('import-class');
  const importSection = document.getElementById('import-section');
  const importGroup = document.getElementById('import-group');
  const resultBox = document.getElementById('csv-import-result');
  const file = pendingCsvFile;

  if (!file || !importClass.value || !importSection.value || !importGroup.value) {
    resultBox.textContent = 'Please choose a CSV file and select class, section, and group before uploading.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsvRows(reader.result);
    if (rows.length < 2) {
      resultBox.textContent = 'The CSV file is empty or invalid.';
      return;
    }

    const headings = rows[0].map(normalizeHeader);
    const expected = ['sno', 'studentname', 'fathername', 'fathermobile', 'mothername', 'mothermobile', 'guardianname', 'guardian_mobile', 'email', 'cityofresidence'];
    const matches = expected.every(label => headings.includes(label));

    if (!matches) {
      resultBox.textContent = 'CSV format does not match the required CareCall template.';
      return;
    }

    const selectedGroup = getGroups().find(group => group.id === importGroup.value);
    if (!selectedGroup) {
      resultBox.textContent = 'Selected group is invalid.';
      return;
    }

    const imported = rows.slice(1).map(row => {
      const record = {};
      headings.forEach((heading, index) => {
        record[heading] = row[index] || '';
      });

      return {
        id: generateStudentId(),
        sno: record.sno,
        studentName: record.studentname,
        fatherName: record.fathername,
        fatherMobile: record.fathermobile,
        motherName: record.mothername,
        motherMobile: record.mothermobile,
        guardianName: record.guardianname,
        guardianMobile: record.guardian_mobile,
        email: record.email,
        cityOfResidence: record.cityofresidence,
        className: selectedGroup.className,
        sectionName: selectedGroup.sectionName,
        groupName: selectedGroup.groupName,
        groupId: selectedGroup.id
      };
    }).filter(student => student.studentName);

    if (!imported.length) {
      resultBox.textContent = 'No valid student records were found in the CSV file.';
      return;
    }

    const students = getStudents();
    students.push(...imported);
    saveStudents(students);
    renderStats();
    renderGroupsTable();
    renderTeacherStudents();
    resultBox.textContent = `${imported.length} student record(s) uploaded successfully.`;
    showToast('CSV upload completed');
  };

  reader.readAsText(file);
}

function handleGroupCreation(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const className = form.get('className').toString().trim();
  const sectionName = form.get('sectionName').toString().trim();
  const groupName = form.get('groupName').toString().trim();

  if (!className || !sectionName || !groupName) {
    showToast('All fields are required');
    return;
  }

  const groups = getGroups();
  const exists = groups.some(group => group.className === className && group.sectionName === sectionName && group.groupName === groupName);
  if (exists) {
    showToast('This group already exists');
    return;
  }

  groups.push({ id: generateGroupId(), className, sectionName, groupName });
  saveGroups(groups);
  event.target.reset();
  renderGroupsTable();
  renderStats();
  hydrateImportSelects();
  hydrateTeacherGroupSelect();
  hydrateManualStudentForm();
  showToast('Group added successfully');
}

function handleTeacherCreation(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const fullName = form.get('fullName').toString().trim();
  const username = form.get('username').toString().trim();
  const password = form.get('password').toString();
  const assignedGroupIds = Array.from(event.target.querySelectorAll('option:checked')).map(option => option.value);

  if (!fullName || !username || !password) {
    showToast('Teacher details are required');
    return;
  }

  const users = getUsers();
  if (users.some(user => user.username === username)) {
    showToast('Username already exists');
    return;
  }

  users.push({
    id: `t${Date.now()}`,
    fullName,
    username,
    password,
    role: 'teacher',
    assignedGroups: assignedGroupIds
  });
  saveUsers(users);
  event.target.reset();
  document.getElementById('teacher-form').classList.add('hidden');
  renderTeacherTable();
  renderStats();
  renderNav();
  hydrateTeacherGroupSelect();
  hydrateManualStudentForm();
  showToast('Teacher created');
}

function handleManualStudentCreation(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const studentName = form.get('studentName').toString().trim();
  const fatherName = form.get('fatherName').toString().trim();
  const fatherMobile = form.get('fatherMobile').toString().trim();
  const motherName = form.get('motherName').toString().trim();
  const motherMobile = form.get('motherMobile').toString().trim();
  const guardianName = form.get('guardianName').toString().trim();
  const guardianMobile = form.get('guardianMobile').toString().trim();
  const cityOfResidence = form.get('cityOfResidence').toString().trim();
  const teacherId = form.get('teacherId').toString();
  const selectedGroup = getGroups().find(group => group.id === form.get('groupId').toString());

  if (!studentName || !fatherName || !fatherMobile || !selectedGroup || !teacherId) {
    showToast('Student name, father name, father mobile, group, and teacher are required');
    return;
  }

  const students = getStudents();
  const newStudent = {
    id: generateStudentId(),
    sno: String(students.length + 1),
    studentName,
    fatherName,
    fatherMobile,
    motherName,
    motherMobile,
    guardianName,
    guardianMobile,
    email: '',
    cityOfResidence,
    className: selectedGroup.className,
    sectionName: selectedGroup.sectionName,
    groupName: selectedGroup.groupName,
    groupId: selectedGroup.id,
    teacherIds: [teacherId],
    parentName: fatherName,
    parentMobile: fatherMobile
  };

  students.push(newStudent);
  saveStudents(students);

  event.target.reset();
  hydrateManualStudentForm();
  renderStats();
  renderTeacherStudents();
  renderGroupsTable();
  showToast('Parent record saved and assigned to teacher');
}

function init() {
  ensureStorage();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', event => {
    event.preventDefault();
    loginUser(document.getElementById('login-username').value.trim(), document.getElementById('login-password').value);
    loginForm.reset();
  });

  document.getElementById('logout-btn')?.addEventListener('click', logoutUser);
  document.getElementById('group-form')?.addEventListener('submit', handleGroupCreation);
  document.getElementById('teacher-form')?.addEventListener('submit', handleTeacherCreation);
  document.getElementById('manual-student-form')?.addEventListener('submit', handleManualStudentCreation);
  document.getElementById('csv-file-input')?.addEventListener('change', event => {
    const file = event.target.files[0];
    handleImportCsv(file);
  });
  document.getElementById('upload-csv-btn')?.addEventListener('click', uploadCsvToDatabase);
  document.getElementById('download-template-btn')?.addEventListener('click', () => {
    const template = [
      'sno,studentname,fathername,fathermobile,mothername,mothermobile,guardianname,guardian mobile,email,cityofresidence',
      '1,John Smith,Michael Smith,+919900000001,Rebecca Smith,+919900000002,,,+919900000003,john@example.com,Bengaluru'
    ].join('\n');
    downloadCsv('carecall_student_template.csv', template.split('\n'));
  });
  document.getElementById('export-call-logs-btn')?.addEventListener('click', () => exportCallLogs());
  document.getElementById('teacher-export-btn')?.addEventListener('click', () => {
    const user = currentUser();
    if (user && user.role === 'teacher') {
      exportCallLogs(user);
      return;
    }
    showToast('Only teachers can export their own call logs');
  });
  document.getElementById('add-group-btn')?.addEventListener('click', () => {
    document.getElementById('group-form')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('add-teacher-btn')?.addEventListener('click', () => {
    document.getElementById('teacher-form')?.classList.toggle('hidden');
  });
  document.getElementById('cancel-teacher-form')?.addEventListener('click', () => {
    document.getElementById('teacher-form')?.classList.add('hidden');
  });

  if (currentUser()) {
    setLoggedInView();
  } else {
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  }
}

window.addEventListener('DOMContentLoaded', init);
