/**
 * BEST INDIA COMPUTER SHOPPE — SHOP MANAGER BACKEND (CRM · Sales · Service)
 * Google Apps Script web app. Stores everything in the Google Sheet it is bound to.
 *
 * Sheets (created automatically):
 *   Users     – staff logins, job titles and permissions
 *   Customers – one row per customer (CRM)
 *   Sales     – one row per bill / sale
 *   Service   – one row per service job (indoor repair or outdoor site visit)
 *   Creditors – supplier bills the shop has to pay
 *   Advances  – salary advance requests
 *   Tasks     – work assigned to staff, with updates
 *   Activity  – timeline: visits, notes, status changes, edits, sign-ins
 *
 * Setup: see README.md. In short: paste this file, run setup() once,
 * then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 */

const SHEETS = {
  users: 'Users',
  customers: 'Customers',
  activity: 'Activity',
  sales: 'Sales',
  service: 'Service',
  creditors: 'Creditors',
  advances: 'Advances',
  tasks: 'Tasks'
};

const USER_COLS = ['username', 'name', 'passHash', 'role', 'perms', 'active', 'createdAt', 'lastLogin', 'photo', 'title', 'email'];
const CUSTOMER_COLS = [
  'id', 'createdAt', 'name', 'phone', 'altPhone', 'email', 'location', 'source', 'category',
  'requirement', 'amount', 'status', 'priority', 'followUpDate', 'assignedTo', 'notes',
  'createdBy', 'updatedAt', 'updatedBy', 'lastVisit', 'visits',
  'convertedAt', 'convertedBy', 'saleId',                                   // set by the app when an enquiry becomes a sale
  'happyStatus', 'happyAt', 'happyBy', 'happyRating', 'happyNote', 'happyTries' // feedback (happy) call after a first visit
];
const ACTIVITY_COLS = ['id', 'customerId', 'timestamp', 'user', 'type', 'text', 'meta'];
const SALE_COLS = [
  'id', 'billNo', 'date', 'createdAt', 'customerId', 'customerName', 'phone', 'items', 'category',
  'amount', 'paid', 'paymentMode', 'soldBy', 'notes', 'createdBy', 'updatedAt', 'updatedBy'
];
const JOB_COLS = [
  'id', 'jobNo', 'createdAt', 'customerId', 'customerName', 'phone', 'location', 'device', 'brandModel', 'serialNo',
  'accessories', 'problem', 'jobType', 'assignedTo', 'status', 'priority', 'dueDate', 'estimate', 'charge', 'paid',
  'paymentMode', 'diagnosis', 'completedAt', 'deliveredAt', 'notes', 'createdBy', 'updatedAt', 'updatedBy'
];

// Fields only the server sets — never taken from what the app sends.
const CUSTOMER_LOCKED = ['convertedAt', 'convertedBy', 'saleId', 'happyStatus', 'happyAt', 'happyBy', 'happyRating', 'happyNote', 'happyTries'];
const HAPPY_RESULTS = ['Happy', 'Okay', 'Unhappy', 'No answer'];

const TASK_COLS = ['id', 'createdAt', 'title', 'details', 'assignedTo', 'assignedBy', 'priority', 'dueDate', 'status', 'lastNote',
  'updatedAt', 'updatedBy', 'remindedAt', 'remindCount', 'doneAt'];
const TASK_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const TASK_STATUSES = ['Open', 'In progress', 'Done'];
// Who can assign tasks, and to whom they may NOT assign (everyone else is allowed).
// Who can open "Backup & settings" (download / restore all data, connection settings). Protected by a PIN as well.
const BACKUP_ADMINS = ['saneed'];
const BACKUP_VERSION = 7;

const TASK_ASSIGNERS = {
  saneed: ['shaneer'],            // Saneed: everyone except Shaneer
  deepak: ['saneed', 'shaneer'],  // Deepak: everyone except Saneed and Shaneer
  shaneer: []                     // Chairman: anyone
};

const ADV_COLS = ['id', 'createdAt', 'username', 'name', 'month', 'amount', 'reason', 'status', 'decidedBy', 'decidedAt', 'note', 'mailed'];
const ADV_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'];
// Salary advance emails: sent TO these people, with the chairman in CC (their emails are set in the app).
const ADVANCE_MAIL_TO = ['saneed', 'midhila'];
const ADVANCE_MAIL_CC = ['shaneer'];
// Who may approve / reject requests, and who records that the money was paid out.
const ADVANCE_APPROVERS = ['saneed', 'shaneer'];
const ADVANCE_PAYERS = ['midhila'];

const CREDIT_COLS = [
  'id', 'date', 'supplier', 'phone', 'billNo', 'items', 'amount', 'paid', 'dueDate', 'notes',
  'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
];

const JOB_DONE = ['Ready', 'Delivered'];
const JOB_CLOSED = ['Delivered', 'Cancelled'];

const PERM_KEYS = ['crm', 'add', 'edit', 'viewAll', 'delete', 'export', 'reports', 'sales', 'service', 'dashboard', 'performance', 'accounts', 'advances', 'happycalls', 'manageStaff'];
const permSet_ = list => { const o = {}; PERM_KEYS.forEach(k => { o[k] = list.indexOf(k) >= 0; }); return o; };
const ADMIN_PERMS = permSet_(PERM_KEYS);
const ROLE_PERMS = {
  accountant: permSet_(PERM_KEYS.filter(k => k !== 'manageStaff')),         // everything except editing staff, incl. salary advances
  manager: permSet_(PERM_KEYS.filter(k => k !== 'manageStaff' && k !== 'advances')),          // everything except editing staff
  sales: permSet_(['crm', 'add', 'edit', 'viewAll', 'sales', 'service']), // CRM + sales + service, no reports
  callcentre: permSet_(['crm', 'add', 'edit', 'viewAll', 'sales', 'service', 'happycalls']), // same + happy (feedback) calls
  engineer: permSet_(['service'])                                           // own service jobs + own revenue
};
const STAFF_DEFAULT_PERMS = ROLE_PERMS.sales;

const SEED_USERS = [
  { username: 'saneed',  name: 'Saneed',  pass: '8321', role: 'admin', title: 'Operations Manager' },
  { username: 'shaneer', name: 'Shaneer', pass: '1234', role: 'admin', title: 'Chairman' },
  { username: 'midhila', name: 'Midhila', pass: '1234', role: 'staff', title: 'Senior Accountant', perms: 'accountant' },
  { username: 'deepak',  name: 'Deepak',  pass: '1234', role: 'staff', title: 'Store Manager',     perms: 'manager' },
  { username: 'shylesh', name: 'Shylesh', pass: '1234', role: 'staff', title: 'Sales',             perms: 'sales' },
  { username: 'sona',    name: 'Sona',    pass: '1234', role: 'staff', title: 'Call Centre',       perms: 'callcentre' },
  { username: 'nikhil',  name: 'Nikhil',  pass: '1234', role: 'staff', title: 'Outdoor Engineer',  perms: 'engineer' },
  { username: 'safwan',  name: 'Safwan',  pass: '1234', role: 'staff', title: 'Indoor Engineer',   perms: 'engineer' }
];

// Sessions last 2 hours. While the app is open and in use the session is renewed;
// once the app is closed, opening it again more than 2 hours after sign-in asks for the passcode again.
const TOKEN_HOURS = 2;

/* ============================== ENTRY POINTS ============================== */

function doGet() {
  // Used by the app's sync indicator to check the connection.
  let sheetOk = false;
  try { ensureSetup_(); sheetOk = !!sheet_(SHEETS.customers); } catch (e) {}
  return json_({ ok: true, app: 'Best India CRM', sheet: sheetOk, time: now_() });
}

function doPost(e) {
  let req = {};
  USERS_CACHE_ = null;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    ensureSetup_();
    // Optional backend key: once turned on, only copies of the app that send this key can talk to the sheet.
    const key = PropertiesService.getScriptProperties().getProperty('BACKEND_KEY');
    if (key && req.key !== key) throw new Error('KEY: This app is not allowed to connect. Ask Saneed for the backend key.');
    const data = route_(req);
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function route_(req) {
  const a = req.action;
  if (a === 'login') return withLock_(() => login_(req.username, req.password));

  const me = auth_(req.token);
  switch (a) {
    case 'bootstrap':      return bootstrap_(me);
    case 'saveCustomer':   return withLock_(() => saveCustomer_(me, req.customer || {}));
    case 'deleteCustomer': return withLock_(() => deleteCustomer_(me, req.id));
    case 'addActivity':    return withLock_(() => addActivity_(me, req));
    case 'getActivity':    return getActivity_(me, req.customerId);
    case 'recentActivity': return recentActivity_(me);
    case 'perfData':       return perfData_(me, req.from, req.to);
    case 'visitsOn':       return visitsOn_(me, req.date);
    case 'saveSale':       return withLock_(() => saveSale_(me, req.sale || {}));
    case 'deleteSale':     return withLock_(() => deleteSale_(me, req.id));
    case 'saveJob':        return withLock_(() => saveJob_(me, req.job || {}));
    case 'deleteJob':      return withLock_(() => deleteJob_(me, req.id));
    case 'jobNote':        return withLock_(() => jobNote_(me, req.id, req.text));
    case 'saveCredit':     return withLock_(() => saveCredit_(me, req.credit || {}));
    case 'deleteCredit':   return withLock_(() => deleteCredit_(me, req.id));
    case 'requestAdvance': return withLock_(() => requestAdvance_(me, req));
    case 'decideAdvance':  return withLock_(() => decideAdvance_(me, req.id, req.status, req.note));
    case 'happyCall':      return withLock_(() => happyCall_(me, req.customerId, req.result, req.note));
    case 'saveTask':       return withLock_(() => saveTask_(me, req.task || {}));
    case 'taskUpdate':     return withLock_(() => taskUpdate_(me, req.id, req.status, req.note));
    case 'remindTask':     return withLock_(() => remindTask_(me, req.id));
    case 'deleteTask':     return withLock_(() => deleteTask_(me, req.id));
    case 'pinStatus':      return pinStatus_(me);
    case 'setPin':         return withLock_(() => setPin_(me, req.pin, req.oldPin));
    case 'pinCheck':       return withLock_(() => { pinOk_(me, req.pin); return { ok: true }; });
    case 'backup':         return withLock_(() => backup_(me, req.pin));
    case 'restore':        return withLock_(() => restore_(me, req.pin, req.data));
    case 'adminInfo':      return withLock_(() => adminInfo_(me, req.pin));
    case 'setBackendKey':  return withLock_(() => setBackendKey_(me, req.pin, req.key));
    case 'setEmail':       return withLock_(() => setEmail_(me, req.username, req.email));
    case 'recordPayment':  return withLock_(() => recordPayment_(me, req.kind, req.id, req.amount, req.mode));
    case 'listUsers':      return listUsers_(me);
    case 'saveUser':       return withLock_(() => saveUser_(me, req.user || {}));
    case 'deleteUser':     return withLock_(() => deleteUser_(me, req.username));
    case 'resetPassword':  return withLock_(() => resetPassword_(me, req.username, req.password));
    case 'changePassword': return withLock_(() => changePassword_(me, req.oldPassword, req.newPassword));
    case 'setPhoto':       return withLock_(() => setPhoto_(me, req.username, req.photo));
    default: throw new Error('Unknown action: ' + a);
  }
}

/* ============================== SETUP ============================== */

/** Run this once from the Apps Script editor. Safe to run again. */
function setup() {
  ensureSetup_(true);
  Logger.log('Best India CRM is ready. Sheets: Users, Customers, Sales, Service, Activity.');
}

function ensureSetup_(force) {
  const props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty('SETUP_DONE') === '7') return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const make = (name, cols) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const head = sh.getLastRow() === 0 ? [] : sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0];
    if (head.length < cols.length || cols.some((c, i) => head[i] !== c)) {
      // New sheet, or an older version without the newest columns: (re)write the header row.
      sh.getRange(1, 1, 1, cols.length).setValues([cols])
        .setFontWeight('bold').setBackground('#1d1d1f').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
    // Keep everything as plain text so phone numbers / dates never get mangled.
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');
    return sh;
  };
  make(SHEETS.users, USER_COLS);
  make(SHEETS.customers, CUSTOMER_COLS);
  make(SHEETS.sales, SALE_COLS);
  make(SHEETS.service, JOB_COLS);
  make(SHEETS.creditors, CREDIT_COLS);
  make(SHEETS.advances, ADV_COLS);
  make(SHEETS.tasks, TASK_COLS);
  make(SHEETS.activity, ACTIVITY_COLS);

  if (!props.getProperty('TOKEN_SECRET')) props.setProperty('TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid());
  // One-time: add missing staff (e.g. Shaneer) and apply the job titles & access levels.
  if (props.getProperty('ROLES_V') !== '1') { applyRoles_(); props.setProperty('ROLES_V', '1'); }
  const s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  props.setProperty('SETUP_DONE', '7');
}

function applyRoles_() {
  const sh = sheet_(SHEETS.users);
  const rows = readAll_(SHEETS.users, USER_COLS);
  SEED_USERS.forEach(s => {
    const perms = JSON.stringify(s.role === 'admin' ? ADMIN_PERMS : ROLE_PERMS[s.perms]);
    const r = rows.find(x => x.obj.username === s.username);
    if (r) {
      const o = Object.assign({}, r.obj, { role: s.role, perms: perms, title: s.title });
      sh.getRange(r.row, 1, 1, USER_COLS.length).setValues([USER_COLS.map(k => o[k] || '')]);
    } else {
      const o = { username: s.username, name: s.name, passHash: hash_(s.username, s.pass), role: s.role, perms: perms,
        active: 'TRUE', createdAt: now_(), lastLogin: '', photo: '', title: s.title };
      sh.appendRow(USER_COLS.map(k => o[k] || ''));
    }
  });
}

/* ============================== AUTH ============================== */

function login_(username, password) {
  username = String(username || '').trim().toLowerCase();
  const rec = findUser_(username);
  if (!rec || String(rec.user.active).toUpperCase() !== 'TRUE') throw new Error('Wrong ID or passcode');
  if (rec.user.passHash !== hash_(username, String(password || ''))) throw new Error('Wrong ID or passcode');
  sheet_(SHEETS.users).getRange(rec.row, USER_COLS.indexOf('lastLogin') + 1).setValue(now_());
  logActivity_('', username, 'login', 'Signed in');
  const loginAt = Date.now();
  return { token: makeToken_(username, loginAt), loginAt: loginAt, hours: TOKEN_HOURS, user: publicUser_(rec.user) };
}

function auth_(token) {
  if (!token) throw new Error('AUTH: Please sign in');
  const parts = String(token).split('.');
  if (parts.length !== 2) throw new Error('AUTH: Invalid session');
  const payload = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
  if (sign_(payload) !== parts[1]) throw new Error('AUTH: Invalid session');
  const [username, exp, loginAt] = payload.split('|');
  if (!loginAt || Date.now() > Number(exp)) throw new Error('AUTH: Session expired, please sign in again');
  const row = usersCached_().find(r => r.obj.username === String(username || '').toLowerCase());
  if (!row || String(row.obj.active).toUpperCase() !== 'TRUE') throw new Error('AUTH: Account disabled');
  const me = publicUser_(row.obj);
  me.loginAt = Number(loginAt);
  return me;
}

function makeToken_(username, loginAt) {
  const payload = username + '|' + (Date.now() + TOKEN_HOURS * 3600 * 1000) + '|' + loginAt;
  return Utilities.base64EncodeWebSafe(payload) + '.' + sign_(payload);
}

function sign_(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret));
}

function hash_(username, pass) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'bi-crm:' + username + ':' + pass);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function publicUser_(u) {
  let perms = {};
  try { perms = JSON.parse(u.perms || '{}'); } catch (e) {}
  if (perms.crm === undefined) perms.crm = true; // accounts from before the Sales/Service modules
  if (perms.accounts === undefined) perms.accounts = !!perms.dashboard; // Debtors & Creditors: managers who had the dashboard
  if (perms.happycalls === undefined) perms.happycalls = /call cent/i.test(u.title || ''); // feedback calls: call centre
  if (perms.advances === undefined) perms.advances = /accountant/i.test(u.title || ''); // salary advance history: accountant (admins always)
  if (u.role === 'admin') perms = Object.assign({}, ADMIN_PERMS);
  PERM_KEYS.forEach(k => { perms[k] = !!perms[k]; });
  return {
    username: u.username, name: u.name, role: u.role, title: u.title || '', email: u.email || '', perms: perms,
    active: String(u.active).toUpperCase() === 'TRUE', createdAt: u.createdAt, lastLogin: u.lastLogin, photo: u.photo || ''
  };
}

/** Users sheet read once per request for sign-in checks and the staff list (writes always re-read). */
let USERS_CACHE_ = null;
function usersCached_() { if (!USERS_CACHE_) USERS_CACHE_ = readAll_(SHEETS.users, USER_COLS); return USERS_CACHE_; }

const has_ = (me, perm) => me.role === 'admin' || !!me.perms[perm];
function need_(me, perm) {
  if (!has_(me, perm)) throw new Error('You do not have permission for this (' + perm + ')');
}

/* ============================== BOOTSTRAP ============================== */

function bootstrap_(me) {
  me.advApprove = ADVANCE_APPROVERS.indexOf(me.username) >= 0;
  me.advPay = ADVANCE_PAYERS.indexOf(me.username) >= 0;
  me.taskTargets = taskTargets_(me);
  me.backupAdmin = BACKUP_ADMINS.indexOf(me.username) >= 0;
  const dash = has_(me, 'dashboard');
  const out = {
    me: me, serverTime: now_(), customers: [], sales: [], jobs: [], credits: [], advances: [], tasks: [],
    token: makeToken_(me.username, me.loginAt), // renewed while the app is in use
    staff: usersCached_().map(r => r.obj)
      .filter(u => String(u.active).toUpperCase() === 'TRUE')
      .map(u => ({ username: u.username, name: u.name, role: u.role, title: u.title || '', photo: u.photo || '',
        email: u.email || '', perms: publicUser_(u).perms, lastLogin: u.lastLogin }))
  };
  if (has_(me, 'crm') || dash) out.customers = readAll_(SHEETS.customers, CUSTOMER_COLS).map(r => r.obj).filter(c => canSee_(me, c));
  if (has_(me, 'sales') || dash) out.sales = readAll_(SHEETS.sales, SALE_COLS).map(r => r.obj).filter(s => canSeeSale_(me, s));
  if (has_(me, 'service') || dash) out.jobs = readAll_(SHEETS.service, JOB_COLS).map(r => r.obj).filter(j => canSeeJob_(me, j));
  if (has_(me, 'accounts') || dash) out.credits = readAll_(SHEETS.creditors, CREDIT_COLS).map(r => r.obj);
  out.tasks = readAll_(SHEETS.tasks, TASK_COLS).map(r => r.obj).filter(t => me.role === 'admin' || t.assignedTo === me.username || t.assignedBy === me.username);
  out.advances = readAll_(SHEETS.advances, ADV_COLS).map(r => r.obj).filter(a => has_(me, 'advances') || a.username === me.username);
  return out;
}

const seesAll_ = me => me.role === 'admin' || me.perms.viewAll || me.perms.dashboard;
function canSee_(me, c) { return seesAll_(me) || c.createdBy === me.username || c.assignedTo === me.username; }
function canSeeSale_(me, s) { return seesAll_(me) || s.soldBy === me.username || s.createdBy === me.username; }
function canSeeJob_(me, j) { return seesAll_(me) || j.assignedTo === me.username || j.createdBy === me.username; }

/* ============================== CUSTOMERS ============================== */

function saveCustomer_(me, input) {
  need_(me, 'crm');
  const sh = sheet_(SHEETS.customers);
  const ts = now_();
  const clean = {};
  CUSTOMER_COLS.forEach(k => { if (input[k] !== undefined && input[k] !== null) clean[k] = String(input[k]).trim(); });
  CUSTOMER_LOCKED.forEach(k => { delete clean[k]; });
  if (!clean.name) throw new Error('Customer name is required');
  if (!clean.phone) throw new Error('Phone number is required');

  if (clean.id) {
    need_(me, 'edit');
    const rec = findRow_(SHEETS.customers, CUSTOMER_COLS, 'id', clean.id);
    if (!rec) throw new Error('Customer not found');
    if (!canSee_(me, rec.obj)) throw new Error('Not allowed');
    const before = rec.obj;
    const after = Object.assign({}, before, clean, {
      id: before.id, createdAt: before.createdAt, createdBy: before.createdBy,
      visits: before.visits, lastVisit: before.lastVisit, updatedAt: ts, updatedBy: me.username
    });
    markConversion_(before, after, me.username, ts);
    sh.getRange(rec.row, 1, 1, CUSTOMER_COLS.length).setValues([CUSTOMER_COLS.map(k => after[k] || '')]);
    const changes = [];
    ['status', 'followUpDate', 'assignedTo', 'priority'].forEach(k => {
      if ((before[k] || '') !== (after[k] || '')) changes.push(label_(k) + ': ' + (before[k] || '—') + ' → ' + (after[k] || '—'));
    });
    logActivity_(after.id, me.username, 'update', changes.length ? changes.join(' · ') : 'Details updated', fuMeta_(before.followUpDate, after.followUpDate));
    return after;
  }

  need_(me, 'add');
  const c = Object.assign({
    status: 'New', priority: 'Normal', source: 'Walk-in', category: 'Sales', assignedTo: me.username
  }, clean, {
    id: newId_('C'), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username,
    lastVisit: ts, visits: '1'
  });
  markConversion_({}, c, me.username, ts);
  sh.appendRow(CUSTOMER_COLS.map(k => c[k] || ''));
  logActivity_(c.id, me.username, 'visit', 'First visit recorded' + (c.requirement ? ' — ' + c.requirement : ''));
  if (c.notes) logActivity_(c.id, me.username, 'note', c.notes);
  return c;
}

function deleteCustomer_(me, id) {
  need_(me, 'crm');
  need_(me, 'delete');
  const rec = findRow_(SHEETS.customers, CUSTOMER_COLS, 'id', id);
  if (!rec) throw new Error('Customer not found');
  sheet_(SHEETS.customers).deleteRow(rec.row);
  logActivity_(id, me.username, 'delete', 'Customer deleted: ' + rec.obj.name + ' (' + rec.obj.phone + ')');
  return { id: id };
}

/** type: note | visit | call | status | followup. Optional: status, followUpDate to update the customer at the same time. */
function addActivity_(me, req) {
  need_(me, 'crm');
  const rec = findRow_(SHEETS.customers, CUSTOMER_COLS, 'id', req.customerId);
  if (!rec) throw new Error('Customer not found');
  if (!canSee_(me, rec.obj)) throw new Error('Not allowed');
  const c = rec.obj;
  const ts = now_();
  const type = req.type || 'note';
  const extra = [];
  const oldDue = c.followUpDate;
  if (type === 'visit') {
    c.visits = String((Number(c.visits) || 0) + 1);
    c.lastVisit = ts;
  }
  if (req.status !== undefined && req.status !== c.status) { extra.push('Status: ' + (c.status || '—') + ' → ' + req.status); const b = { status: c.status }; c.status = req.status; markConversion_(b, c, me.username, ts); }
  if (req.followUpDate !== undefined && req.followUpDate !== c.followUpDate) {
    extra.push('Follow-up: ' + (req.followUpDate || 'cleared')); c.followUpDate = req.followUpDate;
  }
  c.updatedAt = ts; c.updatedBy = me.username;
  sheet_(SHEETS.customers).getRange(rec.row, 1, 1, CUSTOMER_COLS.length).setValues([CUSTOMER_COLS.map(k => c[k] || '')]);
  const text = [req.text, extra.join(' · ')].filter(Boolean).join(' — ') || (type === 'visit' ? 'Visited the shop' : 'Updated');
  const act = logActivity_(c.id, me.username, type, text, fuMeta_(oldDue, c.followUpDate));
  return { customer: c, activity: act };
}

/** When a follow-up date is handled (done, moved or cleared), remember whether it was handled on time. */
function fuMeta_(oldDue, newDue) {
  if (!oldDue || oldDue === newDue) return '';
  const today = now_().slice(0, 10);
  if (newDue && newDue > oldDue && oldDue > today) return ''; // pushed a future date further out — not a "handling"
  return JSON.stringify({ due: oldDue, onTime: today <= oldDue });
}

function getActivity_(me, customerId) {
  return readAll_(SHEETS.activity, ACTIVITY_COLS).map(r => r.obj)
    .filter(a => a.customerId === customerId)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

function recentActivity_(me) {
  need_(me, 'reports');
  const all = readAll_(SHEETS.activity, ACTIVITY_COLS).map(r => r.obj);
  return all.slice(-250).reverse();
}

/** Activity in a date range for the staff performance section (no free text, keeps it small). */
function perfData_(me, from, to) {
  need_(me, 'performance');
  from = String(from || '').slice(0, 10); to = String(to || '9999').slice(0, 10);
  return readAll_(SHEETS.activity, ACTIVITY_COLS).map(r => r.obj)
    .filter(a => { const d = a.timestamp.slice(0, 10); return d >= from && d <= to; })
    .map(a => ({ id: a.customerId, timestamp: a.timestamp, user: a.user, type: a.type, meta: a.meta }));
}

/** Customers who visited on one day (first visits and repeat visits), for the date-wise customer view. */
function visitsOn_(me, date) {
  need_(me, 'crm');
  date = String(date || '').slice(0, 10);
  return readAll_(SHEETS.activity, ACTIVITY_COLS).map(r => r.obj)
    .filter(a => a.type === 'visit' && a.timestamp.slice(0, 10) === date)
    .map(a => ({ id: a.customerId, timestamp: a.timestamp, user: a.user }));
}

function logActivity_(customerId, user, type, text, meta) {
  const a = { id: newId_('A'), customerId: customerId, timestamp: now_(), user: user, type: type, text: text, meta: meta || '' };
  sheet_(SHEETS.activity).appendRow(ACTIVITY_COLS.map(k => a[k]));
  return a;
}

/* ============================== SALES ============================== */

const money_ = v => Math.round(Number(String(v || '').replace(/[^\d.]/g, '')) || 0);

function saveSale_(me, input) {
  need_(me, 'sales');
  const sh = sheet_(SHEETS.sales);
  const ts = now_();
  const clean = {};
  SALE_COLS.forEach(k => { if (input[k] !== undefined && input[k] !== null) clean[k] = String(input[k]).trim(); });
  if (!clean.items) throw new Error('Enter what was sold');
  if (!money_(clean.amount)) throw new Error('Enter the bill amount');
  clean.amount = String(money_(clean.amount));
  clean.paid = clean.paid === undefined || clean.paid === '' ? clean.amount : String(money_(clean.paid));

  let sale;
  if (clean.id) {
    const rec = findRow_(SHEETS.sales, SALE_COLS, 'id', clean.id);
    if (!rec) throw new Error('Sale not found');
    if (!canSeeSale_(me, rec.obj)) throw new Error('Not allowed');
    sale = Object.assign({}, rec.obj, clean, { id: rec.obj.id, createdAt: rec.obj.createdAt, createdBy: rec.obj.createdBy, updatedAt: ts, updatedBy: me.username });
    sh.getRange(rec.row, 1, 1, SALE_COLS.length).setValues([SALE_COLS.map(k => sale[k] || '')]);
    logActivity_(sale.id, me.username, 'sale', 'Sale updated · Rs. ' + sale.amount + ' · paid ' + sale.paid);
  } else {
    sale = Object.assign({ date: ts.slice(0, 10), paymentMode: 'Cash', soldBy: me.username, category: 'Other' }, clean, {
      id: newId_('S'), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username
    });
    sh.appendRow(SALE_COLS.map(k => sale[k] || ''));
    logActivity_(sale.id, me.username, 'sale', 'Sale Rs. ' + sale.amount + ' — ' + sale.items);
  }

  // Link to the customer in the CRM, and optionally mark them as converted.
  let customer = null;
  if (sale.customerId && !clean.id && has_(me, 'crm')) {
    const rec = findRow_(SHEETS.customers, CUSTOMER_COLS, 'id', sale.customerId);
    if (rec) {
      const c = rec.obj; const oldDue = c.followUpDate; const extra = [];
      if (input.markConverted && ['New', 'Follow-up', 'Pending'].indexOf(c.status) >= 0) {
        extra.push('Status: ' + c.status + ' → Converted'); const b = { status: c.status }; c.status = 'Converted'; c.followUpDate = '';
        markConversion_(b, c, sale.soldBy || me.username, ts);
      }
      if (c.status === 'Converted' && !c.saleId) c.saleId = sale.id; // the bill that converted this enquiry
      c.updatedAt = ts; c.updatedBy = me.username;
      sheet_(SHEETS.customers).getRange(rec.row, 1, 1, CUSTOMER_COLS.length).setValues([CUSTOMER_COLS.map(k => c[k] || '')]);
      logActivity_(c.id, me.username, 'sale', ['Purchased: ' + sale.items + ' (Rs. ' + sale.amount + ')'].concat(extra).join(' — '), fuMeta_(oldDue, c.followUpDate));
      customer = c;
    }
  }
  return { sale: sale, customer: customer };
}

function deleteSale_(me, id) {
  need_(me, 'sales');
  need_(me, 'delete');
  const rec = findRow_(SHEETS.sales, SALE_COLS, 'id', id);
  if (!rec) throw new Error('Sale not found');
  sheet_(SHEETS.sales).deleteRow(rec.row);
  logActivity_(id, me.username, 'delete', 'Sale deleted: ' + rec.obj.items + ' (Rs. ' + rec.obj.amount + ')');
  return { id: id };
}

/* ============================== SERVICE JOBS ============================== */

function saveJob_(me, input) {
  need_(me, 'service');
  const sh = sheet_(SHEETS.service);
  const ts = now_(); const today = ts.slice(0, 10);
  const clean = {};
  JOB_COLS.forEach(k => { if (input[k] !== undefined && input[k] !== null) clean[k] = String(input[k]).trim(); });
  ['estimate', 'charge', 'paid'].forEach(k => { if (clean[k] !== undefined && clean[k] !== '') clean[k] = String(money_(clean[k])); });

  if (clean.id) {
    const rec = findRow_(SHEETS.service, JOB_COLS, 'id', clean.id);
    if (!rec) throw new Error('Job not found');
    if (!canSeeJob_(me, rec.obj)) throw new Error('Not allowed');
    const before = rec.obj;
    const after = Object.assign({}, before, clean, { id: before.id, jobNo: before.jobNo, createdAt: before.createdAt, createdBy: before.createdBy, updatedAt: ts, updatedBy: me.username });
    let meta = '';
    if (after.status !== before.status) {
      if (JOB_DONE.indexOf(after.status) >= 0 && !after.completedAt) {
        after.completedAt = ts;
        meta = JSON.stringify({ job: true, due: before.dueDate || '', onTime: !before.dueDate || today <= before.dueDate });
      }
      if (after.status === 'Delivered' && !after.deliveredAt) after.deliveredAt = ts;
      if (after.status !== 'Delivered') after.deliveredAt = '';
      if (JOB_DONE.indexOf(after.status) < 0) after.completedAt = '';
    }
    sh.getRange(rec.row, 1, 1, JOB_COLS.length).setValues([JOB_COLS.map(k => after[k] || '')]);
    const changes = [];
    [['status', 'Status'], ['assignedTo', 'Engineer'], ['dueDate', 'Promised'], ['charge', 'Charge'], ['paid', 'Paid']].forEach(([k, l]) => {
      if ((before[k] || '') !== (after[k] || '')) changes.push(l + ': ' + (before[k] || '—') + ' → ' + (after[k] || '—'));
    });
    logActivity_(after.id, me.username, 'job', changes.length ? changes.join(' · ') : 'Job details updated', meta);
    return after;
  }

  if (!clean.customerName) throw new Error('Customer name is required');
  if (!clean.phone) throw new Error('Phone number is required');
  if (!clean.problem) throw new Error('Describe the problem / work');
  const count = Math.max(0, sh.getLastRow() - 1);
  const job = Object.assign({ status: 'Received', jobType: 'Indoor', priority: 'Normal', device: 'Laptop' }, clean, {
    id: newId_('J'), jobNo: 'SRV-' + (1001 + count), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username,
    completedAt: '', deliveredAt: ''
  });
  sh.appendRow(JOB_COLS.map(k => job[k] || ''));
  logActivity_(job.id, me.username, 'job', 'Job created — ' + job.device + ': ' + job.problem);
  return job;
}

function deleteJob_(me, id) {
  need_(me, 'service');
  need_(me, 'delete');
  const rec = findRow_(SHEETS.service, JOB_COLS, 'id', id);
  if (!rec) throw new Error('Job not found');
  sheet_(SHEETS.service).deleteRow(rec.row);
  logActivity_(id, me.username, 'delete', 'Service job deleted: ' + rec.obj.jobNo + ' (' + rec.obj.customerName + ')');
  return { id: id };
}

function jobNote_(me, id, text) {
  need_(me, 'service');
  text = String(text || '').trim();
  if (!text) throw new Error('Write a note first');
  const rec = findRow_(SHEETS.service, JOB_COLS, 'id', id);
  if (!rec) throw new Error('Job not found');
  if (!canSeeJob_(me, rec.obj)) throw new Error('Not allowed');
  const j = rec.obj; j.updatedAt = now_(); j.updatedBy = me.username;
  sheet_(SHEETS.service).getRange(rec.row, 1, 1, JOB_COLS.length).setValues([JOB_COLS.map(k => j[k] || '')]);
  return { job: j, activity: logActivity_(id, me.username, 'note', text) };
}

/* ============================== CREDITORS & PAYMENTS ============================== */

function saveCredit_(me, input) {
  need_(me, 'accounts');
  const sh = sheet_(SHEETS.creditors);
  const ts = now_();
  const clean = {};
  CREDIT_COLS.forEach(k => { if (input[k] !== undefined && input[k] !== null) clean[k] = String(input[k]).trim(); });
  if (clean.amount !== undefined) clean.amount = String(money_(clean.amount));
  if (clean.paid !== undefined) clean.paid = String(money_(clean.paid));
  if (clean.id) {
    const rec = findRow_(SHEETS.creditors, CREDIT_COLS, 'id', clean.id);
    if (!rec) throw new Error('Bill not found');
    const c = Object.assign({}, rec.obj, clean, { id: rec.obj.id, createdAt: rec.obj.createdAt, createdBy: rec.obj.createdBy, updatedAt: ts, updatedBy: me.username });
    if (!c.supplier) throw new Error('Supplier name is required');
    sh.getRange(rec.row, 1, 1, CREDIT_COLS.length).setValues([CREDIT_COLS.map(k => c[k] || '')]);
    logActivity_(c.id, me.username, 'credit', 'Supplier bill updated · ' + c.supplier + ' · Rs. ' + c.amount + ' · paid ' + c.paid);
    return c;
  }
  if (!clean.supplier) throw new Error('Supplier name is required');
  if (!money_(clean.amount)) throw new Error('Enter the bill amount');
  const c = Object.assign({ date: ts.slice(0, 10), paid: '0' }, clean, {
    id: newId_('P'), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username
  });
  sh.appendRow(CREDIT_COLS.map(k => c[k] || ''));
  logActivity_(c.id, me.username, 'credit', 'Supplier bill Rs. ' + c.amount + ' — ' + c.supplier);
  return c;
}

function deleteCredit_(me, id) {
  need_(me, 'accounts');
  need_(me, 'delete');
  const rec = findRow_(SHEETS.creditors, CREDIT_COLS, 'id', id);
  if (!rec) throw new Error('Bill not found');
  sheet_(SHEETS.creditors).deleteRow(rec.row);
  logActivity_(id, me.username, 'delete', 'Supplier bill deleted: ' + rec.obj.supplier + ' (Rs. ' + rec.obj.amount + ')');
  return { id: id };
}

/** Money received from a customer (kind: sale | job) or paid to a supplier (kind: credit). */
function recordPayment_(me, kind, id, amount, mode) {
  amount = money_(amount);
  if (!amount) throw new Error('Enter the amount');
  mode = String(mode || 'Cash').slice(0, 20);
  const conf = {
    sale: { sheet: SHEETS.sales, cols: SALE_COLS, total: 'amount', perm: 'sales' },
    job: { sheet: SHEETS.service, cols: JOB_COLS, total: 'charge', perm: 'service' },
    credit: { sheet: SHEETS.creditors, cols: CREDIT_COLS, total: 'amount', perm: 'accounts' }
  }[kind];
  if (!conf) throw new Error('Unknown payment type');
  if (!has_(me, 'accounts') && !has_(me, conf.perm)) throw new Error('You do not have permission for this (accounts)');
  const rec = findRow_(conf.sheet, conf.cols, 'id', id);
  if (!rec) throw new Error('Record not found');
  const o = rec.obj;
  if (kind === 'sale' && !canSeeSale_(me, o)) throw new Error('Not allowed');
  if (kind === 'job' && !canSeeJob_(me, o)) throw new Error('Not allowed');
  o.paid = String(money_(o.paid) + amount);
  if (kind !== 'credit' && mode) o.paymentMode = mode;
  o.updatedAt = now_(); o.updatedBy = me.username;
  sheet_(conf.sheet).getRange(rec.row, 1, 1, conf.cols.length).setValues([conf.cols.map(k => o[k] || '')]);
  const bal = Math.max(0, money_(o[conf.total]) - money_(o.paid));
  logActivity_(o.id, me.username, 'payment', (kind === 'credit' ? 'Paid Rs. ' : 'Received Rs. ') + amount + ' (' + mode + ')' + (bal ? ' · balance Rs. ' + bal : ' · fully paid'));
  return o;
}

/** Status became Converted → remember when and by whom; moved away from Converted → clear it. */
function markConversion_(before, after, user, ts) {
  if (after.status === 'Converted' && before.status !== 'Converted') { after.convertedAt = ts; after.convertedBy = user; }
  if (after.status !== 'Converted' && before.status === 'Converted') { after.convertedAt = ''; after.convertedBy = ''; after.saleId = ''; }
}

/* ============================== HAPPY CALLS (feedback after a first visit) ============================== */

function happyCall_(me, customerId, result, note) {
  need_(me, 'happycalls');
  if (HAPPY_RESULTS.indexOf(result) < 0) throw new Error('Choose how the call went');
  const rec = findRow_(SHEETS.customers, CUSTOMER_COLS, 'id', customerId);
  if (!rec) throw new Error('Customer not found');
  const c = rec.obj; const ts = now_();
  c.happyTries = String((Number(c.happyTries) || 0) + 1);
  c.happyStatus = result === 'No answer' ? 'No answer' : 'Done';
  if (result !== 'No answer') c.happyRating = result;
  c.happyAt = ts; c.happyBy = me.username;
  if (note) c.happyNote = String(note).trim().slice(0, 500);
  sheet_(SHEETS.customers).getRange(rec.row, 1, 1, CUSTOMER_COLS.length).setValues([CUSTOMER_COLS.map(k => c[k] || '')]);
  const act = logActivity_(c.id, me.username, 'happy', (result === 'No answer' ? 'Happy call: no answer (try ' + c.happyTries + ')' : 'Happy call: ' + result) + (note ? ' — ' + note : ''));
  return { customer: c, activity: act };
}

/* ============================== TASKS ============================== */

function nameOf_(username) { const r = findUser_(username); return (r && r.user.name) || username; }

function taskTargets_(me) {
  const blocked = TASK_ASSIGNERS[me.username];
  if (!blocked) return [];
  return readAll_(SHEETS.users, USER_COLS).map(r => r.obj)
    .filter(u => String(u.active).toUpperCase() === 'TRUE' && u.username !== me.username && blocked.indexOf(u.username) < 0)
    .map(u => u.username);
}

function saveTask_(me, input) {
  const ts = now_();
  const clean = {};
  ['id', 'title', 'details', 'assignedTo', 'priority', 'dueDate'].forEach(k => { if (input[k] !== undefined && input[k] !== null) clean[k] = String(input[k]).trim(); });
  if (clean.priority && TASK_PRIORITIES.indexOf(clean.priority) < 0) throw new Error('Unknown priority');
  if (clean.assignedTo !== undefined && taskTargets_(me).indexOf(clean.assignedTo) < 0) throw new Error('You cannot assign tasks to this person');
  const sh = sheet_(SHEETS.tasks);
  if (clean.id) {
    const rec = findRow_(SHEETS.tasks, TASK_COLS, 'id', clean.id);
    if (!rec) throw new Error('Task not found');
    if (rec.obj.assignedBy !== me.username) throw new Error('Only the person who assigned this task can change it');
    const t = Object.assign({}, rec.obj, clean, { updatedAt: ts, updatedBy: me.username });
    if (!t.title) throw new Error('Write what needs to be done');
    sh.getRange(rec.row, 1, 1, TASK_COLS.length).setValues([TASK_COLS.map(k => t[k] || '')]);
    const ch = [];
    if (rec.obj.priority !== t.priority) ch.push('Priority: ' + rec.obj.priority + ' → ' + t.priority);
    if (rec.obj.assignedTo !== t.assignedTo) ch.push('Reassigned to ' + nameOf_(t.assignedTo));
    if ((rec.obj.dueDate || '') !== (t.dueDate || '')) ch.push('Due: ' + (t.dueDate || 'none'));
    logActivity_(t.id, me.username, 'task', ch.length ? ch.join(' · ') : 'Task details changed');
    return t;
  }
  if (!TASK_ASSIGNERS[me.username]) throw new Error('You cannot assign tasks');
  if (!clean.title) throw new Error('Write what needs to be done');
  if (!clean.assignedTo) throw new Error('Choose who should do it');
  const t = Object.assign({ priority: 'Normal', details: '', dueDate: '' }, clean, {
    id: newId_('T'), createdAt: ts, assignedBy: me.username, status: 'Open', lastNote: '', updatedAt: ts, updatedBy: me.username,
    remindedAt: '', remindCount: '0', doneAt: ''
  });
  sh.appendRow(TASK_COLS.map(k => t[k] || ''));
  logActivity_(t.id, me.username, 'task', 'Task assigned to ' + nameOf_(t.assignedTo) + ' (' + t.priority + ')');
  return t;
}

function taskUpdate_(me, id, status, note) {
  const rec = findRow_(SHEETS.tasks, TASK_COLS, 'id', id);
  if (!rec) throw new Error('Task not found');
  const t = rec.obj;
  if (t.assignedTo !== me.username && t.assignedBy !== me.username) throw new Error('This is not your task');
  note = String(note || '').trim().slice(0, 500);
  if (status && TASK_STATUSES.indexOf(status) < 0) throw new Error('Unknown status');
  if (!note && (!status || status === t.status)) throw new Error('Write an update or change the status');
  const ts = now_(); const was = t.status;
  if (status) t.status = status;
  t.doneAt = t.status === 'Done' ? (t.doneAt || ts) : '';
  if (note) t.lastNote = note;
  t.updatedAt = ts; t.updatedBy = me.username;
  sheet_(SHEETS.tasks).getRange(rec.row, 1, 1, TASK_COLS.length).setValues([TASK_COLS.map(k => t[k] || '')]);
  const act = logActivity_(t.id, me.username, 'task', [was !== t.status ? 'Status: ' + was + ' → ' + t.status : '', note].filter(Boolean).join(' — '));
  return { task: t, activity: act };
}

function remindTask_(me, id) {
  const rec = findRow_(SHEETS.tasks, TASK_COLS, 'id', id);
  if (!rec) throw new Error('Task not found');
  const t = rec.obj;
  if (t.assignedBy !== me.username) throw new Error('Only the person who assigned this task can send a reminder');
  if (t.status === 'Done') throw new Error('This task is already done');
  t.remindedAt = now_(); t.remindCount = String((Number(t.remindCount) || 0) + 1);
  sheet_(SHEETS.tasks).getRange(rec.row, 1, 1, TASK_COLS.length).setValues([TASK_COLS.map(k => t[k] || '')]);
  logActivity_(t.id, me.username, 'task', 'Reminder sent (' + t.remindCount + ')');
  return t;
}

function deleteTask_(me, id) {
  const rec = findRow_(SHEETS.tasks, TASK_COLS, 'id', id);
  if (!rec) throw new Error('Task not found');
  if (rec.obj.assignedBy !== me.username) throw new Error('Only the person who assigned this task can delete it');
  sheet_(SHEETS.tasks).deleteRow(rec.row);
  logActivity_(id, me.username, 'delete', 'Task deleted: ' + rec.obj.title);
  return { id: id };
}

/* ============================== SALARY ADVANCES ============================== */

function requestAdvance_(me, req) {
  if (/chairman/i.test(me.title || '')) throw new Error('Not needed for the chairman');
  const amount = money_(req.amount);
  const month = String(req.month || '').trim().slice(0, 20);
  if (!month) throw new Error('Choose the month');
  if (!amount) throw new Error('Enter the amount');
  const a = { id: newId_('V'), createdAt: now_(), username: me.username, name: me.name, month: month, amount: String(amount),
    reason: String(req.reason || '').trim().slice(0, 300), status: 'Pending', decidedBy: '', decidedAt: '', note: '', mailed: '' };
  const mail = advanceMail_(me, a);
  let mailed = false, mailError = '';
  try {
    if (!mail.to.length) throw new Error('Saneed and Midhila have no email set in the app');
    const opts = { to: mail.to.join(','), subject: mail.subject, body: mail.body, name: me.name + ' (Best India)' };
    if (mail.cc.length) opts.cc = mail.cc.join(',');
    if (me.email) opts.replyTo = me.email;
    MailApp.sendEmail(opts);
    mailed = true; a.mailed = now_();
  } catch (e) { mailError = String(e && e.message ? e.message : e); }
  sheet_(SHEETS.advances).appendRow(ADV_COLS.map(k => a[k] || ''));
  logActivity_(a.id, me.username, 'advance', 'Salary advance requested: Rs. ' + a.amount + ' for ' + a.month + (mailed ? ' (email sent)' : ''));
  return { advance: a, mailed: mailed, mailError: mailError, mail: mail };
}

/** The preset email for an advance request. Sent from the shop's Google account, with replies going to the staff member. */
function advanceMail_(me, a) {
  const users = readAll_(SHEETS.users, USER_COLS).map(r => r.obj);
  const emailOf = list => list.map(u => (users.find(x => x.username === u) || {}).email).filter(Boolean);
  const names = ADVANCE_MAIL_TO.map(u => (users.find(x => x.username === u) || {}).name || u).join(' and ');
  const subject = 'Salary advance request – ' + me.name + ' – ' + a.month;
  const body = 'Dear ' + names + ',\n\n' +
    'I would like to request a salary advance of Rs. ' + Number(a.amount).toLocaleString('en-IN') + ' for ' + a.month + '.\n' +
    (a.reason ? 'Reason: ' + a.reason + '\n' : '') +
    '\nKindly approve.\n\nThank you,\n' + me.name + '\n' + (me.title || '') + '\n\n(Sent from Best India Shop Manager)';
  return { to: emailOf(ADVANCE_MAIL_TO), cc: emailOf(ADVANCE_MAIL_CC), subject: subject, body: body };
}

function decideAdvance_(me, id, status, note) {
  if (ADV_STATUSES.indexOf(status) < 0) throw new Error('Unknown status');
  if (status === 'Paid' && ADVANCE_PAYERS.indexOf(me.username) < 0) throw new Error('Only Midhila can mark an advance as paid');
  if (status !== 'Paid' && ADVANCE_APPROVERS.indexOf(me.username) < 0) throw new Error('Only Saneed or Shaneer can approve or reject advances');
  const rec = findRow_(SHEETS.advances, ADV_COLS, 'id', id);
  if (!rec) throw new Error('Request not found');
  const a = Object.assign({}, rec.obj, { status: status, decidedBy: me.username, decidedAt: now_(), note: String(note || rec.obj.note || '').slice(0, 300) });
  sheet_(SHEETS.advances).getRange(rec.row, 1, 1, ADV_COLS.length).setValues([ADV_COLS.map(k => a[k] || '')]);
  logActivity_(a.id, me.username, 'advance', 'Salary advance ' + status.toLowerCase() + ': ' + a.name + ' · Rs. ' + a.amount + ' · ' + a.month);
  return a;
}

/** Everyone can set their own email; staff managers can set anyone's. */
function setEmail_(me, username, email) {
  username = String(username || me.username).toLowerCase();
  if (username !== me.username) need_(me, 'manageStaff');
  email = String(email || '').trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email address does not look right');
  const rec = findUser_(username);
  if (!rec) throw new Error('Staff not found');
  sheet_(SHEETS.users).getRange(rec.row, USER_COLS.indexOf('email') + 1).setValue(email);
  return { username: username, email: email };
}

/* ============================== BACKUP, RESTORE & SETTINGS (Saneed, PIN-locked) ============================== */

const ALL_SHEETS_ = () => [
  [SHEETS.users, USER_COLS], [SHEETS.customers, CUSTOMER_COLS], [SHEETS.sales, SALE_COLS], [SHEETS.service, JOB_COLS],
  [SHEETS.creditors, CREDIT_COLS], [SHEETS.advances, ADV_COLS], [SHEETS.tasks, TASK_COLS], [SHEETS.activity, ACTIVITY_COLS]
];

function pinStatus_(me) {
  const allowed = BACKUP_ADMINS.indexOf(me.username) >= 0;
  return { allowed: allowed, isSet: allowed && !!PropertiesService.getScriptProperties().getProperty('ADMIN_PIN') };
}

function pinOk_(me, pin) {
  if (BACKUP_ADMINS.indexOf(me.username) < 0) throw new Error('Only Saneed can open Backup & settings');
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('ADMIN_PIN');
  if (!saved) throw new Error('Set a PIN first');
  const lockedUntil = Number(props.getProperty('PIN_LOCK_UNTIL') || 0);
  if (Date.now() < lockedUntil) throw new Error('Too many wrong PINs. Try again after ' + Utilities.formatDate(new Date(lockedUntil), 'Asia/Kolkata', 'h:mm a'));
  if (hash_('admin-pin', String(pin || '')) !== saved) {
    const fails = Number(props.getProperty('PIN_FAILS') || 0) + 1;
    if (fails >= 5) { props.setProperty('PIN_LOCK_UNTIL', String(Date.now() + 15 * 60 * 1000)); props.setProperty('PIN_FAILS', '0'); throw new Error('Wrong PIN 5 times. Locked for 15 minutes.'); }
    props.setProperty('PIN_FAILS', String(fails));
    throw new Error('Wrong PIN (' + (5 - fails) + ' tries left)');
  }
  props.setProperty('PIN_FAILS', '0');
}

function setPin_(me, pin, oldPin) {
  if (BACKUP_ADMINS.indexOf(me.username) < 0) throw new Error('Only Saneed can set this PIN');
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('ADMIN_PIN')) pinOk_(me, oldPin);
  if (!/^\d{4,6}$/.test(String(pin || ''))) throw new Error('PIN must be 4 to 6 digits');
  props.setProperty('ADMIN_PIN', hash_('admin-pin', String(pin)));
  logActivity_('', me.username, 'admin', 'Backup PIN ' + (oldPin ? 'changed' : 'set'));
  return { ok: true };
}

/** Everything in the sheet, up to now, as one JSON file the app downloads. */
function backup_(me, pin) {
  pinOk_(me, pin);
  const sheets = {};
  ALL_SHEETS_().forEach(([name, cols]) => {
    const sh = sheet_(name); const n = sh ? sh.getLastRow() - 1 : 0;
    sheets[name] = { cols: cols, rows: n > 0 ? sh.getRange(2, 1, n, cols.length).getDisplayValues().filter(r => r[0]) : [] };
  });
  const at = now_();
  PropertiesService.getScriptProperties().setProperty('LAST_BACKUP', at + ' by ' + me.name);
  logActivity_('', me.username, 'admin', 'Downloaded a full backup');
  return { app: 'Best India CRM', version: BACKUP_VERSION, createdAt: at, by: me.name, sheets: sheets };
}

/**
 * Put a backup file back. Before anything is replaced, every current tab is copied to a hidden
 * "Before restore …" tab in the same spreadsheet, so a restore can itself be undone by hand.
 * Columns are matched by name, so an older backup also restores into a newer version of the app.
 */
function restore_(me, pin, data) {
  pinOk_(me, pin);
  if (!data || data.app !== 'Best India CRM' || !data.sheets) throw new Error('This is not a Best India backup file');
  const u = data.sheets[SHEETS.users];
  if (!u || !Array.isArray(u.rows) || !u.rows.some(r => r && r[0])) throw new Error('This backup has no staff list. Nothing was changed.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HHmm');
  const counts = {};
  ALL_SHEETS_().forEach(([name, cols]) => {
    const part = data.sheets[name];
    if (!part || !Array.isArray(part.rows)) return;
    const sh = sheet_(name);
    const copy = sh.copyTo(ss).setName(('Before restore ' + stamp + ' ' + name).slice(0, 99));
    copy.hideSheet();
    const idx = cols.map(c => (part.cols || []).indexOf(c));
    const rows = part.rows.filter(r => r && r[0]).map(r => idx.map(i => (i >= 0 && r[i] != null ? String(r[i]) : '')));
    const last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, Math.max(cols.length, sh.getLastColumn())).clearContent();
    if (rows.length) sh.getRange(2, 1, rows.length, cols.length).setNumberFormat('@').setValues(rows);
    counts[name] = rows.length;
  });
  logActivity_('', me.username, 'admin', 'Restored backup from ' + (data.createdAt || '?') + ' (copies of the old data kept as hidden tabs)');
  return { counts: counts, keptAs: 'Before restore ' + stamp };
}

function adminInfo_(me, pin) {
  pinOk_(me, pin);
  const props = PropertiesService.getScriptProperties();
  let scriptUrl = '';
  try { scriptUrl = ScriptApp.getService().getUrl(); } catch (e) {}
  return {
    sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(), scriptUrl: scriptUrl,
    keyOn: !!props.getProperty('BACKEND_KEY'), key: props.getProperty('BACKEND_KEY') || '',
    lastBackup: props.getProperty('LAST_BACKUP') || ''
  };
}

/** Turn the backend key on (any text of 16+ characters) or off (empty). */
function setBackendKey_(me, pin, key) {
  pinOk_(me, pin);
  key = String(key || '').trim();
  if (key && key.length < 16) throw new Error('Use at least 16 characters for the key');
  const props = PropertiesService.getScriptProperties();
  if (key) props.setProperty('BACKEND_KEY', key); else props.deleteProperty('BACKEND_KEY');
  logActivity_('', me.username, 'admin', key ? 'Backend key turned on' : 'Backend key turned off');
  return { keyOn: !!key };
}

/** If the PIN is forgotten: run this once from the Apps Script editor, then set a new PIN in the app. */
function resetAdminPin() {
  const props = PropertiesService.getScriptProperties();
  ['ADMIN_PIN', 'PIN_FAILS', 'PIN_LOCK_UNTIL'].forEach(k => props.deleteProperty(k));
  Logger.log('Backup PIN cleared. Saneed can set a new one in the app.');
}

/** If the backend key locks everyone out: run this once from the Apps Script editor. */
function turnOffBackendKey() {
  PropertiesService.getScriptProperties().deleteProperty('BACKEND_KEY');
  Logger.log('Backend key turned off.');
}

/* ============================== STAFF / ADMIN ============================== */

function listUsers_(me) {
  need_(me, 'manageStaff');
  return readAll_(SHEETS.users, USER_COLS).map(r => publicUser_(r.obj));
}

function saveUser_(me, u) {
  need_(me, 'manageStaff');
  const username = String(u.username || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!/^[a-z0-9._-]{2,30}$/.test(username)) throw new Error('Login ID must be 2–30 letters/numbers, no spaces');
  const sh = sheet_(SHEETS.users);
  const rec = findUser_(username);
  const role = u.role === 'admin' ? 'admin' : 'staff';
  if (role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can make someone admin');
  const perms = {};
  PERM_KEYS.forEach(k => { perms[k] = !!(u.perms && u.perms[k]); });
  const title = String(u.title || '').trim().slice(0, 40);
  const email = String(u.email || '').trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('That email address does not look right');

  if (rec) {
    if (rec.user.role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can change an admin');
    if (username === me.username && role !== 'admin' && me.role === 'admin' && countAdmins_() <= 1) {
      throw new Error('You are the only admin — make someone else admin first');
    }
    const row = Object.assign({}, rec.user, {
      name: u.name || rec.user.name, role: role, perms: JSON.stringify(perms), title: title, email: email,
      active: u.active === false ? 'FALSE' : 'TRUE'
    });
    if (u.password) row.passHash = hash_(username, String(u.password));
    sh.getRange(rec.row, 1, 1, USER_COLS.length).setValues([USER_COLS.map(k => row[k] || '')]);
    return publicUser_(row);
  }
  if (!u.password) throw new Error('Set a passcode for the new staff member');
  const row = {
    username: username, name: u.name || username, passHash: hash_(username, String(u.password)), role: role,
    perms: JSON.stringify(role === 'admin' ? ADMIN_PERMS : perms), active: 'TRUE', createdAt: now_(), lastLogin: '', photo: '', title: title, email: email
  };
  sh.appendRow(USER_COLS.map(k => row[k]));
  return publicUser_(row);
}

function deleteUser_(me, username) {
  need_(me, 'manageStaff');
  if (username === me.username) throw new Error('You cannot delete yourself');
  const rec = findUser_(username);
  if (!rec) throw new Error('Staff not found');
  if (rec.user.role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can delete an admin');
  sheet_(SHEETS.users).deleteRow(rec.row);
  return { username: username };
}

function resetPassword_(me, username, password) {
  need_(me, 'manageStaff');
  if (!password || String(password).length < 4) throw new Error('Passcode must be at least 4 characters');
  const rec = findUser_(username);
  if (!rec) throw new Error('Staff not found');
  if (rec.user.role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can reset an admin');
  sheet_(SHEETS.users).getRange(rec.row, USER_COLS.indexOf('passHash') + 1).setValue(hash_(username, String(password)));
  return { username: username };
}

function changePassword_(me, oldPass, newPass) {
  const rec = findUser_(me.username);
  if (rec.user.passHash !== hash_(me.username, String(oldPass || ''))) throw new Error('Current passcode is wrong');
  if (!newPass || String(newPass).length < 4) throw new Error('New passcode must be at least 4 characters');
  sheet_(SHEETS.users).getRange(rec.row, USER_COLS.indexOf('passHash') + 1).setValue(hash_(me.username, String(newPass)));
  return { ok: true };
}

/** Profile photo: a small JPEG data URL (the app resizes it to about 160px, roughly 8 KB). Empty string removes it. */
function setPhoto_(me, username, photo) {
  username = String(username || me.username).toLowerCase();
  if (username !== me.username) need_(me, 'manageStaff');
  photo = String(photo || '');
  if (photo && !/^data:image\/(jpeg|png|webp);base64,/.test(photo)) throw new Error('Invalid image');
  if (photo.length > 45000) throw new Error('Photo is too large');
  const rec = findUser_(username);
  if (!rec) throw new Error('Staff not found');
  if (rec.user.role === 'admin' && username !== me.username && me.role !== 'admin') throw new Error('Only an admin can change an admin');
  sheet_(SHEETS.users).getRange(rec.row, USER_COLS.indexOf('photo') + 1).setValue(photo);
  return { username: username, photo: photo };
}

function countAdmins_() {
  return readAll_(SHEETS.users, USER_COLS).filter(r => r.obj.role === 'admin').length;
}

/* ============================== HELPERS ============================== */

function sheet_(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }

function readAll_(name, cols) {
  const sh = sheet_(name);
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, cols.length).getDisplayValues().map((r, i) => {
    const o = {};
    cols.forEach((k, j) => { o[k] = r[j]; });
    return { row: i + 2, obj: o };
  }).filter(r => r.obj[cols[0]]);
}

function findRow_(name, cols, key, val) {
  return readAll_(name, cols).find(r => r.obj[key] === String(val)) || null;
}

function findUser_(username) {
  const r = findRow_(SHEETS.users, USER_COLS, 'username', String(username || '').toLowerCase());
  return r ? { row: r.row, user: r.obj } : null;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function now_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss");
}

function newId_(prefix) {
  return prefix + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMddHHmmss') +
    Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function label_(k) {
  return { status: 'Status', followUpDate: 'Follow-up', assignedTo: 'Assigned', priority: 'Priority' }[k] || k;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
