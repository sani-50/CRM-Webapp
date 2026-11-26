/* =====================================================================
 * BEST INDIA CRM — FRONTEND
 * Vanilla JS single-page app. Talks to Google Apps Script (or demo mock).
 * ===================================================================== */
(function () {
'use strict';

const CFG = window.CRM_CONFIG || {};
const SHOP = CFG.SHOP || { name: 'Best India Computer Shoppe', short: 'Best India' };
const localGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const localSet = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} };
const currentApiUrl = () => localGet('bicrm_api_url') || CFG.API_URL || '';
const currentApiKey = () => localGet('bicrm_api_key') || CFG.API_KEY || '';
const DEMO = !currentApiUrl();

/* ----------------------------- constants ----------------------------- */
const STATUSES = ['New', 'Follow-up', 'Pending', 'Converted', 'Closed', 'Lost'];
const OPEN = ['New', 'Follow-up', 'Pending'];
const DONE = ['Converted', 'Closed', 'Lost'];
const STATUS_CLS = { 'New': 'c-blue', 'Follow-up': 'c-orange', 'Pending': 'c-purple', 'Converted': 'c-green', 'Closed': 'c-gray', 'Lost': 'c-red' };
const STATUS_COLOR = { 'New': '#0a84ff', 'Follow-up': '#ff9f0a', 'Pending': '#bf5af2', 'Converted': '#30d158', 'Closed': '#8e8e93', 'Lost': '#ff453a' };
const SOURCES = ['Walk-in', 'Phone call', 'WhatsApp', 'Referral', 'Instagram', 'Google / Online', 'Existing customer', 'Other'];
const CATEGORIES = ['Sales', 'Service', 'Refurbished', 'AMC', 'Networking', 'CCTV', 'Lab equipment', 'Institutional', 'Enquiry', 'Other'];
const PRIORITIES = ['Normal', 'High', 'Urgent'];
const PERMS = [
  ['crm', 'Customers & follow-ups', 'CRM: customers, visits, follow-ups and reminders', 'CRM'],
  ['add', 'Add customers', 'Create new customer entries', 'Add'],
  ['edit', 'Edit customers', 'Change details, status and follow-ups', 'Edit'],
  ['viewAll', 'See everyone’s records', 'Otherwise only their own customers, sales and service jobs', 'See all'],
  ['sales', 'Sales', 'Record bills and see sales', 'Sales'],
  ['service', 'Service', 'Service jobs, repairs and site visits', 'Service'],
  ['delete', 'Delete records', 'Permanently remove customers, sales and jobs', 'Delete'],
  ['export', 'Export data', 'Download lists as CSV / reports', 'Export'],
  ['reports', 'Reports & activity', 'Insights, charts and team activity log', 'Reports'],
  ['dashboard', 'Business dashboard', 'Shop-wide revenue, sales and service overview', 'Dashboard'],
  ['performance', 'Staff performance', 'Employee evaluation, ratings and punctuality', 'Performance'],
  ['accounts', 'Debtors & creditors', 'Money to collect from customers and pay to suppliers', 'Accounts'],
  ['happycalls', 'Happy calls', 'Feedback calls to new customers within 7 days', 'Happy calls'],
  ['advances', 'Salary advances (all staff)', 'See everyone’s salary advance requests and approve them', 'Advances'],
  ['manageStaff', 'Manage staff', 'Add, edit and remove staff and their access', 'Staff']
];
const PERM_KEYS = PERMS.map(p => p[0]);
const permSet = list => Object.fromEntries(PERM_KEYS.map(k => [k, list.includes(k)]));
const ROLE_TPL = {
  'Operations Manager': { admin: true }, 'Chairman': { admin: true },
  'Senior Accountant': { perms: permSet(PERM_KEYS.filter(k => k !== 'manageStaff')) },
  'Store Manager': { perms: permSet(PERM_KEYS.filter(k => k !== 'manageStaff' && k !== 'advances')) },
  'Sales': { perms: permSet(['crm', 'add', 'edit', 'viewAll', 'sales', 'service']) },
  'Call Centre': { perms: permSet(['crm', 'add', 'edit', 'viewAll', 'sales', 'service', 'happycalls']) },
  'Outdoor Engineer': { perms: permSet(['service']) },
  'Indoor Engineer': { perms: permSet(['service']) }
};
const SESSION_HOURS = 2;
// Demo mode only (no Google Sheet connected): one-tap sign-in for trying each role.
const DEMO_USERS = [['shaneer', '1234', 'Chairman'], ['saneed', '8321', 'Ops manager'], ['midhila', '1234', 'Accountant'], ['deepak', '1234', 'Store manager'], ['shylesh', '1234', 'Sales'], ['sona', '1234', 'Call centre'], ['nikhil', '1234', 'Engineer'], ['safwan', '1234', 'Engineer']];

const JOB_STATUSES = ['Received', 'Diagnosing', 'Waiting for parts', 'In progress', 'Ready', 'Delivered', 'Cancelled'];
const JOB_OPEN = ['Received', 'Diagnosing', 'Waiting for parts', 'In progress', 'Ready'];
const JOB_CLS = { 'Received': 'c-blue', 'Diagnosing': 'c-purple', 'Waiting for parts': 'c-orange', 'In progress': 'c-teal', 'Ready': 'c-green', 'Delivered': 'c-gray', 'Cancelled': 'c-red' };
const JOB_COLOR = { 'Received': '#0a84ff', 'Diagnosing': '#bf5af2', 'Waiting for parts': '#ff9f0a', 'In progress': '#30b0c7', 'Ready': '#30d158', 'Delivered': '#8e8e93', 'Cancelled': '#ff453a' };
const DEVICES = ['Laptop', 'Desktop', 'Printer', 'Monitor', 'UPS', 'CCTV', 'Networking', 'Mobile / Tablet', 'Other'];
const SALE_CATS = ['Laptop', 'Desktop', 'Accessories', 'Printer', 'CCTV', 'Networking', 'Refurbished', 'Software', 'AMC', 'Other'];
const PAY_MODES = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Credit'];
const AV_COLORS = ['#0a84ff', '#5e5ce6', '#bf5af2', '#ff375f', '#ff9f0a', '#30b0c7', '#34c759', '#ac8e68', '#ff6b35', '#64d2ff'];

const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><path d="M16 3.5a4 4 0 0 1 0 9M22 21c0-3-1.8-5.6-4.5-6.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.5 8 9.5 4.6-1 8-4.5 8-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.5A8.4 8.4 0 1 1 21 11.5z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  store: '<path d="M3 9h18l-1.5-5h-15z"/><path d="M4 9v11h16V9M9 20v-6h6v6"/>',
  note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-6"/>',
  userPlus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7M19 8v6M16 11h6"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  flag: '<path d="M4 22V4s1.5-1 5-1 5 2 8 2 3-1 3-1v11s-1 1-3 1-5-2-8-2-5 1-5 1"/>',
  camera: '<path d="M4 8a2 2 0 0 1 2-2h1.5l1.5-2h6l1.5 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  pdf: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 15h1.5a1.5 1.5 0 0 0 0-3H8v5M13 12v5h1a2.5 2.5 0 0 0 0-5zM18 12h-2v5M16 14.5h1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 12h11l2-8H6.3"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a9.5 9.5 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  rupee: '<path d="M6 4h12M6 8.5h12M8 4c4 0 6.5 1.6 6.5 4.5S12 13 8 13h-1l8 7"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  in: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>',
  out: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'
};
const ico = (n, cls) => `<svg class="ico ${cls || ''}" viewBox="0 0 24 24">${I[n] || ''}</svg>`;

/* ------------------------------- utils ------------------------------- */
const $ = s => document.querySelector(s);
const h = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (n, from) => { const d = from ? new Date(from + 'T00:00:00') : new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const parse = s => { if (!s) return null; const d = new Date(String(s).length <= 10 ? s + 'T00:00:00' : s); return isNaN(d) ? null : d; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function fmtTime(d) { let hh = d.getHours(); const ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12; return `${hh}:${pad(d.getMinutes())} ${ap}`; }
function fmtDate(s, withYear) { const d = parse(s); if (!d) return '—'; return `${d.getDate()} ${MON[d.getMonth()]}${withYear || d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}`; }
function fmtDT(s) { const d = parse(s); if (!d) return '—'; return `${fmtDate(s)}, ${fmtTime(d)}`; }
function rel(s) {
  const d = parse(s); if (!d) return '—';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (ymd(d) === ymd()) return 'Today, ' + fmtTime(d);
  if (ymd(d) === addDays(-1)) return 'Yesterday, ' + fmtTime(d);
  return fmtDT(s);
}
function relDay(dateStr) {
  const t = ymd(); if (!dateStr) return '';
  if (dateStr === t) return 'Today';
  if (dateStr === addDays(1)) return 'Tomorrow';
  if (dateStr === addDays(-1)) return 'Yesterday';
  const diff = Math.round((parse(dateStr) - parse(t)) / 86400000);
  if (diff < 0) return `${-diff} days overdue`;
  if (diff < 7) return DAYS[parse(dateStr).getDay()];
  return fmtDate(dateStr);
}
const digits = s => String(s || '').replace(/\D/g, '');
const last10 = s => digits(s).slice(-10);
function fmtPhone(p) { const d = digits(p); if (d.length === 10) return d.slice(0, 5) + ' ' + d.slice(5); return p || ''; }
function waLink(p) { let d = digits(p); if (d.length === 10) d = '91' + d; return 'https://wa.me/' + d; }
function initials(n) { const p = String(n || '?').trim().split(/\s+/); return ((p[0] || '')[0] + ((p[1] || '')[0] || '')).toUpperCase() || '?'; }
function avColor(s) { let x = 0; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return AV_COLORS[x % AV_COLORS.length]; }
const avatar = (name, cls, key) => `<div class="avatar ${cls || ''}" style="background:${avColor(key || name)}">${h(initials(name))}</div>`;
function findStaff(u) { return (State.me && State.me.username === u ? State.me : null) || State.staff.find(x => x.username === u) || State.users.find(x => x.username === u) || null; }
function staffAv(username, cls, fallbackName) {
  const u = findStaff(username); const name = (u && u.name) || fallbackName || username;
  if (u && u.photo) return `<div class="avatar ${cls || ''} has-photo"><img src="${h(u.photo)}" alt=""></div>`;
  return avatar(name, cls, username);
}
const statusBadge = s => `<span class="badge ${STATUS_CLS[s] || 'c-gray'}"><i></i>${h(s || '—')}</span>`;
const money = v => { const n = Number(digits(v)); return n ? '₹' + n.toLocaleString('en-IN') : ''; };
const greeting = () => { const hr = new Date().getHours(); return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'; };
const staffName = u => { if (!u) return '—'; const s = State.staff.find(x => x.username === u); return s ? s.name : u; };
const num = v => Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')) || 0;
const inR = (s, R) => { const x = String(s || '').slice(0, 10); return !!x && x >= R.from && x <= R.to; };
const jobBadge = s => `<span class="badge ${JOB_CLS[s] || 'c-gray'}"><i></i>${h(s || '—')}</span>`;
const saleBal = s => Math.max(0, num(s.amount) - num(s.paid));
const jobBal = j => j.status === 'Delivered' ? Math.max(0, num(j.charge) - num(j.paid)) : 0;
const jobOverdue = j => JOB_OPEN.includes(j.status) && j.status !== 'Ready' && j.dueDate && j.dueDate < ymd();
const roleLabel = u => (u && (u.title || (u.role === 'admin' ? 'Administrator' : 'Staff'))) || '';
const MONTHS_L = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Date ranges shared by dashboard, performance, sales and reports. */
function rangeFor(period, from, to) {
  const t = ymd(); const d = new Date();
  switch (period) {
    case 'today': return { from: t, to: t, label: 'Today, ' + fmtDate(t, true) };
    case 'yesterday': { const y = addDays(-1); return { from: y, to: y, label: 'Yesterday, ' + fmtDate(y, true) }; }
    case 'thisweek': { const off = (d.getDay() + 6) % 7; return { from: addDays(-off), to: t, label: `This week (${fmtDate(addDays(-off))} – ${fmtDate(t, true)})` }; }
    case 'lastweek': { const off = (d.getDay() + 6) % 7 + 7; return { from: addDays(-off), to: addDays(-off + 6), label: `Last week (${fmtDate(addDays(-off))} – ${fmtDate(addDays(-off + 6), true)})` }; }
    case 'week': return { from: addDays(-6), to: t, label: `Last 7 days (${fmtDate(addDays(-6))} – ${fmtDate(t, true)})` };
    case '30': return { from: addDays(-29), to: t, label: `Last 30 days (${fmtDate(addDays(-29))} – ${fmtDate(t, true)})` };
    case 'lastmonth': { const s = new Date(d.getFullYear(), d.getMonth() - 1, 1), e = new Date(d.getFullYear(), d.getMonth(), 0); return { from: ymd(s), to: ymd(e), label: MONTHS_L[s.getMonth()] + ' ' + s.getFullYear() }; }
    case 'year': { const fy = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return { from: `${fy}-04-01`, to: t, label: `FY ${fy}-${String(fy + 1).slice(2)} (to date)` }; }
    case 'all': return { from: '2000-01-01', to: '9999-12-31', label: 'All time' };
    case 'custom': { const f = from || addDays(-30), e = to || t; return { from: f <= e ? f : e, to: f <= e ? e : f, label: `${fmtDate(f <= e ? f : e, true)} – ${fmtDate(f <= e ? e : f, true)}` }; }
    default: return { from: ymd(new Date(d.getFullYear(), d.getMonth(), 1)), to: t, label: MONTHS_L[d.getMonth()] + ' ' + d.getFullYear() };
  }
}
/** The same-length period just before R (for "vs previous" comparisons). */
function prevRange(R) {
  const a = parse(R.from), b = parse(R.to > ymd() ? ymd() : R.to); const n = Math.round((b - a) / 86400000) + 1;
  return { from: addDays(-n, R.from), to: addDays(-1, R.from) };
}
const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

function toast(msg, err) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.innerHTML = (err ? ico('alert', 'sm') : ico('check', 'sm')) + `<span>${h(msg)}</span>`;
  $('#toast-root').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(-8px)'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/* -------------------------------- API -------------------------------- */
async function api(action, payload) {
  const body = Object.assign({ action, token: State.token, key: currentApiKey() }, payload || {});
  let res;
  if (DEMO) {
    try { res = { ok: true, data: await MockServer.call(body) }; } catch (e) { res = { ok: false, error: e.message }; }
  } else {
    if (action !== 'login') setSync('syncing');
    try {
      const r = await fetch(currentApiUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), redirect: 'follow' });
      res = await r.json();
      if (action !== 'login') setSync('ok');
    } catch (e) {
      const msg = navigator.onLine ? 'Cannot reach Google Sheets. Check the Apps Script URL/deployment.' : 'No internet connection.';
      setSync('error', msg);
      throw new Error(msg);
    }
  }
  if (!res.ok) {
    if (String(res.error).startsWith('AUTH:')) { if (action !== 'login') { logout(true); } throw new Error(res.error.replace('AUTH: ', '')); }
    throw new Error(res.error || 'Something went wrong');
  }
  return res.data;
}

async function busy(btn, fn) {
  if (!btn) return fn();
  const html = btn.innerHTML; btn.disabled = true;
  btn.innerHTML = `<span class="spinner${btn.classList.contains('btn-primary') || btn.classList.contains('btn-dark') ? '' : ' dark'}"></span>`;
  try { return await fn(); } finally { if (btn.isConnected) { btn.disabled = false; btn.innerHTML = html; } }
}

/* ------------------------------- state ------------------------------- */
const State = {
  token: ls.get('bicrm_token', ''),
  me: ls.get('bicrm_me', null),
  loginAt: ls.get('bicrm_login_at', 0),
  customers: [], staff: [], users: [], sales: [], jobs: [], credits: [], advances: [], tasks: [],
  view: '', q: '', status: 'Open', assignee: '', period: 'all', fuScope: 'mine', adminTab: 'staff',
  limit: 60, openId: null, activity: {}, logo: 'logo.png', loaded: false, lastSync: null,
  sync: { st: 'idle', at: null, msg: '' }, rp: { period: 'month', from: '', to: '', staff: '' },
  sf: { period: 'month', staff: '', q: '', limit: 60 },
  jf: { status: 'Open', type: '', eng: '', q: '', limit: 60 },
  dash: { period: 'month' },
  df: { age: '', q: '', sort: 'amount' }, cf: { status: 'unpaid', q: '', sort: 'due' }, af: { status: '', staff: '' },
  hf: { tab: 'todo' }, tf: { tab: 'mine', status: 'open' },
  onDate: '', dayVisits: {},
  perf: { period: 'month', sort: 'score', acts: null, key: '', loading: false, all: false }
};
const can = p => State.me && (State.me.role === 'admin' || (State.me.perms && State.me.perms[p]));
const isAdmin = () => State.me && State.me.role === 'admin';
const canManage = () => can('manageStaff') || can('reports') || can('export');
/** Chairman gets a very simple layout (six big sections). Anyone can switch it from the profile menu. */
const simpleMode = () => !!State.me && ls.get('bicrm_simple_' + State.me.username, /chairman/i.test(State.me.title || ''));
const seesAll = () => isAdmin() || can('viewAll') || can('dashboard');

function applyTheme() {
  const t = ls.get('bicrm_theme', '');
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* --------------------------- derived data ---------------------------- */
const needsFU = c => !!c.followUpDate && !DONE.includes(c.status);
const isMine = c => c.assignedTo === State.me.username || (!c.assignedTo && c.createdBy === State.me.username);
// Reminders, notifications and badges are personal: only follow-ups assigned to (or added by) this person.
const inScope = c => isMine(c);

function fuBuckets(scopeFn) {
  const t = ymd();
  const list = State.customers.filter(c => needsFU(c) && scopeFn(c));
  const overdue = list.filter(c => c.followUpDate < t).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  const today = list.filter(c => c.followUpDate === t);
  const upcoming = list.filter(c => c.followUpDate > t).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  return { overdue, today, upcoming };
}

function notifications() {
  const t = ymd(); const out = [];
  const { overdue, today, upcoming } = fuBuckets(inScope);
  overdue.forEach(c => out.push({ key: `od:${c.id}:${c.followUpDate}:${t}`, cid: c.id, ico: 'alert', cls: 'c-red', title: `Overdue: ${c.name}`, sub: `Follow-up was due ${fmtDate(c.followUpDate)} · ${c.requirement || c.category || ''}`, when: c.followUpDate }));
  today.forEach(c => out.push({ key: `td:${c.id}:${c.followUpDate}`, cid: c.id, ico: 'bell', cls: 'c-orange', title: `Follow up today: ${c.name}`, sub: `${fmtPhone(c.phone)} · ${c.requirement || c.category || ''}`, when: t }));
  upcoming.filter(c => c.followUpDate === addDays(1)).forEach(c => out.push({ key: `tm:${c.id}:${c.followUpDate}`, cid: c.id, ico: 'cal', cls: 'c-blue', title: `Tomorrow: ${c.name}`, sub: c.requirement || c.category || '', when: c.followUpDate }));
  const since = Date.now() - 3 * 86400000;
  State.customers.filter(c => c.assignedTo === State.me.username && c.updatedBy && c.updatedBy !== State.me.username && (parse(c.updatedAt) || 0) > since)
    .forEach(c => out.push({ key: `as:${c.id}:${c.updatedAt}`, cid: c.id, ico: 'userPlus', cls: 'c-purple', title: `${staffName(c.updatedBy)} updated ${c.name}`, sub: `Assigned to you · ${c.status}`, when: c.updatedAt }));
  const me0 = State.me.username;
  State.tasks.filter(t => t.assignedTo === me0 && t.status !== 'Done').forEach(t => out.push({ key: `tk:${t.id}:${t.remindedAt || t.createdAt}`, cid: t.id, ico: t.remindedAt ? 'bell' : 'check',
    cls: PRI_CLS[t.priority] || 'c-blue', title: `${t.remindedAt ? 'Reminder' : 'New task'} from ${staffName(t.assignedBy)}: ${t.title}`,
    sub: `${t.priority} priority${t.dueDate ? ' · finish by ' + fmtDate(t.dueDate) : ''}${t.status === 'In progress' ? ' · in progress' : ''}`, when: t.remindedAt || t.createdAt }));
  State.tasks.filter(t => t.assignedBy === me0 && t.updatedBy === t.assignedTo && t.updatedBy !== me0 && (parse(t.updatedAt) || 0) > since)
    .forEach(t => out.push({ key: `tu:${t.id}:${t.updatedAt}`, cid: t.id, ico: t.status === 'Done' ? 'check' : 'note', cls: t.status === 'Done' ? 'c-green' : 'c-blue',
      title: `${staffName(t.assignedTo)} ${t.status === 'Done' ? 'finished' : 'updated'}: ${t.title}`, sub: t.lastNote || t.status, when: t.updatedAt }));
  if (can('happycalls')) { const hc = happyList().filter(c => c.happyStatus !== 'Done' && daysAgo(c.createdAt) <= HAPPY_DAYS);
    if (hc.length) out.push({ key: `hc:${t}:${hc.length}`, cid: 'go:happy', ico: 'phone', cls: 'c-yellow', title: `${hc.length} happy call${hc.length > 1 ? 's' : ''} to make`, sub: `${hc.filter(c => happyDue(c) <= t).length} on their last day today`, when: t }); }
  if (can('dashboard')) State.customers.filter(c => c.happyRating === 'Unhappy' && (parse(c.happyAt) || 0) > since)
    .forEach(c => out.push({ key: `uh:${c.id}:${c.happyAt}`, cid: c.id, ico: 'alert', cls: 'c-red', title: `Unhappy customer: ${c.name}`, sub: c.happyNote || `Feedback call by ${staffName(c.happyBy)}`, when: c.happyAt }));
  if (State.me.advPay) State.advances.filter(a => a.status === 'Approved').forEach(a => out.push({ key: `ap:${a.id}`, cid: a.id, ico: 'rupee', cls: 'c-blue',
    title: `Approved advance to pay: ${a.name}`, sub: `${rupees(num(a.amount))} for ${a.month} · approved by ${staffName(a.decidedBy)}`, when: a.decidedAt }));
  if (State.me.advApprove) State.advances.filter(a => a.status === 'Pending').forEach(a => out.push({ key: `av:${a.id}`, cid: a.id, ico: 'rupee', cls: 'c-yellow',
    title: `Salary advance request: ${a.name}`, sub: `${rupees(num(a.amount))} for ${a.month}${a.reason ? ' · ' + a.reason : ''}`, when: a.createdAt }));
  State.advances.filter(a => a.username === State.me.username && a.decidedAt && a.status !== 'Pending' && (parse(a.decidedAt) || 0) > since)
    .forEach(a => out.push({ key: `ad:${a.id}:${a.status}`, cid: a.id, ico: 'rupee', cls: ADV_CLS[a.status], title: `Your salary advance was ${a.status.toLowerCase()}`, sub: `${rupees(num(a.amount))} for ${a.month}`, when: a.decidedAt }));
  if (can('service')) {
    State.jobs.filter(j => j.assignedTo === State.me.username && JOB_OPEN.includes(j.status) && j.status !== 'Ready' && j.dueDate && j.dueDate <= t)
      .forEach(j => out.push({ key: `jb:${j.id}:${j.dueDate}:${j.dueDate < t ? t : ''}`, cid: j.id, ico: 'wrench', cls: j.dueDate < t ? 'c-red' : 'c-orange',
        title: `${j.dueDate < t ? 'Job overdue' : 'Job due today'}: ${j.jobNo} · ${j.customerName}`, sub: `${j.device || ''} · ${j.problem || ''}`, when: j.dueDate }));
    State.jobs.filter(j => j.assignedTo === State.me.username && j.createdBy !== State.me.username && j.status === 'Received' && (parse(j.createdAt) || 0) > since)
      .forEach(j => out.push({ key: `jn:${j.id}`, cid: j.id, ico: 'userPlus', cls: 'c-purple', title: `New job for you: ${j.jobNo}`, sub: `${j.customerName} · ${j.device || ''} · ${j.problem || ''}`, when: j.createdAt }));
  }
  return out;
}
const readKey = () => 'bicrm_read_' + (State.me ? State.me.username : '');
const unreadCount = () => { const r = ls.get(readKey(), []); return notifications().filter(n => !r.includes(n.key)).length; };

/* ----------------------------- overlays ------------------------------ */
const stack = [];
/*
 * Phone / browser Back button:
 *  - every popup, drawer or menu adds one step to the browser history, so Back closes it;
 *  - every section (Sales, Service…) adds one step (#sales), so Back returns to the previous section;
 *  - only from the first screen does Back leave the app.
 * When a popup is closed with its own button, its history step is removed quietly (ignorePop).
 */
let ovSeq = 0, ignorePop = 0;
const pendingPush = [];
function pushOverlayStep(id) {
  try { if (ignorePop > 0) pendingPush.push(id); else history.pushState({ ov: id }, ''); } catch (e) {}
}
function openOverlay(html, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'scrim ' + (opts.cls || '');
  wrap.innerHTML = html;
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) closeOverlay(); });
  $('#overlay-root').appendChild(wrap);
  const ovId = ++ovSeq;
  stack.push({ el: wrap, onClose: opts.onClose, id: ovId });
  pushOverlayStep(ovId);
  document.body.style.overflow = 'hidden';
  const f = wrap.querySelector('[autofocus]'); if (f && matchMedia('(min-width: 901px)').matches) setTimeout(() => f.focus(), 60);
  return wrap;
}
function closeOverlay(all, fromBack) {
  let steps = 0;
  const doOne = () => {
    const top = stack.pop(); if (!top) return;
    top.el.classList.add('closing');
    setTimeout(() => top.el.remove(), 190);
    const pend = pendingPush.indexOf(top.id);
    if (pend >= 0) pendingPush.splice(pend, 1); else steps++;
    if (top.onClose) top.onClose();
  };
  if (all) while (stack.length) doOne(); else doOne();
  if (!stack.length) document.body.style.overflow = '';
  // closed with a button (not with Back): take its step(s) out of the history too
  if (fromBack) steps--;
  if (steps > 0) { ignorePop++; try { history.go(-steps); } catch (e) { ignorePop--; } }
}
window.addEventListener('popstate', () => {
  if (ignorePop > 0) {
    ignorePop--;
    pendingPush.splice(0).forEach(id => { try { history.pushState({ ov: id }, ''); } catch (e) {} });
    return;
  }
  if (stack.length) { closeOverlay(false, true); return; }
  if (!State.loaded || !State.me) return;
  const v = allowedView(location.hash.slice(1) || (navItems()[0] || ['home'])[0]);
  if (v !== State.view) { State.view = v; State.limit = 60; renderView(); window.scrollTo({ top: 0 }); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length) closeOverlay(); });

function modal({ title, sub, body, foot, cls }) {
  return `<div class="modal ${cls || ''}" role="dialog"><div class="grabber"></div>
    <div class="modal-head"><div style="flex:1"><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button class="close-x" onclick="App.close()">${ico('x', 'sm')}</button></div>
    <div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
}

function confirmBox(title, text, okLabel, danger) {
  return new Promise(resolve => {
    let done = false;
    const el = openOverlay(modal({ title: h(title), body: `<p class="muted" style="margin:0 0 8px">${h(text)}</p>`, cls: 'narrow',
      foot: `<button class="btn btn-ghost" data-r="0">Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1">${h(okLabel || 'OK')}</button>` }),
      { onClose: () => { if (!done) resolve(false); } });
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { done = true; resolve(b.dataset.r === '1'); closeOverlay(); });
  });
}

/* ------------------------------- brand ------------------------------- */
const brandMark = () => State.logo ? `<div class="brand-mark has-logo"><img src="${State.logo}" alt="Best IND"></div>` : `<div class="brand-mark"><img src="icon.svg" alt=""></div>`;
const brandRow = () => `<div class="brand-row">${brandMark()}<div class="brand-name">${h(SHOP.short || 'Best India')}<small>${h(SHOP.tagline || 'CRM')}</small></div></div>`;

/* =============================== LOGIN =============================== */
function renderLogin() {
  $('#app').innerHTML = `
  <div class="login">
    <section class="login-hero">
      <div class="orb a"></div><div class="orb b"></div><div class="orb c"></div>
      ${brandRow()}
      <div class="hero-copy">
        <h1>Every customer.<br><span class="grad">Never forgotten.</span></h1>
        <p>${h(SHOP.name)} — visits, follow-ups and service calls, all in one place.</p>
      </div>
      <div class="foot">${h(SHOP.address || '')}</div>
    </section>
    <section class="login-pane">
      <form class="login-card" id="login-form" autocomplete="on">
        ${brandRow()}
        <h2>Sign in</h2>
        <p class="sub">Use your staff ID and passcode. Each sign-in lasts ${SESSION_HOURS} hours.</p>
        <label class="field"><span>Staff ID</span><input class="input lg" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="e.g. deepak" required></label>
        <label class="field"><span>Passcode</span><input class="input lg" name="password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••" required></label>
        <div id="login-err" class="hint err hidden" style="margin:4px 2px 14px"></div>
        <button class="btn btn-primary btn-block" type="submit" style="margin-top:8px">Continue</button>
        <div class="conn-pill busy" id="conn-pill"><i class="dot"></i><span>Checking Google Sheets…</span></div>
        ${DEMO ? `<div class="demo-logins"><b>Demo: tap a person to sign in as them</b><div class="chips">${DEMO_USERS.map(([u, p, t]) => `<button type="button" class="chip" data-u="${u}" data-p="${p}">${u[0].toUpperCase() + u.slice(1)} <span class="n">${t}</span></button>`).join('')}</div></div>` : ''}
      </form>
    </section>
  </div>`;
  checkConnection();
  const form = $('#login-form');
  form.querySelectorAll('.demo-logins [data-u]').forEach(c => c.onclick = () => { form.username.value = c.dataset.u; form.password.value = c.dataset.p; form.requestSubmit(); });
  form.onsubmit = async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const err = $('#login-err'); err.classList.add('hidden');
    try {
      const d = await busy(btn, () => api('login', { username: form.username.value, password: form.password.value }));
      State.token = d.token; State.me = d.user; State.loginAt = d.loginAt || Date.now();
      ls.set('bicrm_token', d.token); ls.set('bicrm_me', d.user); ls.set('bicrm_login_at', State.loginAt);
      await boot(true);
    } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
  };
}

function logout(expired, msg) {
  State.vault = null;
  State.histReady = false;
  State.token = ''; State.me = null; State.customers = []; State.sales = []; State.jobs = []; State.credits = []; State.advances = []; State.tasks = []; State.dayVisits = {}; State.loaded = false; State.view = '';
  State.perf.acts = null; State.perf.key = ''; State.activity = {};
  ls.set('bicrm_token', ''); ls.set('bicrm_me', null); ls.set('bicrm_login_at', 0);
  try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
  dataSig = '';
  closeOverlay(true);
  clearInterval(State.poll);
  renderLogin();
  if (expired) toast(msg || 'Session ended — please sign in again', true);
}
const sessionOver = () => !State.loginAt || Date.now() - State.loginAt > SESSION_HOURS * 3600 * 1000;

/* =============================== SHELL =============================== */
function navItems() {
  const items = [];
  if (simpleMode()) {
    items.push(['overview', 'home', 'Home']);
    if (can('sales')) items.push(['sales', 'cart', 'Sales']);
    if (can('service')) items.push(['service', 'wrench', 'Service']);
    if (can('performance')) items.push(['performance', 'trophy', 'Staff']);
    if (can('crm')) items.push(['customers', 'users', 'Customers']);
    if (can('accounts')) items.push(['debtors', 'in', 'Debtors'], ['creditors', 'out', 'Creditors']);
    if (can('advances')) items.push(['advances', 'rupee', 'Salary advances']);
    items.push(['tasks', 'check', 'Tasks']);
    return items;
  }
  if (can('dashboard')) items.push(['dashboard', 'gauge', 'Dashboard']);
  if (can('crm')) items.push(['home', 'home', 'Today'], ['customers', 'users', 'Customers'], ['followups', 'cal', 'Follow-ups']);
  if (can('sales')) items.push(['sales', 'cart', 'Sales']);
  if (can('service')) items.push(['service', 'wrench', can('viewAll') || isAdmin() ? 'Service' : 'My jobs']);
  if (can('accounts')) items.push(['debtors', 'in', 'Debtors'], ['creditors', 'out', 'Creditors']);
  if (can('performance')) items.push(['performance', 'trophy', 'Staff performance']);
  items.push(['tasks', 'check', 'Tasks']);
  if (can('happycalls')) items.push(['happy', 'phone', 'Happy calls']);
  if (can('advances') || canRequestAdvance()) items.push(['advances', 'rupee', can('advances') ? 'Salary advances' : 'Salary advance']);
  if (canManage()) items.push(['admin', 'shield', isAdmin() ? 'Admin' : 'Manage']);
  return items;
}
function createOptions() {
  const o = [];
  if (simpleMode()) return o;
  if (can('crm') && can('add')) o.push(['customer', 'users', 'New customer', 'Walk-in, call or enquiry']);
  if (can('sales')) o.push(['sale', 'cart', 'New sale', 'Record a bill']);
  if (can('service')) o.push(['job', 'wrench', 'New service job', 'Repair or site visit']);
  return o;
}
function quickAdd(anchor) {
  const o = createOptions();
  if (o.length === 1) return startCreate(o[0][0]);
  if (!o.length) return;
  const wrap = openOverlay(`<div class="popover qa-pop"><div class="grabber"></div><div class="popover-head"><h3>Add new</h3></div>
    <div class="popover-body">${o.map(([k, i, l, s]) => `<button class="notif" data-k="${k}"><div class="n-ico ${k === 'sale' ? 'c-green' : k === 'job' ? 'c-teal' : 'c-blue'}">${ico(i, 'sm')}</div><div><b>${l}</b><small>${s}</small></div></button>`).join('')}</div></div>`, { cls: 'pop-scrim' });
  wrap.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { closeOverlay(); startCreate(b.dataset.k); });
}
function startCreate(k) {
  if (k === 'customer') return App.newCustomer();
  if (k === 'sale') return saleForm(null);
  if (k === 'job') return jobForm(null);
}
function moreMenu() {
  const items = navItems().slice(tabSplit().primary.length);
  const wrap = openOverlay(`<div class="popover qa-pop"><div class="grabber"></div><div class="popover-head"><h3>More</h3></div>
    <div class="popover-body">${items.map(([v, i, l]) => `<button class="notif" data-v="${v}"><div class="n-ico c-blue">${ico(i, 'sm')}</div><div style="align-self:center"><b>${l}</b></div></button>`).join('')}
    <button class="notif" data-v="__notifs"><div class="n-ico c-orange">${ico('bell', 'sm')}</div><div style="align-self:center"><b>Notifications</b></div></button></div></div>`, { cls: 'pop-scrim' });
  wrap.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { closeOverlay(); if (b.dataset.v === '__notifs') showNotifs(); else App.go(b.dataset.v); });
}
function tabSplit() {
  const items = navItems(); const slots = createOptions().length ? 4 : 5;
  if (items.length <= slots) return { primary: items, more: false };
  return { primary: items.slice(0, slots - 1), more: true };
}

function renderShell() {
  const me = State.me;
  const fuCount = (() => { const b = fuBuckets(inScope); return b.overdue.length + b.today.length; })();
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      ${brandRow()}
      <nav class="nav" id="side-nav">
        ${navItems().map(([v, i, l]) => `<button class="nav-item ${State.view === v ? 'on' : ''}" data-v="${v}" onclick="App.go('${v}')">${ico(i)}<span>${l}</span>${v === 'followups' && fuCount ? `<span class="count-badge badge">${fuCount}</span>` : ''}${v === 'tasks' && myOpenTasks().length ? `<span class="count-badge badge" data-tasks>${myOpenTasks().length}</span>` : ''}</button>`).join('')}
      </nav>
      ${createOptions().length ? `<button class="btn btn-primary add-cta" onclick="App.quickAdd(this)">${ico('plus', 'sm')} ${createOptions().length === 1 ? createOptions()[0][2] : 'New'}</button>` : ''}
      <div class="sidebar-foot">
        <button class="me-row" onclick="App.meMenu(this)">${staffAv(me.username, '', me.name)}<div style="flex:1;min-width:0"><b>${h(me.name)}</b><small>${h(roleLabel(me))}</small></div>${ico('more', 'sm')}</button>
        <button class="signout-row" onclick="App.signOut()">${ico('logout', 'sm')} Sign out</button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="mob-brand">${brandMark()}<b>${h(SHOP.short || 'Best India')}</b></div>
        <label class="search" id="top-search-wrap">${ico('search', 'sm')}<input id="top-search" placeholder="Search…" value="${h(State.q)}" oninput="App.search(this.value)"></label>
        <div class="spacer"></div>
        <button class="sync-btn" id="sync-btn" onclick="App.syncNow()"></button>
        <button class="icon-btn" id="bell" title="Notifications" onclick="App.notifs()">${ico('bell')}</button>
        <button class="icon-btn signout-btn" title="Sign out" aria-label="Sign out" onclick="App.signOut()">${ico('logout')}</button>
        <button class="icon-btn mob-only" onclick="App.meMenu(this)" style="padding:2px">${staffAv(me.username, 'sm', me.name)}</button>
      </header>
      <main class="content" id="view"></main>
    </div>
    <nav class="tabbar" id="tabbar"></nav>
  </div>`;
  renderTabbar();
  updateBell();
  paintSync();
  renderView();
}

function renderTabbar() {
  const tb = $('#tabbar'); if (!tb) return;
  const fu = fuBuckets(inScope); const n = fu.overdue.length + fu.today.length;
  const myJobs = State.jobs.filter(j => j.assignedTo === State.me.username && jobOverdue(j)).length;
  const dots = { followups: n, service: myJobs, tasks: myOpenTasks().length, happy: can('happycalls') ? happyList().filter(c => c.happyStatus !== 'Done' && daysAgo(c.createdAt) <= HAPPY_DAYS && happyDue(c) <= ymd()).length : 0 };
  const { primary, more } = tabSplit();
  const tab = ([v, i, l]) => `<button class="${State.view === v || (v === 'admin' && State.view === 'reports' && !primary.find(p => p[0] === 'reports')) ? 'on' : ''}" onclick="App.go('${v}')">${ico(i)}${l}${dots[v] ? `<span class="dot">${dots[v]}</span>` : ''}</button>`;
  const add = createOptions().length ? `<button class="tab-add" onclick="App.quickAdd(this)"><span class="plus">${ico('plus')}</span></button>` : '';
  const inMore = more && !primary.find(p => p[0] === State.view);
  const tail = more ? `<button class="${inMore ? 'on' : ''}" onclick="App.more_()">${ico('grid')}More</button>` : (primary.length < 4 ? `<button onclick="App.notifs()">${ico('bell')}Alerts</button>` : '');
  const all = primary.map(tab).concat(tail ? [tail] : []);
  const mid = Math.ceil(all.length / 2);
  tb.innerHTML = all.slice(0, mid).join('') + add + all.slice(mid).join('');
}
function allowedView(v) { const items = navItems(); return items.find(x => x[0] === v) ? v : (items[0] || ['home'])[0]; }

function updateBell() {
  const n = unreadCount();
  const b = $('#bell'); if (!b) return;
  const had = b.querySelector('.bell-dot');
  b.innerHTML = ico('bell') + (n ? `<span class="bell-dot">${n > 99 ? '99+' : n}</span>` : '');
  if (n && !had) { const svg = b.querySelector('svg'); svg.classList.add('bell-ring'); }
  // sidebar badge
  const fu = fuBuckets(inScope); const c = fu.overdue.length + fu.today.length;
  const it = document.querySelector('#side-nav [data-v="followups"]');
  if (it) { const old = it.querySelector('.count-badge'); if (old) old.remove(); if (c) it.insertAdjacentHTML('beforeend', `<span class="count-badge badge">${c}</span>`); }
}

function renderView() {
  const v = $('#view'); if (!v) return;
  State.view = allowedView(State.view);
  // one history step per section, so the Back button walks back through them
  try {
    if (!State.histReady) { history.replaceState(null, '', '#' + State.view); State.histReady = true; }
    else if (location.hash.slice(1) !== State.view) history.pushState(null, '', '#' + State.view);
  } catch (e) {}
  document.querySelectorAll('#side-nav .nav-item').forEach(b => b.classList.toggle('on', b.dataset.v === State.view));
  renderTabbar();
  const fn = { home: viewHome, customers: viewCustomers, followups: viewFollowups, admin: viewAdmin,
    dashboard: viewDashboard, sales: viewSales, service: viewService, performance: viewPerformance,
    overview: viewOverview, debtors: viewDebtors, creditors: viewCreditors, advances: viewAdvances, happy: viewHappy, tasks: viewTasks }[State.view] || viewHome;
  // the top search box searches whatever module is open
  const ts = $('#top-search'), tw = $('#top-search-wrap');
  if (ts) {
    const mode = ['sales', 'service', 'debtors', 'creditors'].includes(State.view) ? State.view : can('crm') ? 'crm' : '';
    tw.style.visibility = mode ? '' : 'hidden';
    ts.placeholder = { sales: 'Search bills, customer, item…', service: 'Search jobs, customer, device…', debtors: 'Search name or phone…', creditors: 'Search supplier, bill no…' }[mode] || 'Search name, phone, product…';
    ts.value = { sales: State.sf.q, service: State.jf.q, debtors: State.df.q, creditors: State.cf.q }[mode] ?? State.q;
  }
  v.innerHTML = fn();
  if (State.view === 'admin') afterAdmin();
  if (['performance', 'dashboard', 'overview'].includes(State.view)) afterPerf();
}

/* ============================== VIEW: HOME ============================== */
function viewHome() {
  const me = State.me; const t = ymd(); const now = new Date();
  const scope = can('viewAll') || isAdmin() ? () => true : isMine;
  const visitsToday = State.customers.filter(c => scope(c) && (c.lastVisit || c.createdAt || '').slice(0, 10) === t).length;
  const fu = fuBuckets(inScope);
  const month = t.slice(0, 7);
  const converted = State.customers.filter(c => scope(c) && c.status === 'Converted' && convDate(c).slice(0, 7) === month).length;
  const agenda = [...fu.overdue, ...fu.today];
  const recent = State.customers.filter(scope).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

  return `
  <div class="page-head">
    <div><p class="eyebrow">${DAYS[now.getDay()]}, ${now.getDate()} ${['January','February','March','April','May','June','July','August','September','October','November','December'][now.getMonth()]}</p>
    <h1 class="title">${greeting()}, ${h(me.name.split(' ')[0])}.</h1></div>
    ${can('add') ? `<button class="btn btn-primary desk-only" onclick="App.newCustomer()">${ico('plus', 'sm')} New customer</button>` : ''}
  </div>
  <div class="tiles">
    <button class="tile hero" onclick="App.goFilter('all','today')"><div class="t-ico">${ico('store')}</div><div class="t-val">${visitsToday}</div><div class="t-lbl">Visitors today</div></button>
    <button class="tile" onclick="App.go('followups')"><div class="t-ico c-orange">${ico('bell')}</div><div class="t-val">${fu.today.length}</div><div class="t-lbl">Follow-ups today</div></button>
    <button class="tile" onclick="App.go('followups')"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${fu.overdue.length}</div><div class="t-lbl">Overdue</div></button>
    <button class="tile" onclick="App.goFilter('Converted','month')"><div class="t-ico c-green">${ico('trophy')}</div><div class="t-val">${converted}</div><div class="t-lbl">Converted this month</div></button>
  </div>

  <div class="two-col section">
    <div>
      <div class="section-head"><h2 class="h2">Today’s agenda</h2><button class="link-btn" onclick="App.go('followups')">All follow-ups ${ico('chev', 'sm')}</button></div>
      <div class="list">${agenda.length ? agenda.slice(0, 8).map(c => fuRow(c)).join('') : emptyBox('check', 'You’re all caught up', 'No follow-ups due today.')}</div>
    </div>
    <div>
      <div class="section-head"><h2 class="h2">Recently added</h2><button class="link-btn" onclick="App.goFilter('all','all')">View all ${ico('chev', 'sm')}</button></div>
      <div class="list">${recent.length ? recent.map(c => custRow(c)).join('') : emptyBox('users', 'No customers yet', 'Tap “New customer” to add the first one.')}</div>
    </div>
  </div>
  ${can('reports') ? insights() : ''}`;
}

function insights() {
  const t = ymd(); const month = t.slice(0, 7);
  const days = []; for (let i = 13; i >= 0; i--) days.push(addDays(-i));
  const perDay = days.map(d => State.customers.filter(c => (c.createdAt || '').slice(0, 10) === d).length);
  const max = Math.max(1, ...perDay);
  const counts = STATUSES.map(s => [s, State.customers.filter(c => c.status === s).length]);
  const total = State.customers.length || 1;
  let acc = 0;
  const grad = counts.filter(x => x[1]).map(([s, n]) => { const a = acc; acc += n / total * 360; return `${STATUS_COLOR[s]} ${a}deg ${acc}deg`; }).join(',') || 'var(--fill) 0 360deg';
  const thisMonth = State.customers.filter(c => (c.createdAt || '').slice(0, 7) === month);
  const board = State.staff.map(s => [s.name, thisMonth.filter(c => c.createdBy === s.username).length, thisMonth.filter(c => c.assignedTo === s.username && c.status === 'Converted').length]).sort((a, b) => b[1] - a[1]);
  const bmax = Math.max(1, ...board.map(b => b[1]));
  const src = {}; thisMonth.forEach(c => { src[c.source || 'Other'] = (src[c.source || 'Other'] || 0) + 1; });
  const srcArr = Object.entries(src).sort((a, b) => b[1] - a[1]); const smax = Math.max(1, ...srcArr.map(x => x[1]));
  const revenue = thisMonth.filter(c => c.status === 'Converted').reduce((s, c) => s + (Number(digits(c.amount)) || 0), 0);

  return `
  <div class="section">
    <div class="section-head"><h2 class="h2">Insights</h2><span class="muted tiny">Whole shop · ${MON[new Date().getMonth()]} ${new Date().getFullYear()}</span></div>
    <div class="two-col">
      <div class="card pad">
        <div class="section-head" style="margin-bottom:4px"><b>New customers · last 14 days</b><span class="muted tiny">${perDay.reduce((a, b) => a + b, 0)} total</span></div>
        <div class="bars">${perDay.map((n, i) => `<div class="bar ${i === 13 ? 'today' : ''}"><em>${n || ''}</em><i style="height:${Math.round(n / max * 100)}%"></i><span>${parse(days[i]).getDate()}</span></div>`).join('')}</div>
      </div>
      <div class="card pad">
        <b>Pipeline</b>
        <div class="donut-wrap" style="margin-top:16px">
          <div class="donut" style="background:conic-gradient(${grad})"><div class="c"><span>${State.customers.length}</span><small>customers</small></div></div>
          <div class="legend">${counts.map(([s, n]) => `<div><i style="background:${STATUS_COLOR[s]}"></i>${s}<b>${n}</b></div>`).join('')}</div>
        </div>
      </div>
      <div class="card pad">
        <div class="section-head" style="margin-bottom:8px"><b>Team this month</b><span class="muted tiny">added · converted</span></div>
        ${board.map(([n, a, cv]) => `<div class="hbar"><span class="nm">${h(n)}</span><span class="track"><i style="width:${a / bmax * 100}%"></i></span><b>${a}</b><span class="muted tiny" style="width:28px;text-align:right">${cv}✓</span></div>`).join('')}
      </div>
      <div class="card pad">
        <div class="section-head" style="margin-bottom:8px"><b>Where customers come from</b>${revenue ? `<span class="badge c-green">${money(revenue)} won</span>` : ''}</div>
        ${srcArr.length ? srcArr.map(([n, v]) => `<div class="hbar"><span class="nm" style="width:120px">${h(n)}</span><span class="track"><i style="width:${v / smax * 100}%;background:var(--purple)"></i></span><b>${v}</b></div>`).join('') : '<p class="muted">No data this month yet.</p>'}
      </div>
    </div>
  </div>`;
}

function emptyBox(i, t, s) { return `<div class="empty"><div class="e-ico">${ico(i, 'lg')}</div><b>${h(t)}</b>${h(s)}</div>`; }

function custRow(c) {
  return `<button class="row" onclick="App.open('${h(c.id)}')">${avatar(c.name, '', c.id)}
    <div class="main-txt"><b>${h(c.name)}</b><small>${h(fmtPhone(c.phone))}${c.requirement ? ' · ' + h(c.requirement) : ''}</small></div>
    <div class="meta">${statusBadge(c.status)}<small>${h(rel(c.createdAt))}</small></div></button>`;
}
function fuRow(c, actions) {
  const t = ymd(); const od = c.followUpDate < t;
  return `<div class="row clickable" onclick="App.open('${h(c.id)}')">${avatar(c.name, '', c.id)}
    <div class="main-txt"><b>${h(c.name)}</b><small>${h(c.requirement || c.category || '')} · ${h(staffName(c.assignedTo))}</small></div>
    <div class="meta"><span class="badge ${od ? 'c-red' : c.followUpDate === t ? 'c-orange' : 'c-blue'}">${h(relDay(c.followUpDate))}</span>
    ${actions ? `<div style="display:flex;gap:6px" onclick="event.stopPropagation()"><a class="icon-btn" style="width:32px;height:32px;background:var(--accent-soft);color:var(--accent)" href="tel:${h(digits(c.phone))}">${ico('phone', 'sm')}</a><button class="icon-btn" style="width:32px;height:32px;background:var(--green-soft);color:var(--green)" title="Mark follow-up done" onclick="App.fuDone('${h(c.id)}', this)">${ico('check', 'sm')}</button></div>` : `<small>${h(fmtPhone(c.phone))}</small>`}</div></div>`;
}

/* =========================== VIEW: CUSTOMERS =========================== */
function filteredCustomers() {
  const q = State.q.trim().toLowerCase(); const qd = digits(q);
  const t = ymd();
  return State.customers.filter(c => {
    if (State.period !== 'date' && State.status === 'Open' && !OPEN.includes(c.status)) return false;
    if (State.period !== 'date' && State.status !== 'Open' && State.status !== 'all' && c.status !== State.status) return false;
    if (State.assignee === '__me' && !isMine(c)) return false;
    if (State.assignee && State.assignee !== '__me' && c.assignedTo !== State.assignee) return false;
    if (State.period === 'date') { const v = State.dayVisits[State.onDate]; if (!(v && v.some(x => x.id === c.id)) && (c.createdAt || '').slice(0, 10) !== State.onDate) return false; }
    const d = (c.lastVisit || c.createdAt || '').slice(0, 10);
    if (State.period === 'today' && d !== t) return false;
    if (State.period === '7' && d < addDays(-6)) return false;
    if (State.period === 'month' && d.slice(0, 7) !== t.slice(0, 7)) return false;
    if (q) {
      const hay = [c.name, c.requirement, c.location, c.category, c.email, c.notes].join(' ').toLowerCase();
      if (!hay.includes(q) && !smartScore(c.name, q) && !(qd.length >= 3 && (digits(c.phone).includes(qd) || digits(c.altPhone).includes(qd)))) return false;
    }
    return true;
  }).sort((a, b) => (b.lastVisit || b.createdAt || '').localeCompare(a.lastVisit || a.createdAt || ''));
}

function viewCustomers() {
  const chip = (v, l) => {
    const n = v === 'all' ? State.customers.length : v === 'Open' ? State.customers.filter(c => OPEN.includes(c.status)).length : State.customers.filter(c => c.status === v).length;
    return `<button class="chip ${State.status === v ? 'on' : ''}" onclick="App.setStatus('${v}')">${l}<span class="n">${n}</span></button>`;
  };
  return `
  <div class="page-head">
    <div><p class="eyebrow">${State.customers.length} total</p><h1 class="title">Customers</h1></div>
    <div style="display:flex;gap:8px">
      ${reportButton('customers')}
      ${can('add') ? `<button class="btn btn-primary desk-only" onclick="App.newCustomer()">${ico('plus', 'sm')} New customer</button>` : ''}
    </div>
  </div>
  <label class="search mob-only" style="display:flex;max-width:none;height:42px;margin-bottom:12px">${ico('search', 'sm')}<input placeholder="Search name, phone, product…" value="${h(State.q)}" oninput="App.search(this.value)"></label>
  <div class="scroll-x" style="margin-bottom:12px"><div class="chips">
    ${chip('Open', 'Open')}${chip('all', 'All')}${STATUSES.map(s => chip(s, s)).join('')}
  </div></div>
  <div class="toolbar">
    <select class="select" style="height:38px;width:auto;font-size:14px;border-radius:10px" onchange="App.setPeriod(this.value)">
      ${[['all', 'Any time'], ['today', 'Visited today'], ['7', 'Last 7 days'], ['month', 'This month'], ['date', 'On a date…']].map(([v, l]) => `<option value="${v}" ${State.period === v ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
    <select class="select" style="height:38px;width:auto;font-size:14px;border-radius:10px" onchange="App.setAssignee(this.value)">
      <option value="">Everyone</option><option value="__me" ${State.assignee === '__me' ? 'selected' : ''}>Assigned to me</option>
      ${State.staff.map(s => `<option value="${h(s.username)}" ${State.assignee === s.username ? 'selected' : ''}>${h(s.name)}</option>`).join('')}
    </select>
    ${State.period === 'date' ? `<div class="date-pick"><button class="icon-btn" title="Previous day" onclick="App.dayShift(-1)">${ico('back', 'sm')}</button><input class="input" type="date" value="${h(State.onDate)}" max="${ymd()}" onchange="App.setDate(this.value)"><button class="icon-btn" title="Next day" onclick="App.dayShift(1)" ${State.onDate >= ymd() ? 'disabled' : ''}>${ico('chev', 'sm')}</button></div>` : ''}
  </div>
  ${State.period === 'date' ? daySummary() : ''}
  <div id="cust-results">${custResults()}</div>`;
}

function custResults() {
  const list = filteredCustomers();
  if (!list.length) return `<div class="list">${emptyBox('search', 'No customers found', State.q ? 'Try a different name or number.' : 'Nothing matches these filters.')}</div>`;
  const shown = list.slice(0, State.limit);
  const t = ymd();
  const fuCell = c => needsFU(c) ? `<span class="badge ${c.followUpDate < t ? 'c-red' : c.followUpDate === t ? 'c-orange' : 'c-blue'}">${h(relDay(c.followUpDate))}</span>` : '<span class="muted">—</span>';
  return `
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Requirement</th><th>Status</th><th>Follow-up</th><th>Assigned</th><th>Last visit</th></tr></thead><tbody>
    ${shown.map(c => `<tr onclick="App.open('${h(c.id)}')">
      <td><div class="who">${avatar(c.name, 'sm', c.id)}<div><b>${h(c.name)}</b><small>${h(fmtPhone(c.phone))}</small></div></div></td>
      <td><div style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(c.requirement || '—')}</div><small class="muted">${h(c.category || '')}${c.amount ? ' · ' + money(c.amount) : ''}</small></td>
      <td>${statusBadge(c.status)}${c.priority && c.priority !== 'Normal' ? ` <span class="badge ${c.priority === 'Urgent' ? 'c-red' : 'c-orange'}" style="margin-left:4px">${h(c.priority)}</span>` : ''}</td>
      <td>${fuCell(c)}</td><td class="nowrap">${h(staffName(c.assignedTo))}</td><td class="nowrap muted">${h(rel(c.lastVisit || c.createdAt))}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="cust-cards list">${shown.map(c => `<button class="row" onclick="App.open('${h(c.id)}')">${avatar(c.name, '', c.id)}
    <div class="main-txt"><b>${h(c.name)}</b><small>${h(fmtPhone(c.phone))}${c.requirement ? ' · ' + h(c.requirement) : ''}</small></div>
    <div class="meta">${statusBadge(c.status)}<small>${needsFU(c) ? '⏰ ' + h(relDay(c.followUpDate)) : h(rel(c.lastVisit || c.createdAt))}</small></div></button>`).join('')}</div>
  ${list.length > shown.length ? `<div style="text-align:center;margin-top:16px"><button class="btn btn-ghost" onclick="App.more()">Show more (${list.length - shown.length})</button></div>` : ''}
  <p class="muted tiny" style="text-align:center;margin-top:14px">${list.length} customer${list.length === 1 ? '' : 's'}</p>`;
}

/* =========================== VIEW: FOLLOW-UPS =========================== */
function viewFollowups() {
  const all = isAdmin() || can('viewAll');
  const scope = State.fuScope === 'all' && all ? () => true : isMine;
  const { overdue, today, upcoming } = fuBuckets(scope);
  const group = (title, list, cls, i) => `<div class="section" style="margin-top:26px">
    <div class="section-head"><h2 class="h2" style="display:flex;align-items:center;gap:10px"><span class="badge ${cls}" style="height:28px;width:28px;padding:0;justify-content:center">${ico(i, 'sm')}</span>${title} <span class="muted" style="font-weight:500">${list.length}</span></h2></div>
    <div class="list">${list.length ? list.map(c => fuRow(c, true)).join('') : emptyBox('check', 'Nothing here', '')}</div></div>`;
  return `
  <div class="page-head">
    <div><p class="eyebrow">Pending & follow-up cases</p><h1 class="title">Follow-ups</h1></div>
    ${all ? `<div class="seg"><button class="${State.fuScope === 'mine' ? 'on' : ''}" onclick="App.setFuScope('mine')">Mine</button><button class="${State.fuScope === 'all' ? 'on' : ''}" onclick="App.setFuScope('all')">Everyone</button></div>` : ''}
  </div>
  ${group('Overdue', overdue, 'c-red', 'alert')}
  ${group('Today', today, 'c-orange', 'bell')}
  ${group('Upcoming', upcoming.slice(0, 60), 'c-blue', 'cal')}`;
}

/* ============================= VIEW: ADMIN ============================= */
function viewAdmin() {
  if (!canManage()) return emptyBox('shield', 'No access', 'Ask the admin for access.');
  const tabs = [];
  if (can('manageStaff')) tabs.push(['staff', 'Staff']);
  if (can('reports')) tabs.push(['activity', 'Activity']);
  tabs.push(['data', 'Data']);
  if (!tabs.find(t => t[0] === State.adminTab)) State.adminTab = tabs[0][0];
  return `
  <div class="page-head">
    <div><p class="eyebrow">${isAdmin() ? 'Administrator' : 'Management'}</p><h1 class="title">${isAdmin() ? 'Admin' : 'Manage'}</h1></div>
    ${State.adminTab === 'staff' ? `<button class="btn btn-primary" onclick="App.editStaff()">${ico('userPlus', 'sm')} Add staff</button>` : ''}
  </div>
  <div class="seg" style="margin-bottom:22px">${tabs.map(([v, l]) => `<button class="${State.adminTab === v ? 'on' : ''}" onclick="App.adminTab('${v}')">${l}</button>`).join('')}</div>
  <div id="admin-body"><div class="empty"><span class="spinner dark" style="margin:auto;display:block"></span></div></div>`;
}

async function afterAdmin() {
  const el = $('#admin-body'); if (!el) return;
  try {
    if (State.adminTab === 'staff') {
      State.users = await api('listUsers');
      if (State.view !== 'admin' || State.adminTab !== 'staff') return;
      const month = ymd().slice(0, 7);
      el.innerHTML = `<div class="staff-grid">${State.users.map(u => {
        const added = State.customers.filter(c => c.createdBy === u.username && (c.createdAt || '').slice(0, 7) === month).length;
        const open = State.customers.filter(c => c.assignedTo === u.username && needsFU(c)).length;
        return `<button class="staff-card" onclick="App.editStaff('${h(u.username)}')" style="${u.active ? '' : 'opacity:.55'}">
          <div class="top">${u.photo ? `<div class="avatar has-photo"><img src="${h(u.photo)}" alt=""></div>` : avatar(u.name, '', u.username)}<div style="flex:1;min-width:0"><b>${h(u.name)}</b><small>${h(u.title || '@' + u.username)}${u.active ? '' : ' · disabled'} · ${u.lastLogin ? 'seen ' + h(rel(u.lastLogin)) : 'never signed in'}</small></div>
          ${u.role === 'admin' ? '<span class="badge c-blue">Admin</span>' : '<span class="badge c-gray">Staff</span>'}</div>
          <div class="perms">${PERMS.map(([k, , , s]) => `<span class="${u.perms[k] ? 'on' : ''}">${s}</span>`).join('')}</div>
          <div class="stats"><div><b>${added}</b>added this month</div><div><b>${open}</b>open follow-ups</div></div>
        </button>`;
      }).join('')}</div>`;
    } else if (State.adminTab === 'activity') {
      const acts = await api('recentActivity');
      if (State.view !== 'admin' || State.adminTab !== 'activity') return;
      const byId = {};
      State.customers.forEach(c => byId[c.id] = { name: c.name });
      State.sales.forEach(s => byId[s.id] = { name: 'Sale · ' + s.customerName, sale: true });
      State.jobs.forEach(j => byId[j.id] = { name: j.jobNo + ' · ' + j.customerName });
      el.innerHTML = `<div class="list">${acts.length ? acts.slice(0, 150).map(a => {
        const c = byId[a.customerId];
        const what = a.type === 'login' ? 'Signed in' : c ? c.name : (String(a.customerId)[0] === 'J' ? 'Removed job' : String(a.customerId)[0] === 'S' ? 'Removed sale' : 'Removed customer');
        const click = c && !c.sale ? `onclick="App.openAny('${h(a.customerId)}')"` : '';
        return `<div class="row ${click ? 'clickable' : ''}" ${click}>${staffAv(a.user, 'sm')}
          <div class="main-txt"><b>${h(staffName(a.user))} · ${h(what)}</b><small style="white-space:normal">${a.type === 'login' ? '' : h(a.text)}</small></div>
          <div class="meta"><small>${h(rel(a.timestamp))}</small></div></div>`;
      }).join('') : emptyBox('activity', 'No activity yet', '')}</div>`;
    } else {
      el.innerHTML = `<div class="two-col even">
        ${can('export') ? `<div class="card pad"><div class="t-ico c-green" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;margin-bottom:14px">${ico('download')}</div>
          <b style="font-size:17px">Export customers</b><p class="muted" style="margin:4px 0 16px">Download every customer you can see as a CSV file — opens in Excel or Google Sheets.</p>
          <button class="btn btn-dark" onclick="App.exportCSV()">${ico('download', 'sm')} Download CSV</button></div>` : ''}
        ${State.me.backupAdmin ? `<div class="card pad vault-card"><div class="t-ico c-purple" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;margin-bottom:14px">${ico('shield')}</div>
          <b style="font-size:17px">Backup & settings 🔒</b><p class="muted" style="margin:4px 0 16px">Download a full backup, restore from one, and the Google Sheet / Apps Script connection. Locked with your PIN.</p>
          <button class="btn btn-dark" onclick="App.vault()">${ico('key', 'sm')} Open</button></div>` : ''}
        <div class="card pad"><div class="t-ico c-blue" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;margin-bottom:14px">${ico('sheet')}</div>
          <b style="font-size:17px">Where the data lives</b><p class="muted" style="margin:4px 0 0">${DEMO ? 'Demo mode: data is stored only in this browser. Add your Apps Script URL in <code>config.js</code> to go live with Google Sheets.' : 'All data is saved live in your Google Sheet (tabs: Users, Customers, Sales, Service, Creditors, Advances, Tasks, Activity). Every change is timestamped automatically.'}</p>
          ${DEMO && isAdmin() ? `<button class="btn btn-danger" style="margin-top:16px" onclick="App.resetDemo()">Reset demo data</button>` : ''}</div>
      </div>`;
    }
  } catch (e) { el.innerHTML = `<div class="list">${emptyBox('alert', 'Could not load', e.message)}</div>`; }
}

const ACT = { visit: ['store', 'c-blue'], note: ['note', 'c-gray'], call: ['phone', 'c-green'], update: ['edit', 'c-purple'], status: ['flag', 'c-orange'], delete: ['trash', 'c-red'], followup: ['cal', 'c-orange'], sale: ['cart', 'c-green'], job: ['wrench', 'c-teal'], login: ['key', 'c-gray'], advance: ['rupee', 'c-purple'], payment: ['rupee', 'c-green'], credit: ['out', 'c-purple'], task: ['check', 'c-blue'], happy: ['phone', 'c-yellow'] };
const actDot = t => { const [i, c] = ACT[t] || ACT.note; return `<div class="tl-dot ${c}">${ico(i)}</div>`; };

/* ========================== CUSTOMER FORM ========================== */
function customerForm(c) {
  const edit = !!(c && c.id); c = c || {};
  const me = State.me.username;
  const opt = (arr, val) => arr.map(x => `<option ${x === val ? 'selected' : ''}>${h(x)}</option>`).join('');
  const now = new Date();
  const body = `
  <form id="cust-form" autocomplete="off">
    ${!edit ? `<div class="badge c-blue" style="margin-bottom:16px;height:30px;padding:0 12px">${ico('clock', 'sm')} Visit time recorded automatically · ${fmtDate(ymd(now))}, ${fmtTime(now)}</div>` : ''}
    <label class="field"><span>Customer name <em>*</em></span><input class="input" name="name" value="${h(c.name)}" required autofocus placeholder="Full name or institution"></label>
    <div class="grid-2">
      <label class="field"><span>Phone <em>*</em></span><input class="input" name="phone" type="tel" inputmode="tel" value="${h(c.phone)}" required placeholder="98470 12345"></label>
      <label class="field"><span>Alternate phone</span><input class="input" name="altPhone" type="tel" inputmode="tel" value="${h(c.altPhone)}"></label>
    </div>
    <div id="dup-hint"></div>
    <div class="grid-2">
      <label class="field"><span>Location / Area</span><input class="input" name="location" value="${h(c.location)}" placeholder="e.g. Feroke"></label>
      <label class="field"><span>Email</span><input class="input" name="email" type="email" value="${h(c.email)}"></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Category</span><select class="select" name="category">${opt(CATEGORIES, c.category || 'Sales')}</select></label>
      <label class="field"><span>How they came</span><select class="select" name="source">${opt(SOURCES, c.source || 'Walk-in')}</select></label>
    </div>
    <label class="field"><span>Requirement / Product / Issue</span><input class="input" name="requirement" value="${h(c.requirement)}" placeholder="e.g. i5 laptop under 55k · printer not working"></label>
    <div class="grid-2">
      <label class="field"><span>Estimated amount (₹)</span><input class="input" name="amount" inputmode="numeric" value="${h(c.amount)}" placeholder="0"></label>
      <label class="field"><span>Priority</span><select class="select" name="priority">${opt(PRIORITIES, c.priority || 'Normal')}</select></label>
    </div>
    <div class="field"><span>Status</span><div class="chips" id="st-chips">${STATUSES.map(s => `<button type="button" class="chip ${(c.status || 'New') === s ? 'on' : ''}" data-s="${s}">${s}</button>`).join('')}</div></div>
    <input type="hidden" name="status" value="${h(c.status || 'New')}">
    <div class="field" id="fu-field"><span>Follow-up date</span>
      <input class="input" name="followUpDate" type="date" value="${h(c.followUpDate)}" min="${edit ? '' : ymd()}">
      <div class="chips" style="margin-top:8px">${[['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([l, n]) => `<button type="button" class="chip" data-d="${n}">${l}</button>`).join('')}<button type="button" class="chip" data-d="">Clear</button></div>
    </div>
    <div id="fu-hint"></div>
    <label class="field"><span>Assign to</span><select class="select" name="assignedTo">${State.staff.map(s => `<option value="${h(s.username)}" ${(c.assignedTo || me) === s.username ? 'selected' : ''}>${h(s.name)}${s.username === me ? ' (me)' : ''}</option>`).join('')}</select></label>
    <label class="field"><span>Notes</span><textarea class="textarea" name="notes" placeholder="Anything useful — budget, brand preference, best time to call…">${h(c.notes)}</textarea></label>
  </form>`;
  const el = openOverlay(modal({ title: edit ? 'Edit customer' : 'New customer', sub: edit ? h(c.name) : 'Add a walk-in, call or enquiry', body, cls: 'wide',
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="cust-save">${edit ? 'Save changes' : 'Save customer'}</button>` }));
  const f = el.querySelector('#cust-form');
  el.querySelectorAll('#st-chips .chip').forEach(b => b.onclick = () => {
    el.querySelectorAll('#st-chips .chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); f.status.value = b.dataset.s;
    if (['Follow-up', 'Pending'].includes(b.dataset.s) && !f.followUpDate.value) { f.followUpDate.value = addDays(1); f.followUpDate.focus(); }
    checkFu();
  });
  el.querySelectorAll('#fu-field [data-d]').forEach(b => b.onclick = () => {
    f.followUpDate.value = b.dataset.d === '' ? '' : addDays(Number(b.dataset.d));
    if (f.followUpDate.value && f.status.value === 'New') { f.status.value = 'Follow-up'; el.querySelectorAll('#st-chips .chip').forEach(x => x.classList.toggle('on', x.dataset.s === 'Follow-up')); }
    checkFu();
  });
  const checkFu = () => {
    const need = ['Follow-up', 'Pending'].includes(f.status.value) && !f.followUpDate.value;
    el.querySelector('#fu-hint').innerHTML = need ? `<p class="hint warn">Pick a follow-up date so the reminder pops up on that day.</p>` : '';
    return !need;
  };
  f.followUpDate.onchange = checkFu;
  let existing = null;
  if (!edit) attachSuggest(f.elements['name'], p => {
    const x = p.cust || {};
    f.elements['name'].value = p.name; f.phone.value = p.phone || ''; f.altPhone.value = x.altPhone || p.altPhone || '';
    f.location.value = x.location || p.location || ''; f.email.value = x.email || p.email || '';
    if (x.id) {
      existing = x;
      ['category', 'source', 'priority'].forEach(k => { if (x[k]) f[k].value = x[k]; });
      if (x.assignedTo && f.assignedTo.querySelector(`option[value="${x.assignedTo}"]`)) f.assignedTo.value = x.assignedTo;
      if (x.notes) f.notes.value = x.notes;
      el.querySelector('#dup-hint').innerHTML = `<div class="hint link-hint">${ico('users', 'sm')}<span>Returning customer: <b>${h(x.name)}</b> · visit ${(Number(x.visits) || 1) + 1} will be added to their history. Just fill in today's requirement.</span></div>`;
      el.querySelector('#cust-save').textContent = 'Log repeat visit';
      f.requirement.value = ''; f.requirement.focus();
    } else { existing = null; el.querySelector('#dup-hint').innerHTML = ''; f.requirement.focus(); }
  });
  f.phone.oninput = () => {
    const p = last10(f.phone.value); const box = el.querySelector('#dup-hint');
    if (p.length < 10) { box.innerHTML = ''; return; }
    const ex = State.customers.find(x => x.id !== c.id && (last10(x.phone) === p || last10(x.altPhone) === p));
    box.innerHTML = ex ? `<p class="hint warn">${ico('alert', 'sm').replace('class="ico sm"', 'class="ico sm" style="display:inline;vertical-align:-3px"')} Already a customer: <b>${h(ex.name)}</b> (${h(ex.status)}). <a href="#" id="dup-open">Open profile</a>${!edit ? ` · <a href="#" id="dup-visit">Log a repeat visit instead</a>` : ''}</p>` : '';
    if (ex) {
      const o = box.querySelector('#dup-open'); if (o) o.onclick = e => { e.preventDefault(); closeOverlay(); openCustomer(ex.id); };
      const v = box.querySelector('#dup-visit'); if (v) v.onclick = async e => { e.preventDefault(); closeOverlay(); await logVisit(ex.id); openCustomer(ex.id); };
    }
  };
  if (edit) f.phone.oninput();
  el.querySelector('#cust-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    if (!checkFu()) { f.followUpDate.focus(); return; }
    const data = Object.fromEntries(new FormData(f).entries());
    if (edit) data.id = c.id;
    if (!edit && existing) {
      // returning customer: update their details (if allowed) and add a visit, instead of creating a duplicate
      try {
        await busy(ev.currentTarget, async () => {
          if (can('edit')) upsert(await api('saveCustomer', { customer: Object.assign({}, data, { id: existing.id, requirement: data.requirement || existing.requirement }) }));
          const r = await api('addActivity', { customerId: existing.id, type: 'visit', text: 'Visited the shop' + (data.requirement ? ' — ' + data.requirement : '') });
          upsert(r.customer);
        });
        delete State.activity[existing.id]; State.dayVisits = {};
        closeOverlay(); toast(`Repeat visit logged · ${existing.name}`); refreshUI();
      } catch (e) { toast(e.message, true); }
      return;
    }
    try {
      const saved = await busy(ev.currentTarget, () => api('saveCustomer', { customer: data }));
      upsert(saved);
      delete State.activity[saved.id];
      closeOverlay();
      toast(edit ? 'Changes saved' : `${saved.name} added`);
      refreshUI();
      if (edit && State.openId === saved.id) renderDrawer();
    } catch (e) { toast(e.message, true); }
  };
}

function upsert(c) { const i = State.customers.findIndex(x => x.id === c.id); if (i >= 0) State.customers[i] = c; else State.customers.unshift(c); }
function refreshUI() {
  if (State.view === 'customers' && $('#cust-results')) { $('#cust-results').innerHTML = custResults(); renderTabbar(); }
  else renderView();
  updateBell();
}

/* ========================= CUSTOMER DRAWER ========================= */
function openCustomer(id) {
  if (State.openId && stack.length && stack[stack.length - 1].el.classList.contains('drawer-scrim')) closeOverlay();
  State.openId = id;
  openOverlay(`<aside class="drawer" id="drawer"></aside>`, { cls: 'drawer-scrim', onClose: () => { State.openId = null; } });
  renderDrawer();
  loadActivity(id);
}

async function loadActivity(id) {
  try { State.activity[id] = await api('getActivity', { customerId: id }); } catch (e) { State.activity[id] = []; }
  if (State.openId === id) renderTimeline();
  if (State.openJobId === id) renderJobTimeline();
}

function renderDrawer() {
  const el = $('#drawer'); if (!el) return;
  const c = State.customers.find(x => x.id === State.openId);
  if (!c) { el.innerHTML = `<div class="drawer-head"><button class="icon-btn" onclick="App.close()">${ico('back')}</button></div>${emptyBox('alert', 'Customer not found', 'It may have been deleted.')}`; return; }
  const t = ymd(); const fu = needsFU(c);
  el.innerHTML = `
  <div class="drawer-head">
    <button class="icon-btn" onclick="App.close()" title="Close">${ico('back')}</button>
    <div class="spacer"></div>
    ${can('edit') ? `<button class="btn btn-ghost btn-sm" onclick="App.edit('${h(c.id)}')">${ico('edit', 'sm')} Edit</button>` : ''}
    ${can('delete') ? `<button class="icon-btn" style="color:var(--red)" title="Delete" onclick="App.del('${h(c.id)}')">${ico('trash')}</button>` : ''}
  </div>
  <div class="drawer-body">
    <div class="profile">${avatar(c.name, 'lg', c.id)}<h3>${h(c.name)}</h3><div class="ph">${h(fmtPhone(c.phone))}${c.altPhone ? ' · ' + h(fmtPhone(c.altPhone)) : ''}</div>
      <div class="badges">${statusBadge(c.status)}${c.priority && c.priority !== 'Normal' ? `<span class="badge ${c.priority === 'Urgent' ? 'c-red' : 'c-orange'}">${h(c.priority)}</span>` : ''}<span class="badge c-gray">${h(c.category || 'General')}</span></div></div>
    <div class="quick">
      <a href="tel:${h(digits(c.phone))}" onclick="App.logCall('${h(c.id)}')">${ico('phone')}Call</a>
      <a href="${h(waLink(c.phone))}" target="_blank" rel="noopener">${ico('chat')}WhatsApp</a>
      <button onclick="App.visit('${h(c.id)}', this)">${ico('store')}Log visit</button>
      ${can('edit') ? `<button onclick="App.edit('${h(c.id)}')">${ico('edit')}Edit</button>` : `<a href="sms:${h(digits(c.phone))}">${ico('note')}SMS</a>`}
    </div>

    ${can('edit') ? `<div class="group-title">Follow-up</div>
    <div class="fu-card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="tl-dot ${fu ? (c.followUpDate < t ? 'c-red' : c.followUpDate === t ? 'c-orange' : 'c-blue') : 'c-gray'}" style="width:40px;height:40px;border-radius:12px">${ico('cal')}</div>
        <div style="flex:1"><b style="display:block">${fu ? h(relDay(c.followUpDate)) : 'No follow-up set'}</b><small class="muted">${fu ? fmtDate(c.followUpDate, true) + ' · ' + h(staffName(c.assignedTo)) : 'Pick a date to get a reminder'}</small></div>
        ${fu ? `<button class="btn btn-sm" style="background:var(--green-soft);color:var(--green)" onclick="App.fuDone('${h(c.id)}', this)">${ico('check', 'sm')} Done</button>` : ''}
      </div>
      <div class="chips">${[['Today', 0], ['Tomorrow', 1], ['3 days', 3], ['1 week', 7]].map(([l, n]) => `<button class="chip" onclick="App.setFu('${h(c.id)}', '${addDays(n)}', this)">${l}</button>`).join('')}
        <label class="chip" style="position:relative;overflow:hidden">${ico('cal', 'sm')} Pick<input type="date" style="position:absolute;inset:0;opacity:0" onchange="App.setFu('${h(c.id)}', this.value, this.parentNode)"></label></div>
      <div class="group-title" style="margin:16px 0 8px">Status</div>
      <div class="chips">${STATUSES.map(s => `<button class="chip ${c.status === s ? 'on' : ''}" onclick="App.setStatusOf('${h(c.id)}', '${s}', this)">${s}</button>`).join('')}</div>
    </div>` : ''}

    <div class="group-title">Add update</div>
    <div class="composer">
      <textarea id="note-text" placeholder="What happened? e.g. Called, asked for quotation…" rows="2"></textarea>
      <div class="composer-foot">
        <div class="seg" id="note-type"><button class="on" data-t="note">Note</button><button data-t="call">Call</button><button data-t="visit">Visit</button></div>
        <button class="btn btn-primary btn-sm" onclick="App.addNote('${h(c.id)}', this)">Add</button>
      </div>
    </div>

    <div class="group-title">Details</div>
    <div class="kv">
      ${[['Requirement', c.requirement], ['Estimated', money(c.amount)], ['Came via', c.source], ['Location', c.location], ['Email', c.email], ['Assigned to', staffName(c.assignedTo)],
         ['First visit', fmtDT(c.createdAt)], ['Last visit', fmtDT(c.lastVisit)], ['Total visits', c.visits], ['Happy call', c.happyStatus === 'Done' ? `${(HAPPY_FACE[c.happyRating] || [''])[0]} ${c.happyRating} · ${staffName(c.happyBy)}, ${fmtDate(c.happyAt)}${c.happyNote ? ' · “' + c.happyNote + '”' : ''}` : c.happyStatus === 'No answer' ? `No answer (${c.happyTries || 1} tries)` : ''], ['Added by', staffName(c.createdBy)], ['Last updated', `${rel(c.updatedAt)} · ${staffName(c.updatedBy)}`]]
        .filter(x => x[1] && x[1] !== '—').map(([k, v]) => `<div><span>${k}</span><span>${h(v)}</span></div>`).join('')}
      ${c.notes ? `<div style="display:block"><span style="display:block;margin-bottom:4px">Notes</span><span style="display:block;text-align:left;font-weight:400;white-space:pre-wrap">${h(c.notes)}</span></div>` : ''}
    </div>

    ${conversionBlock(c)}
    <div class="group-title">History</div>
    <div class="timeline" id="timeline"></div>
  </div>`;
  el.querySelectorAll('#note-type button').forEach(b => b.onclick = () => { el.querySelectorAll('#note-type button').forEach(x => x.classList.remove('on')); b.classList.add('on'); });
  renderTimeline();
}

function renderTimeline() {
  const el = $('#timeline'); if (!el) return;
  const acts = State.activity[State.openId];
  if (!acts) { el.innerHTML = `<div style="padding:20px;text-align:center"><span class="spinner dark" style="display:inline-block"></span></div>`; return; }
  if (!acts.length) { el.innerHTML = `<p class="muted">No history yet.</p>`; return; }
  el.innerHTML = acts.map(a => `<div class="tl-item">${actDot(a.type)}<div class="tl-body"><p>${h(a.text)}</p><small class="tl-who">${staffAv(a.user, 'xs')}${h(staffName(a.user))} · ${h(rel(a.timestamp))}</small></div></div>`).join('');
}

async function activity(id, payload, btn, msg) {
  try {
    const r = await busy(btn, () => api('addActivity', Object.assign({ customerId: id }, payload)));
    upsert(r.customer);
    if (State.activity[id]) State.activity[id].unshift(r.activity);
    if (msg) toast(msg);
    if (State.openId === id) renderDrawer();
    refreshUI();
    refreshReminder();
    return r;
  } catch (e) { toast(e.message, true); }
}
const logVisit = (id, btn) => activity(id, { type: 'visit', text: 'Visited the shop' }, btn, 'Visit recorded');

/* ======================= REMINDER POPUP ======================= */
function reminderItems() { const b = fuBuckets(inScope); return [...b.overdue, ...b.today]; }
function showReminder(force) {
  const items = reminderItems();
  const key = 'bicrm_rem_' + State.me.username;
  if (!force && (!items.length || sessionStorage.getItem(key) === ymd())) return;
  if (document.getElementById('reminder')) return;
  openOverlay(`<div class="modal" id="reminder"><div class="grabber"></div><div id="rem-inner"></div></div>`, { onClose: () => sessionStorage.setItem(key, ymd()) });
  refreshReminder();
}
function refreshReminder() {
  const el = $('#rem-inner'); if (!el) return;
  const items = reminderItems(); const t = ymd();
  const od = items.filter(c => c.followUpDate < t).length;
  el.innerHTML = `
    <button class="close-x rem-x" onclick="App.close()" title="Close" aria-label="Close">${ico('x', 'sm')}</button>
    <div class="reminder-hero"><div class="big-ico">${ico('bell', 'lg')}</div>
      <h3>${items.length ? `${items.length} follow-up${items.length > 1 ? 's need' : ' needs'} you today` : 'All done for today 🎉'}</h3>
      <p>${items.length ? (od ? `${od} overdue · ` : '') + 'Call, then tap ✓ when done.' : 'Every follow-up due today is handled.'}</p></div>
    <div class="modal-body">${items.map(c => `<div class="rem-item">${avatar(c.name, '', c.id)}
      <div class="main-txt" onclick="App.open('${h(c.id)}')"><b>${h(c.name)}</b><small>${c.followUpDate < t ? `<span style="color:var(--red);font-weight:600">${h(relDay(c.followUpDate))}</span> · ` : ''}${h(c.requirement || c.category || '')}${isAdmin() ? ' · ' + h(staffName(c.assignedTo)) : ''}</small></div>
      <div class="rem-actions"><a class="icon-btn call" href="tel:${h(digits(c.phone))}" title="Call">${ico('phone', 'sm')}</a>
      <button class="icon-btn" title="Remind tomorrow" onclick="App.snooze('${h(c.id)}', this)">${ico('clock', 'sm')}</button>
      <button class="icon-btn ok" title="Done" onclick="App.fuDone('${h(c.id)}', this)">${ico('check', 'sm')}</button></div></div>`).join('')}</div>
    <div class="modal-foot"><button class="btn btn-ghost" onclick="App.close()">${items.length ? 'Remind me later' : 'Close'}</button><button class="btn btn-primary" onclick="App.close();App.go('followups')">Open follow-ups</button></div>`;
}

/* ======================= NOTIFICATIONS ======================= */
function showNotifs() {
  const list = notifications();
  const read = ls.get(readKey(), []);
  openOverlay(`<div class="popover"><div class="grabber"></div>
    <div class="popover-head"><h3>Notifications</h3><button class="link-btn" onclick="App.close();App.reminder()">Today’s list</button></div>
    <div class="popover-body">${list.length ? list.map(n => `<button class="notif ${read.includes(n.key) ? '' : 'unread'}" onclick="App.close();App.openAny('${h(n.cid)}')">
      <div class="n-ico ${n.cls}">${ico(n.ico, 'sm')}</div><div style="min-width:0"><b>${h(n.title)}</b><small>${h(n.sub)}</small></div></button>`).join('')
      : emptyBox('bell', 'No notifications', 'You’re all caught up.')}</div></div>`, { cls: 'pop-scrim' });
  ls.set(readKey(), list.map(n => n.key));
  updateBell();
}

/* ======================= STAFF EDITOR ======================= */
function staffForm(username) {
  const u = username ? State.users.find(x => x.username === username) : null;
  const edit = !!u;
  const p = u ? u.perms : ROLE_TPL['Sales'].perms;
  const role = u ? u.role : 'staff';
  const self = u && u.username === State.me.username;
  const lockAdmin = u && u.role === 'admin' && !isAdmin();
  const body = `<form id="staff-form" autocomplete="off">
    ${edit ? `<div class="photo-edit"><div id="sf-av">${staffAv(u.username, 'lg', u.name)}</div><div><b>Profile photo</b><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <button type="button" class="btn btn-ghost btn-sm" id="sf-photo" ${lockAdmin ? 'disabled' : ''}>${ico('camera', 'sm')} ${u.photo ? 'Change' : 'Add photo'}</button>
      ${u.photo && !lockAdmin ? `<button type="button" class="btn btn-sm btn-danger" id="sf-photo-rm">Remove</button>` : ''}</div></div></div>` : ''}
    <div class="grid-2 keep">
      <label class="field"><span>Name</span><input class="input" name="name" value="${h(u ? u.name : '')}" required autofocus placeholder="e.g. Arun"></label>
      <label class="field"><span>Login ID</span><input class="input" name="username" value="${h(u ? u.username : '')}" ${edit ? 'disabled' : ''} required autocapitalize="none" placeholder="e.g. arun"></label>
    </div>
    <div class="grid-2 keep">
      <label class="field"><span>Job title / role</span><input class="input" name="title" list="role-tpls" value="${h(u ? u.title : '')}" placeholder="e.g. Sales"></label>
      <label class="field"><span>${edit ? 'New passcode' : 'Passcode'}</span><input class="input" name="password" inputmode="numeric" ${edit ? '' : 'required'} placeholder="${edit ? 'Keep current' : 'e.g. 1234'}"></label>
    </div>
    <label class="field"><span>Email <small class="muted">(for salary advance emails)</small></span><input class="input" type="email" name="email" value="${h(u ? u.email : '')}" placeholder="name@gmail.com"></label>
    <datalist id="role-tpls">${Object.keys(ROLE_TPL).map(t => `<option value="${h(t)}">`).join('')}</datalist>
    <p class="hint" style="margin-top:-8px">Picking a listed role fills in its usual access below. You can still change each switch.</p>
    <div class="card" style="padding:4px 16px;margin-bottom:14px;box-shadow:none">
      <div class="perm-row"><div><b>Administrator</b><small>Full access to everything, including staff</small></div><label class="switch"><input type="checkbox" name="admin" ${role === 'admin' ? 'checked' : ''} ${isAdmin() ? '' : 'disabled'}><span></span></label></div>
      <div class="perm-row"><div><b>Account active</b><small>Turn off to block sign-in without deleting</small></div><label class="switch"><input type="checkbox" name="active" ${!u || u.active ? 'checked' : ''} ${self ? 'disabled' : ''}><span></span></label></div>
    </div>
    <div class="group-title" style="margin-top:6px">Permissions</div>
    <div class="card" style="padding:4px 16px;box-shadow:none" id="perm-box">
      ${PERMS.map(([k, l, d]) => `<div class="perm-row"><div><b>${l}</b><small>${d}</small></div><label class="switch"><input type="checkbox" data-p="${k}" ${p[k] || role === 'admin' ? 'checked' : ''} ${role === 'admin' ? 'disabled' : ''}><span></span></label></div>`).join('')}
    </div>
  </form>`;
  const el = openOverlay(modal({ title: edit ? h(u.name) : 'Add staff', sub: edit ? '@' + h(u.username) + (u.lastLogin ? ' · last login ' + h(rel(u.lastLogin)) : '') : 'They can sign in right away', body,
    foot: `${edit && !self && !lockAdmin ? `<button class="btn btn-danger" id="st-del" style="margin-right:auto">${ico('trash', 'sm')} Delete</button>` : ''}<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="st-save" ${lockAdmin ? 'disabled' : ''}>${edit ? 'Save' : 'Add staff'}</button>` }));
  const f = el.querySelector('#staff-form');
  const ph = el.querySelector('#sf-photo');
  if (ph) ph.onclick = () => choosePhoto(u.username, () => { closeOverlay(); staffForm(u.username); });
  const phr = el.querySelector('#sf-photo-rm');
  if (phr) phr.onclick = async () => { try { await savePhoto(u.username, ''); closeOverlay(); staffForm(u.username); } catch (e) { toast(e.message, true); } };
  f.admin.onchange = () => el.querySelectorAll('#perm-box input').forEach(i => { i.disabled = f.admin.checked; if (f.admin.checked) i.checked = true; });
  f.title.onchange = () => {
    const tpl = ROLE_TPL[Object.keys(ROLE_TPL).find(k => k.toLowerCase() === f.title.value.trim().toLowerCase())];
    if (!tpl) return;
    if (tpl.admin && !isAdmin()) return toast('Only an admin can give full admin access', true);
    if (!f.admin.disabled) f.admin.checked = !!tpl.admin;
    el.querySelectorAll('#perm-box input').forEach(i => { i.disabled = !!tpl.admin; i.checked = tpl.admin ? true : !!tpl.perms[i.dataset.p]; });
  };
  el.querySelector('#st-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    const perms = {}; el.querySelectorAll('#perm-box input').forEach(i => perms[i.dataset.p] = i.checked);
    const user = { username: edit ? u.username : f.username.value, name: f.elements['name'].value, title: f.title.value, email: f.email.value, password: f.password.value, role: f.admin.checked ? 'admin' : 'staff', active: f.active.checked, perms };
    try {
      await busy(ev.currentTarget, () => api('saveUser', { user }));
      closeOverlay(); toast(edit ? 'Staff updated' : `${user.name} added`);
      await sync(); if (self) { State.me = (await api('bootstrap')).me; ls.set('bicrm_me', State.me); renderShell(); } else renderView();
    } catch (e) { toast(e.message, true); }
  };
  const del = el.querySelector('#st-del');
  if (del) del.onclick = async () => {
    if (!await confirmBox(`Delete ${u.name}?`, 'They will no longer be able to sign in. Their customers stay in the system.', 'Delete', true)) return;
    try { await api('deleteUser', { username: u.username }); closeOverlay(); toast('Staff deleted'); await sync(); renderView(); } catch (e) { toast(e.message, true); }
  };
}

/* ======================= ME MENU ======================= */
function meMenu(anchor) {
  const r = anchor.getBoundingClientRect();
  const theme = document.documentElement.getAttribute('data-theme');
  const wrap = openOverlay(`<div class="menu" style="${r.top > innerHeight / 2 ? `bottom:${innerHeight - r.top + 8}px` : `top:${r.bottom + 8}px`};${r.left > innerWidth / 2 ? `right:${Math.max(12, innerWidth - r.right)}px` : `left:${Math.max(12, r.left)}px`}">
    <div class="menu-head" style="display:flex;gap:12px;align-items:center">${staffAv(State.me.username, '', State.me.name)}<div><b>${h(State.me.name)}</b><small>@${h(State.me.username)} · ${h(roleLabel(State.me))}</small></div></div>
    ${State.loginAt ? `<div class="menu-note">${ico('clock', 'sm')}<span>Signed in ${h(fmtTime(new Date(State.loginAt)))}. If you close the app, you'll need to sign in again after ${h(fmtTime(new Date(State.loginAt + SESSION_HOURS * 3600000)))}.</span></div>` : ''}<hr>
    <button data-a="photo">${ico('camera', 'sm')} ${State.me.photo ? 'Change profile photo' : 'Add profile photo'}</button>
    ${State.me.photo ? `<button data-a="nophoto">${ico('trash', 'sm')} Remove photo</button>` : ''}
    ${State.me ? `<button data-a="simple">${ico(simpleMode() ? 'grid' : 'home', 'sm')} ${simpleMode() ? 'Switch to full view' : 'Switch to simple view'}</button>` : ''}
    <button data-a="theme">${ico(theme === 'dark' ? 'sun' : 'moon', 'sm')} ${theme === 'dark' ? 'Light' : 'Dark'} appearance</button>
    <button data-a="email">${ico('chat', 'sm')} ${State.me.email ? 'My email · ' + h(State.me.email) : 'Add my email'}</button>
    <button data-a="pass">${ico('key', 'sm')} Change passcode</button>
    <button data-a="refresh">${ico('refresh', 'sm')} Refresh data</button>
    <hr><button data-a="out" class="danger">${ico('logout', 'sm')} Sign out</button></div>`, { cls: 'pop-scrim' });
  wrap.style.background = 'transparent'; wrap.style.backdropFilter = 'none';
  wrap.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
    closeOverlay();
    const a = b.dataset.a;
    if (a === 'simple') { ls.set('bicrm_simple_' + State.me.username, !simpleMode()); State.view = (navItems()[0] || ['home'])[0]; renderShell(); }
    if (a === 'theme') { ls.set('bicrm_theme', theme === 'dark' ? 'light' : 'dark'); applyTheme(); }
    if (a === 'pass') changePass();
    if (a === 'email') emailForm(null);
    if (a === 'photo') choosePhoto(State.me.username);
    if (a === 'nophoto') { try { await savePhoto(State.me.username, ''); } catch (e) { toast(e.message, true); } }
    if (a === 'refresh') { await sync(); refreshUI(); toast('Up to date'); }
    if (a === 'out') logout();
  });
}

function changePass() {
  const el = openOverlay(modal({ title: 'Change passcode', cls: 'narrow', body: `<form id="pw-form">
    <label class="field"><span>Current passcode</span><input class="input" type="password" name="o" inputmode="numeric" required autofocus></label>
    <label class="field"><span>New passcode</span><input class="input" type="password" name="n" inputmode="numeric" minlength="4" required></label>
    <label class="field"><span>Repeat new passcode</span><input class="input" type="password" name="n2" inputmode="numeric" minlength="4" required></label></form>`,
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="pw-save">Update</button>` }));
  const f = el.querySelector('#pw-form');
  el.querySelector('#pw-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    if (f.n.value !== f.n2.value) return toast('New passcodes do not match', true);
    try { await busy(ev.currentTarget, () => api('changePassword', { oldPassword: f.o.value, newPassword: f.n.value })); closeOverlay(); toast('Passcode updated'); } catch (e) { toast(e.message, true); }
  };
}

/* ======================= EXPORT ======================= */
function exportCSV() {
  if (!can('export')) return toast('No permission to export', true);
  const cols = [['id', 'ID'], ['createdAt', 'First visit'], ['name', 'Name'], ['phone', 'Phone'], ['altPhone', 'Alt phone'], ['email', 'Email'], ['location', 'Location'], ['source', 'Source'], ['category', 'Category'],
    ['requirement', 'Requirement'], ['amount', 'Amount'], ['status', 'Status'], ['priority', 'Priority'], ['followUpDate', 'Follow-up date'], ['assignedTo', 'Assigned to'], ['notes', 'Notes'], ['createdBy', 'Added by'], ['lastVisit', 'Last visit'], ['visits', 'Visits'], ['updatedAt', 'Updated']];
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const rows = [cols.map(c => esc(c[1])).join(',')].concat(State.customers.map(c => cols.map(([k]) => esc(k === 'assignedTo' || k === 'createdBy' ? staffName(c[k]) : c[k])).join(',')));
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `BestIndia_Customers_${ymd()}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`${State.customers.length} customers exported`);
}

/* ======================= SYNC INDICATOR ======================= */
function setSync(st, msg) {
  State.sync = { st, at: st === 'ok' ? new Date() : State.sync.at, msg: msg || '' };
  paintSync();
}
function paintSync() {
  const b = $('#sync-btn'); if (!b) return;
  const s = State.sync; let cls, label, title;
  if (DEMO) { cls = 'err'; label = 'Not connected'; title = 'Demo mode — nothing is being saved to Google Sheets. Add your Apps Script URL in config.js.'; }
  else if (!navigator.onLine) { cls = 'err'; label = 'Offline'; title = 'No internet connection — changes cannot be saved.'; }
  else if (s.st === 'syncing') { cls = 'busy'; label = 'Syncing…'; title = 'Talking to Google Sheets…'; }
  else if (s.st === 'error') { cls = 'err'; label = 'Sync failed'; title = s.msg + ' Tap to retry.'; }
  else { cls = 'ok'; label = s.at ? 'Synced ' + fmtTime(s.at) : 'Connected'; title = 'Connected to Google Sheets' + (s.at ? ' · last synced ' + fmtTime(s.at) : '') + '. Tap to sync now.'; }
  b.className = 'sync-btn ' + cls; b.title = title; b.setAttribute('aria-label', title);
  b.innerHTML = `<i class="dot"></i><span class="lbl">${label}</span>${ico('refresh', 'sm')}`;
}
window.addEventListener('offline', () => { setSync('error', 'No internet connection.'); });
window.addEventListener('online', () => { if (State.token && State.loaded) sync().then(() => refreshUI()).catch(() => {}); else paintSync(); });

async function checkConnection() {
  const el = $('#conn-pill'); if (!el) return;
  const paint = (cls, text) => { el.className = 'conn-pill ' + cls; el.innerHTML = `<i class="dot"></i><span>${text}</span>`; };
  if (DEMO) return paint('err', 'Not connected to Google Sheets · demo mode');
  try {
    const r = await fetch(currentApiUrl(), { redirect: 'follow' });
    const d = await r.json();
    if (d.ok && d.sheet !== false) paint('ok', 'Connected to Google Sheets');
    else paint('err', 'Google Sheet not set up — run setup()');
  } catch (e) { paint('err', navigator.onLine ? 'Cannot reach Google Sheets' : 'No internet connection'); }
}

/* ======================= PROFILE PHOTOS ======================= */
function choosePhoto(username, after) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    try { const data = await resizePhoto(f); await savePhoto(username, data); if (after) after(); }
    catch (e) { toast(e.message, true); }
  };
  inp.click();
}
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const S = 192, c = document.createElement('canvas'); c.width = c.height = S;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S);
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url);
      let q = 0.85, d = c.toDataURL('image/jpeg', q);
      while (d.length > 40000 && q > 0.3) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
      resolve(d);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image — try a JPG or PNG')); };
    img.src = url;
  });
}
async function savePhoto(username, photo) {
  await api('setPhoto', { username, photo });
  [State.staff, State.users].forEach(arr => { const u = arr.find(x => x.username === username); if (u) u.photo = photo; });
  if (State.me.username === username) { State.me.photo = photo; ls.set('bicrm_me', State.me); }
  toast(photo ? 'Profile photo updated' : 'Photo removed');
  const keepOpen = stack.length;
  if (!keepOpen) renderShell();
  else { const top = document.querySelector('.sidebar-foot'); if (top) renderShellAvatars(); }
}
function renderShellAvatars() {
  const me = State.me;
  const row = document.querySelector('.sidebar-foot .me-row'); if (row) row.firstElementChild.outerHTML = staffAv(me.username, '', me.name);
  const mob = document.querySelector('.topbar .mob-only'); if (mob) mob.innerHTML = staffAv(me.username, 'sm', me.name);
  if (State.view === 'admin') renderView();
}

/* ======================= SHARED BITS ======================= */
const sumBy = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0);
const rupees = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const kfmt = n => { n = Math.round(n || 0); return n >= 1e5 ? (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n || ''); };
const shortRs = n => { n = Math.round(n || 0); if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr'; if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L'; return rupees(n); };
const periodChips = (cur, list, fn) => `<div class="scroll-x"><div class="chips">${list.map(([v, l]) => `<button class="chip ${cur === v ? 'on' : ''}" onclick="${fn}'${v}')">${l}</button>`).join('')}</div></div>`;
const staffWith = p => State.staff.filter(s => s.role === 'admin' || (s.perms && s.perms[p]));
const matchCustomer = phone => { const p = last10(phone); return p.length === 10 ? State.customers.find(x => last10(x.phone) === p || last10(x.altPhone) === p) : null; };
function delta(cur, prev) {
  if (!prev) return cur ? '<span class="delta up">new</span>' : '';
  const d = Math.round((cur - prev) / prev * 100);
  return `<span class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}%</span>`;
}
function csvDownload(name, head, rows) {
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + [head].concat(rows).map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  saveBlob(blob, name);
}

/* ======================= SALES ======================= */
const SALE_PERIODS = [['today', 'Today'], ['week', '7 days'], ['month', 'This month'], ['lastmonth', 'Last month'], ['year', 'This FY'], ['all', 'All'], ['dues', 'Pending dues']];
function filteredSales() {
  const f = State.sf; const R = rangeFor(f.period === 'dues' ? 'all' : f.period);
  const q = f.q.trim().toLowerCase(); const qd = digits(q);
  return State.sales.filter(s => {
    if (!inR(s.date || s.createdAt, R)) return false;
    if (f.period === 'dues' && !saleBal(s)) return false;
    if (f.staff && s.soldBy !== f.staff) return false;
    if (q) {
      const hay = [s.customerName, s.items, s.billNo, s.category, s.notes, s.paymentMode].join(' ').toLowerCase();
      if (!hay.includes(q) && !(qd.length >= 3 && digits(s.phone).includes(qd))) return false;
    }
    return true;
  }).sort((a, b) => ((b.date || '') + (b.createdAt || '')).localeCompare((a.date || '') + (a.createdAt || '')));
}
function viewSales() {
  const t = ymd(); const M = rangeFor('month');
  const today = State.sales.filter(s => (s.date || '').slice(0, 10) === t);
  const month = State.sales.filter(s => inR(s.date, M));
  const dues = State.sales.filter(saleBal);
  const mRev = sumBy(month, s => num(s.amount));
  return `
  <div class="page-head">
    <div><p class="eyebrow">${seesAll() ? 'Whole shop' : 'Your sales'}</p><h1 class="title">Sales</h1></div>
    <div style="display:flex;gap:8px">
      ${reportButton('sales')}
      <button class="btn btn-primary desk-only" onclick="App.newSale()">${ico('plus', 'sm')} New sale</button>
    </div>
  </div>
  <div class="tiles">
    <button class="tile hero" onclick="App.sf('period','today')"><div class="t-ico">${ico('cart')}</div><div class="t-val">${shortRs(sumBy(today, s => num(s.amount)))}</div><div class="t-lbl">Today · ${today.length} bill${today.length === 1 ? '' : 's'}</div></button>
    <button class="tile" onclick="App.sf('period','month')"><div class="t-ico c-green">${ico('rupee')}</div><div class="t-val">${shortRs(mRev)}</div><div class="t-lbl">This month · ${month.length} bills</div></button>
    <div class="tile"><div class="t-ico c-purple">${ico('chart')}</div><div class="t-val">${shortRs(month.length ? mRev / month.length : 0)}</div><div class="t-lbl">Average bill this month</div></div>
    <button class="tile" onclick="App.sf('period','dues')"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${shortRs(sumBy(dues, saleBal))}</div><div class="t-lbl">Pending dues · ${dues.length} bill${dues.length === 1 ? '' : 's'}</div></button>
  </div>
  <div class="toolbar" style="margin-top:22px">
    <div style="flex:1;min-width:0">${periodChips(State.sf.period, SALE_PERIODS, "App.sf('period',")}</div>
    ${seesAll() ? `<select class="select sm-select" onchange="App.sf('staff',this.value)"><option value="">Everyone</option>${staffWith('sales').map(s => `<option value="${h(s.username)}" ${State.sf.staff === s.username ? 'selected' : ''}>${h(s.name)}</option>`).join('')}</select>` : ''}
  </div>
  <label class="search mob-only" style="display:flex;max-width:none;height:42px;margin-bottom:12px">${ico('search', 'sm')}<input placeholder="Search bills, customer, item…" value="${h(State.sf.q)}" oninput="App.search(this.value)"></label>
  <div id="mod-results">${salesResults()}</div>`;
}
function salesResults() {
  const list = filteredSales();
  if (!list.length) return `<div class="list">${emptyBox('cart', 'No sales here', State.sf.q ? 'Try a different search.' : 'Tap “New sale” to record a bill.')}</div>`;
  const shown = list.slice(0, State.sf.limit);
  const total = sumBy(list, s => num(s.amount)), bal = sumBy(list, saleBal);
  const payBadge = s => saleBal(s) ? `<span class="badge c-red">Due ${rupees(saleBal(s))}</span>` : `<span class="badge c-green">${h(s.paymentMode || 'Paid')}</span>`;
  return `
  <div class="sum-strip"><span><b>${list.length}</b> bills</span><span>Total <b>${rupees(total)}</b></span>${bal ? `<span class="red">Due <b>${rupees(bal)}</b></span>` : ''}</div>
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Sold by</th><th>Payment</th><th style="text-align:right">Amount</th></tr></thead><tbody>
  ${shown.map(s => `<tr onclick="App.editSale('${h(s.id)}')">
    <td class="nowrap">${h(fmtDate(s.date))}<small class="muted" style="display:block">${h(s.billNo || '')}</small></td>
    <td><b>${h(s.customerName || 'Walk-in')}</b><small class="muted" style="display:block">${h(fmtPhone(s.phone))}</small></td>
    <td><div class="ellip">${h(s.items)}</div><small class="muted">${h(s.category || '')}</small></td>
    <td class="nowrap">${h(staffName(s.soldBy))}</td><td>${payBadge(s)}</td>
    <td style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${rupees(num(s.amount))}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="cust-cards list">${shown.map(s => `<button class="row" onclick="App.editSale('${h(s.id)}')"><div class="tl-dot c-green" style="width:40px;height:40px;border-radius:12px">${ico('cart', 'sm')}</div>
    <div class="main-txt"><b>${h(s.items)}</b><small>${h(s.customerName || 'Walk-in')} · ${h(staffName(s.soldBy))} · ${h(fmtDate(s.date))}</small></div>
    <div class="meta"><b style="font-size:15px">${rupees(num(s.amount))}</b>${saleBal(s) ? `<small style="color:var(--red);font-weight:600">Due ${rupees(saleBal(s))}</small>` : `<small>${h(s.paymentMode || '')}</small>`}</div></button>`).join('')}</div>
  ${list.length > shown.length ? `<div style="text-align:center;margin-top:16px"><button class="btn btn-ghost" onclick="App.sfMore()">Show more (${list.length - shown.length})</button></div>` : ''}`;
}

function saleForm(s) {
  const edit = !!(s && s.id); s = s || {};
  const me = State.me.username;
  const opt = (arr, val) => arr.map(x => `<option ${x === val ? 'selected' : ''}>${h(x)}</option>`).join('');
  const sellers = staffWith('sales');
  const body = `<form id="sale-form" autocomplete="off">
    <div class="grid-2 keep">
      <label class="field"><span>Date</span><input class="input" type="date" name="date" value="${h((s.date || ymd()).slice(0, 10))}" max="${ymd()}"></label>
      <label class="field"><span>Bill no.</span><input class="input" name="billNo" value="${h(s.billNo)}" placeholder="Optional"></label>
    </div>
    <div class="grid-2">
      <label class="field"><span>Customer phone</span><input class="input" name="phone" type="tel" inputmode="tel" value="${h(s.phone)}" placeholder="98470 12345" autofocus></label>
      <label class="field"><span>Customer name</span><input class="input" name="customerName" value="${h(s.customerName)}" placeholder="Walk-in"></label>
    </div>
    <div id="sale-link"></div>
    <label class="field"><span>Items sold <em>*</em></span><input class="input" name="items" value="${h(s.items)}" required placeholder="e.g. ASUS Vivobook 15 + bag"></label>
    <div class="grid-2 keep">
      <label class="field"><span>Category</span><select class="select" name="category">${opt(SALE_CATS, s.category || 'Laptop')}</select></label>
      <label class="field"><span>Payment</span><select class="select" name="paymentMode">${opt(PAY_MODES, s.paymentMode || 'Cash')}</select></label>
    </div>
    <div class="grid-2 keep">
      <label class="field"><span>Bill amount (₹) <em>*</em></span><input class="input" name="amount" inputmode="numeric" value="${h(s.amount)}" required placeholder="0"></label>
      <label class="field"><span>Amount received (₹)</span><input class="input" name="paid" inputmode="numeric" value="${h(edit ? s.paid : '')}" placeholder="Same as bill"></label>
    </div>
    <div id="sale-due"></div>
    <label class="field"><span>Sold by</span><select class="select" name="soldBy" ${seesAll() ? '' : 'disabled'}>${sellers.map(x => `<option value="${h(x.username)}" ${(s.soldBy || me) === x.username ? 'selected' : ''}>${h(x.name)}${x.username === me ? ' (me)' : ''}</option>`).join('')}</select></label>
    <label class="field"><span>Notes</span><textarea class="textarea" name="notes" style="min-height:64px" placeholder="Warranty, serial no., delivery…">${h(s.notes)}</textarea></label>
  </form>`;
  const el = openOverlay(modal({ title: edit ? 'Edit sale' : 'New sale', sub: edit ? `${h(fmtDate(s.date, true))} · added by ${h(staffName(s.createdBy))}` : 'Record a bill', body, cls: 'wide',
    foot: `${edit && can('delete') ? `<button class="btn btn-danger" id="sale-del" style="margin-right:auto">${ico('trash', 'sm')}</button>` : ''}<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="sale-save">${edit ? 'Save changes' : 'Save sale'}</button>` }));
  const f = el.querySelector('#sale-form');
  let linked = s.customerId ? State.customers.find(c => c.id === s.customerId) : null;
  const showLink = () => {
    const box = el.querySelector('#sale-link');
    if (!edit) linked = can('crm') ? matchCustomer(f.phone.value) : null;
    if (!linked) { box.innerHTML = ''; return; }
    if (!edit && !f.customerName.value) f.customerName.value = linked.name;
    const open = OPEN.includes(linked.status);
    box.innerHTML = `<div class="hint link-hint">${ico('users', 'sm')}<span>CRM customer: <b>${h(linked.name)}</b> (${h(linked.status)})${!edit && open ? `<label class="chk"><input type="checkbox" id="mark-conv" checked> Mark as Converted</label>` : ''}</span></div>`;
  };
  const showDue = () => {
    const a = num(f.amount.value), p = f.paid.value === '' ? (f.paymentMode.value === 'Credit' ? 0 : a) : num(f.paid.value);
    el.querySelector('#sale-due').innerHTML = a && p < a ? `<p class="hint warn">Balance due: ${rupees(a - p)} — it will show under Pending dues.</p>` : '';
  };
  f.phone.oninput = showLink; f.amount.oninput = showDue; f.paid.oninput = showDue;
  if (!edit) attachSuggest(f.customerName, p => { f.customerName.value = p.name; f.phone.value = p.phone || ''; showLink(); f.items.focus(); });
  f.paymentMode.onchange = () => { if (f.paymentMode.value === 'Credit' && f.paid.value === '') f.paid.value = '0'; showDue(); };
  showLink(); showDue();
  el.querySelector('#sale-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f).entries());
    if (!seesAll()) data.soldBy = s.soldBy || me;
    if (data.paid === '' && data.paymentMode === 'Credit') data.paid = '0';
    if (edit) data.id = s.id;
    if (!edit && linked) { data.customerId = linked.id; const mc = el.querySelector('#mark-conv'); data.markConverted = mc && mc.checked ? '1' : ''; }
    try {
      const r = await busy(ev.currentTarget, () => api('saveSale', { sale: data }));
      const i = State.sales.findIndex(x => x.id === r.sale.id); if (i >= 0) State.sales[i] = r.sale; else State.sales.unshift(r.sale);
      if (r.customer) { upsert(r.customer); delete State.activity[r.customer.id]; }
      closeOverlay(); toast(edit ? 'Sale updated' : `Sale saved · ${rupees(num(r.sale.amount))}`); refreshUI();
    } catch (e) { toast(e.message, true); }
  };
  const del = el.querySelector('#sale-del');
  if (del) del.onclick = async () => {
    if (!await confirmBox('Delete this sale?', `${s.items} — ${rupees(num(s.amount))}. This removes it from the sheet permanently.`, 'Delete', true)) return;
    try { await api('deleteSale', { id: s.id }); State.sales = State.sales.filter(x => x.id !== s.id); closeOverlay(); toast('Sale deleted'); refreshUI(); } catch (e) { toast(e.message, true); }
  };
}
function exportSales() {
  const list = filteredSales();
  csvDownload(`BestIndia_Sales_${ymd()}.csv`, ['Date', 'Bill no.', 'Customer', 'Phone', 'Items', 'Category', 'Amount', 'Received', 'Balance', 'Payment', 'Sold by', 'Notes'],
    list.map(s => [s.date, s.billNo, s.customerName, s.phone, s.items, s.category, num(s.amount), num(s.paid), saleBal(s), s.paymentMode, staffName(s.soldBy), s.notes]));
  toast(`${list.length} sales exported`);
}

/* ======================= SERVICE ======================= */
function filteredJobs() {
  const f = State.jf; const q = f.q.trim().toLowerCase(); const qd = digits(q);
  return State.jobs.filter(j => {
    if (f.status === 'Open' && !JOB_OPEN.includes(j.status)) return false;
    if (f.status === 'Overdue' && !jobOverdue(j)) return false;
    if (!['Open', 'All', 'Overdue'].includes(f.status) && j.status !== f.status) return false;
    if (f.type && j.jobType !== f.type) return false;
    if (f.eng === '__none' && j.assignedTo) return false;
    if (f.eng && f.eng !== '__none' && j.assignedTo !== f.eng) return false;
    if (q) {
      const hay = [j.jobNo, j.customerName, j.device, j.brandModel, j.serialNo, j.problem, j.location, j.diagnosis].join(' ').toLowerCase();
      if (!hay.includes(q) && !(qd.length >= 3 && digits(j.phone).includes(qd))) return false;
    }
    return true;
  }).sort((a, b) => {
    const ao = JOB_OPEN.includes(a.status), bo = JOB_OPEN.includes(b.status);
    if (ao !== bo) return ao ? -1 : 1;
    if (ao) return (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (a.createdAt || '').localeCompare(b.createdAt || '');
    return (b.deliveredAt || b.updatedAt || '').localeCompare(a.deliveredAt || a.updatedAt || '');
  });
}
function engineerRevenue(u, R) {
  const done = State.jobs.filter(j => j.assignedTo === u && j.status === 'Delivered' && inR(j.deliveredAt, R));
  return { n: done.length, rev: sumBy(done, j => num(j.charge)), collected: sumBy(done, j => num(j.paid)) };
}
function viewService() {
  const me = State.me.username; const engMode = !seesAll(); const t = ymd();
  const M = rangeFor('month'), LM = rangeFor('lastmonth'), FY = rangeFor('year');
  const scope = engMode ? State.jobs.filter(j => j.assignedTo === me) : State.jobs;
  const open = scope.filter(j => JOB_OPEN.includes(j.status));
  const overdue = scope.filter(jobOverdue);
  const dueToday = open.filter(j => j.dueDate === t && j.status !== 'Ready');
  const ready = open.filter(j => j.status === 'Ready');
  const counts = JOB_STATUSES.map(s => [s, State.jobs.filter(j => j.status === s).length]);
  let top;
  if (engMode) {
    const m = engineerRevenue(me, M), lm = engineerRevenue(me, LM), fy = engineerRevenue(me, FY);
    const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const k = ymd(d).slice(0, 7); const R = { from: k + '-01', to: k + '-31' }; months.push([MON[d.getMonth()], engineerRevenue(me, R).rev]); }
    const mx = Math.max(1, ...months.map(x => x[1]));
    top = `
    <div class="tiles">
      <div class="tile hero"><div class="t-ico">${ico('rupee')}</div><div class="t-val">${shortRs(m.rev)}</div><div class="t-lbl">My revenue this month · ${m.n} job${m.n === 1 ? '' : 's'} ${delta(m.rev, lm.rev)}</div></div>
      <button class="tile" onclick="App.jf('status','Open')"><div class="t-ico c-blue">${ico('wrench')}</div><div class="t-val">${open.length}</div><div class="t-lbl">My open jobs</div></button>
      <button class="tile" onclick="App.jf('status','Overdue')"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${overdue.length}</div><div class="t-lbl">Overdue · ${dueToday.length} due today</div></button>
      <button class="tile" onclick="App.jf('status','Ready')"><div class="t-ico c-green">${ico('check')}</div><div class="t-val">${ready.length}</div><div class="t-lbl">Ready for delivery</div></button>
    </div>
    <div class="two-col section" style="margin-top:18px">
      <div class="card pad"><div class="section-head" style="margin-bottom:4px"><b>My service revenue · last 6 months</b><span class="muted tiny">delivered jobs</span></div>
        <div class="bars">${months.map(([l, v], i) => `<div class="bar ${i === 5 ? 'today' : ''}"><em>${v ? kfmt(v) : ''}</em><i style="height:${Math.round(v / mx * 100)}%;background:var(--teal)"></i><span>${l}</span></div>`).join('')}</div></div>
      <div class="card pad"><b>My totals</b>
        <div class="kv" style="margin:14px 0 0">
          <div><span>This month</span><span>${rupees(m.rev)} · ${m.n} jobs</span></div>
          <div><span>Last month</span><span>${rupees(lm.rev)} · ${lm.n} jobs</span></div>
          <div><span>This financial year</span><span>${rupees(fy.rev)} · ${fy.n} jobs</span></div>
          <div><span>Collected this month</span><span>${rupees(m.collected)}</span></div>
        </div></div>
    </div>`;
  } else {
    const mDone = State.jobs.filter(j => j.status === 'Delivered' && inR(j.deliveredAt, M));
    const engs = serviceStaff();
    top = `
    <div class="tiles">
      <button class="tile hero" onclick="App.jf('status','Open')"><div class="t-ico">${ico('wrench')}</div><div class="t-val">${open.length}</div><div class="t-lbl">Open jobs · ${dueToday.length} due today</div></button>
      <button class="tile" onclick="App.jf('status','Ready')"><div class="t-ico c-green">${ico('check')}</div><div class="t-val">${ready.length}</div><div class="t-lbl">Ready for delivery</div></button>
      <button class="tile" onclick="App.jf('status','Overdue')"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${overdue.length}</div><div class="t-lbl">Past promised date</div></button>
      <div class="tile"><div class="t-ico c-teal">${ico('rupee')}</div><div class="t-val">${shortRs(sumBy(mDone, j => num(j.charge)))}</div><div class="t-lbl">Service revenue this month · ${mDone.length} jobs</div></div>
    </div>
    <div class="section" style="margin-top:18px"><div class="table-wrap" style="display:block"><table class="tbl rp"><thead><tr><th>Engineer</th><th style="text-align:right">Open</th><th style="text-align:right">Overdue</th><th style="text-align:right">Delivered (month)</th><th style="text-align:right">Revenue (month)</th></tr></thead><tbody>
      ${engs.map(s => { const r = engineerRevenue(s.username, M); const mine = State.jobs.filter(j => j.assignedTo === s.username); return `<tr style="cursor:pointer" onclick="App.jf('eng','${h(s.username)}')"><td><div class="who">${staffAv(s.username, 'sm')}<div><b>${h(s.name)}</b><small>${h(s.title || '')}</small></div></div></td>
        <td style="text-align:right">${mine.filter(j => JOB_OPEN.includes(j.status)).length}</td><td style="text-align:right">${(n => n ? `<span class="badge c-red">${n}</span>` : 0)(mine.filter(jobOverdue).length)}</td>
        <td style="text-align:right">${r.n}</td><td style="text-align:right;font-weight:600">${rupees(r.rev)}</td></tr>`; }).join('') || `<tr><td colspan="5" class="muted" style="text-align:center;padding:20px">No engineers yet</td></tr>`}
    </tbody></table></div></div>`;
  }
  const chip = (v, l, n) => `<button class="chip ${State.jf.status === v ? 'on' : ''}" onclick="App.jf('status','${v}')">${l}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
  return `
  <div class="page-head">
    <div><p class="eyebrow">${engMode ? `${h(State.me.name)} · ${h(roleLabel(State.me))}` : 'Repairs & site visits'}</p><h1 class="title">${engMode ? 'My jobs' : 'Service'}</h1></div>
    <div style="display:flex;gap:8px">
      ${reportButton('service')}
      <button class="btn btn-primary desk-only" onclick="App.newJob()">${ico('plus', 'sm')} New job</button>
    </div>
  </div>
  ${top}
  <div class="section">
    <div class="scroll-x" style="margin-bottom:12px"><div class="chips">
      ${chip('Open', 'Open', scope.filter(j => JOB_OPEN.includes(j.status)).length)}${chip('Overdue', 'Overdue', overdue.length)}${chip('All', 'All', scope.length)}
      ${counts.map(([s]) => chip(s, s, scope.filter(j => j.status === s).length)).join('')}
    </div></div>
    <div class="toolbar">
      <div class="seg">${[['', 'All'], ['Indoor', 'Indoor'], ['Outdoor', 'Outdoor']].map(([v, l]) => `<button class="${State.jf.type === v ? 'on' : ''}" onclick="App.jf('type','${v}')">${l}</button>`).join('')}</div>
      ${engMode ? '' : `<select class="select sm-select" onchange="App.jf('eng',this.value)"><option value="">All engineers</option><option value="__none" ${State.jf.eng === '__none' ? 'selected' : ''}>Not assigned</option>${serviceStaff().map(s => `<option value="${h(s.username)}" ${State.jf.eng === s.username ? 'selected' : ''}>${h(s.name)}</option>`).join('')}</select>`}
    </div>
    <label class="search mob-only" style="display:flex;max-width:none;height:42px;margin-bottom:12px">${ico('search', 'sm')}<input placeholder="Search jobs, customer, device…" value="${h(State.jf.q)}" oninput="App.search(this.value)"></label>
    <div id="mod-results">${jobResults()}</div>
  </div>`;
}
function dueBadge(j) {
  if (!JOB_OPEN.includes(j.status) || !j.dueDate) return '';
  if (j.status === 'Ready') return '';
  const t = ymd();
  return `<span class="badge ${j.dueDate < t ? 'c-red' : j.dueDate === t ? 'c-orange' : 'c-blue'}">${h(relDay(j.dueDate))}</span>`;
}
function jobResults() {
  const list = filteredJobs();
  if (!list.length) return `<div class="list">${emptyBox('wrench', 'No jobs here', State.jf.q ? 'Try a different search.' : 'Nothing matches these filters.')}</div>`;
  const shown = list.slice(0, State.jf.limit);
  return `
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Job</th><th>Device & problem</th><th>Engineer</th><th>Status</th><th>Promised</th><th style="text-align:right">Charge</th></tr></thead><tbody>
  ${shown.map(j => `<tr onclick="App.openJob('${h(j.id)}')">
    <td><b>${h(j.customerName)}</b><small class="muted" style="display:block">${h(j.jobNo)} · ${h(j.jobType || '')}${j.priority && j.priority !== 'Normal' ? ` · <span style="color:var(--red)">${h(j.priority)}</span>` : ''}</small></td>
    <td><div class="ellip">${h(j.device || '')}${j.brandModel ? ' · ' + h(j.brandModel) : ''}</div><small class="muted ellip" style="display:block">${h(j.problem || '')}</small></td>
    <td class="nowrap">${j.assignedTo ? h(staffName(j.assignedTo)) : '<span class="muted">Not assigned</span>'}</td>
    <td>${jobBadge(j.status)}</td><td>${dueBadge(j) || (j.deliveredAt ? `<small class="muted">${h(fmtDate(j.deliveredAt))}</small>` : '<span class="muted">—</span>')}</td>
    <td style="text-align:right;font-variant-numeric:tabular-nums">${num(j.charge) ? rupees(num(j.charge)) : num(j.estimate) ? `<span class="muted">~${rupees(num(j.estimate))}</span>` : '—'}${jobBal(j) ? `<small style="display:block;color:var(--red)">due ${rupees(jobBal(j))}</small>` : ''}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="cust-cards list">${shown.map(j => `<button class="row" onclick="App.openJob('${h(j.id)}')"><div class="tl-dot ${JOB_CLS[j.status] || 'c-gray'}" style="width:40px;height:40px;border-radius:12px">${ico(j.jobType === 'Outdoor' ? 'pin' : 'wrench', 'sm')}</div>
    <div class="main-txt"><b>${h(j.customerName)} · ${h(j.device || '')}</b><small>${h(j.jobNo)} · ${h(j.problem || '')}</small></div>
    <div class="meta">${jobBadge(j.status)}${dueBadge(j) ? `<small>${h(relDay(j.dueDate))}</small>` : `<small>${h(staffName(j.assignedTo))}</small>`}</div></button>`).join('')}</div>
  ${list.length > shown.length ? `<div style="text-align:center;margin-top:16px"><button class="btn btn-ghost" onclick="App.jfMore()">Show more (${list.length - shown.length})</button></div>` : ''}
  <p class="muted tiny" style="text-align:center;margin-top:14px">${list.length} job${list.length === 1 ? '' : 's'}</p>`;
}

function jobForm(j, preset) {
  const edit = !!(j && j.id); j = Object.assign({}, j || {}, preset || {});
  const me = State.me.username;
  const opt = (arr, val) => arr.map(x => `<option ${x === val ? 'selected' : ''}>${h(x)}</option>`).join('');
  const engs = serviceStaff();
  if (j.assignedTo && !engs.find(s => s.username === j.assignedTo)) { const x = State.staff.find(s => s.username === j.assignedTo); if (x) engs.push(x); }
  const defEng = edit ? j.assignedTo : (!seesAll() ? me : '');
  const type = j.jobType || 'Indoor';
  const body = `<form id="job-form" autocomplete="off">
    ${preset && preset.status === 'Delivered' ? `<p class="hint warn" style="margin:0 0 14px">Enter the final charge before marking this job as Delivered.</p>` : ''}
    <div class="field"><span>Job type</span><div class="seg" id="jt-seg">${['Indoor', 'Outdoor'].map(t => `<button type="button" class="${type === t ? 'on' : ''}" data-t="${t}">${t === 'Indoor' ? 'Indoor · in shop' : 'Outdoor · site visit'}</button>`).join('')}</div></div>
    <input type="hidden" name="jobType" value="${h(type)}">
    <div class="grid-2">
      <label class="field"><span>Customer phone <em>*</em></span><input class="input" name="phone" type="tel" inputmode="tel" value="${h(j.phone)}" required placeholder="98470 12345" ${edit ? '' : 'autofocus'}></label>
      <label class="field"><span>Customer name <em>*</em></span><input class="input" name="customerName" value="${h(j.customerName)}" required></label>
    </div>
    <div id="job-link"></div>
    <label class="field" id="loc-field" style="${type === 'Outdoor' ? '' : 'display:none'}"><span>Site address / location</span><input class="input" name="location" value="${h(j.location)}" placeholder="e.g. Ameen Traders, Palayam"></label>
    <div class="grid-3">
      <label class="field"><span>Device</span><select class="select" name="device">${opt(DEVICES, j.device || 'Laptop')}</select></label>
      <label class="field"><span>Brand / model</span><input class="input" name="brandModel" value="${h(j.brandModel)}" placeholder="e.g. HP 15s"></label>
      <label class="field"><span>Serial no.</span><input class="input" name="serialNo" value="${h(j.serialNo)}"></label>
    </div>
    <label class="field"><span>Problem / work to do <em>*</em></span><input class="input" name="problem" value="${h(j.problem)}" required placeholder="e.g. No display, keyboard not working"></label>
    <label class="field" id="acc-field" style="${type === 'Indoor' ? '' : 'display:none'}"><span>Accessories received</span><input class="input" name="accessories" value="${h(j.accessories)}" placeholder="e.g. Charger, bag"></label>
    <div class="grid-2">
      <label class="field"><span>Engineer</span><select class="select" name="assignedTo"><option value="">Not assigned</option>${engs.map(s => `<option value="${h(s.username)}" ${defEng === s.username ? 'selected' : ''}>${h(s.name)}${s.title ? ' · ' + h(s.title) : ''}</option>`).join('')}</select></label>
      <label class="field"><span>Priority</span><select class="select" name="priority">${opt(PRIORITIES, j.priority || 'Normal')}</select></label>
    </div>
    <div class="field"><span>Promised date</span><input class="input" type="date" name="dueDate" value="${h(j.dueDate)}">
      <div class="chips" style="margin-top:8px">${[['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['1 week', 7]].map(([l, n]) => `<button type="button" class="chip" data-d="${n}">${l}</button>`).join('')}</div></div>
    ${edit ? `<div class="field"><span>Status</span><div class="chips" id="js-chips">${JOB_STATUSES.map(s => `<button type="button" class="chip ${j.status === s ? 'on' : ''}" data-s="${s}">${s}</button>`).join('')}</div></div>
      <input type="hidden" name="status" value="${h(j.status)}">
      <label class="field"><span>Diagnosis / work done</span><input class="input" name="diagnosis" value="${h(j.diagnosis)}" placeholder="e.g. Replaced keyboard, cleaned fan"></label>` : ''}
    <div class="grid-3">
      <label class="field"><span>Estimate (₹)</span><input class="input" name="estimate" inputmode="numeric" value="${h(j.estimate)}" placeholder="0"></label>
      ${edit ? `<label class="field"><span>Final charge (₹)</span><input class="input" name="charge" inputmode="numeric" value="${h(j.charge)}" placeholder="0"></label>
      <label class="field"><span>Received (₹)</span><input class="input" name="paid" inputmode="numeric" value="${h(j.paid)}" placeholder="0"></label>` : ''}
    </div>
    ${edit ? `<label class="field"><span>Payment mode</span><select class="select" name="paymentMode"><option value=""></option>${opt(PAY_MODES, j.paymentMode)}</select></label>` : ''}
    <label class="field"><span>Notes</span><textarea class="textarea" name="notes" style="min-height:64px">${h(j.notes)}</textarea></label>
  </form>`;
  const el = openOverlay(modal({ title: edit ? 'Edit job ' + h(j.jobNo) : 'New service job', sub: edit ? h(j.customerName) : 'Repair in the shop or a site visit', body, cls: 'wide',
    foot: `${edit && can('delete') ? `<button class="btn btn-danger" id="job-del" style="margin-right:auto">${ico('trash', 'sm')}</button>` : ''}<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="job-save">${edit ? 'Save changes' : 'Create job'}</button>` }));
  const f = el.querySelector('#job-form');
  el.querySelectorAll('#jt-seg button').forEach(b => b.onclick = () => {
    el.querySelectorAll('#jt-seg button').forEach(x => x.classList.toggle('on', x === b)); f.jobType.value = b.dataset.t;
    el.querySelector('#loc-field').style.display = b.dataset.t === 'Outdoor' ? '' : 'none';
    el.querySelector('#acc-field').style.display = b.dataset.t === 'Indoor' ? '' : 'none';
  });
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { f.dueDate.value = addDays(Number(b.dataset.d)); });
  el.querySelectorAll('#js-chips .chip').forEach(b => b.onclick = () => { el.querySelectorAll('#js-chips .chip').forEach(x => x.classList.toggle('on', x === b)); f.status.value = b.dataset.s; });
  let linked = null;
  f.phone.oninput = () => {
    const box = el.querySelector('#job-link'); linked = can('crm') && !edit ? matchCustomer(f.phone.value) : null;
    if (!linked) { box.innerHTML = ''; return; }
    if (!f.customerName.value) f.customerName.value = linked.name;
    if (!f.location.value && linked.location && f.jobType.value === 'Outdoor') f.location.value = linked.location;
    box.innerHTML = `<div class="hint link-hint">${ico('users', 'sm')}<span>Existing customer: <b>${h(linked.name)}</b>${linked.location ? ' · ' + h(linked.location) : ''}</span></div>`;
  };
  if (!edit) attachSuggest(f.customerName, p => { f.customerName.value = p.name; f.phone.value = p.phone || ''; if (p.location) f.location.value = p.location; f.phone.oninput(); f.problem.focus(); });
  if (preset && preset.status === 'Delivered') setTimeout(() => f.charge && f.charge.focus(), 80);
  el.querySelector('#job-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f).entries());
    if (data.jobType === 'Indoor') data.location = '';
    if (data.status === 'Delivered' && !num(data.charge) && !await confirmBox('No final charge?', 'This job will be marked Delivered with no charge (free / warranty). Continue?', 'Yes, deliver')) return;
    if (edit) data.id = j.id; else if (linked) data.customerId = linked.id;
    try {
      const saved = await busy(ev.currentTarget, () => api('saveJob', { job: data }));
      upsertJob(saved); delete State.activity[saved.id];
      closeOverlay(); toast(edit ? 'Job updated' : `Job ${saved.jobNo} created`);
      refreshUI();
      if (State.openJobId === saved.id) { renderJobDrawer(); loadActivity(saved.id); }
    } catch (e) { toast(e.message, true); }
  };
  const del = el.querySelector('#job-del');
  if (del) del.onclick = async () => {
    if (!await confirmBox(`Delete ${j.jobNo}?`, 'This removes the service job from the sheet permanently.', 'Delete', true)) return;
    try { await api('deleteJob', { id: j.id }); State.jobs = State.jobs.filter(x => x.id !== j.id); closeOverlay(true); toast('Job deleted'); refreshUI(); } catch (e) { toast(e.message, true); }
  };
}
function upsertJob(j) { const i = State.jobs.findIndex(x => x.id === j.id); if (i >= 0) State.jobs[i] = j; else State.jobs.unshift(j); }

function openJob(id) {
  if (stack.length && stack[stack.length - 1].el.classList.contains('drawer-scrim')) closeOverlay();
  State.openJobId = id;
  openOverlay(`<aside class="drawer" id="jdrawer"></aside>`, { cls: 'drawer-scrim', onClose: () => { State.openJobId = null; } });
  renderJobDrawer();
  loadActivity(id);
}
function renderJobDrawer() {
  const el = $('#jdrawer'); if (!el) return;
  const j = State.jobs.find(x => x.id === State.openJobId);
  if (!j) { el.innerHTML = `<div class="drawer-head"><button class="icon-btn" onclick="App.close()">${ico('back')}</button></div>${emptyBox('alert', 'Job not found', 'It may have been deleted.')}`; return; }
  const msg = j.status === 'Ready' ? `Hi ${j.customerName}, your ${j.device}${j.brandModel ? ' (' + j.brandModel + ')' : ''} is ready for pickup at ${SHOP.name}. Job ${j.jobNo}${num(j.charge) ? ', charge ₹' + num(j.charge) : ''}.`
    : `Hi ${j.customerName}, update on your ${j.device} (job ${j.jobNo}) at ${SHOP.name}: ${j.status}.`;
  el.innerHTML = `
  <div class="drawer-head">
    <button class="icon-btn" onclick="App.close()" title="Close">${ico('back')}</button>
    <div class="spacer"></div>
    <button class="btn btn-ghost btn-sm" onclick="App.editJob('${h(j.id)}')">${ico('edit', 'sm')} Edit</button>
  </div>
  <div class="drawer-body">
    <div class="profile"><div class="tl-dot ${JOB_CLS[j.status] || 'c-gray'}" style="width:64px;height:64px;border-radius:20px;margin:0 auto 12px">${ico(j.jobType === 'Outdoor' ? 'pin' : 'wrench', 'lg')}</div>
      <h3>${h(j.customerName)}</h3><div class="ph">${h(j.jobNo)} · ${h(fmtPhone(j.phone))}</div>
      <div class="badges">${jobBadge(j.status)}<span class="badge c-gray">${h(j.jobType || 'Indoor')}</span>${j.priority && j.priority !== 'Normal' ? `<span class="badge ${j.priority === 'Urgent' ? 'c-red' : 'c-orange'}">${h(j.priority)}</span>` : ''}${dueBadge(j)}</div></div>
    <div class="quick">
      <a href="tel:${h(digits(j.phone))}">${ico('phone')}Call</a>
      <a href="${h(waLink(j.phone))}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ico('chat')}WhatsApp</a>
      ${j.jobType === 'Outdoor' && j.location ? `<a href="https://maps.google.com/?q=${encodeURIComponent(j.location)}" target="_blank" rel="noopener">${ico('pin')}Map</a>` : `<a href="sms:${h(digits(j.phone))}">${ico('note')}SMS</a>`}
      <button onclick="App.editJob('${h(j.id)}')">${ico('edit')}Edit</button>
    </div>
    <div class="group-title">Status</div>
    <div class="fu-card"><div class="chips">${JOB_STATUSES.map(s => `<button class="chip ${j.status === s ? 'on' : ''}" onclick="App.jobStatus('${h(j.id)}','${s}',this)">${s}</button>`).join('')}</div></div>
    <div class="group-title">Add update</div>
    <div class="composer">
      <textarea id="job-note" placeholder="What was done? e.g. Ordered keyboard, customer informed…" rows="2"></textarea>
      <div class="composer-foot"><span class="muted tiny">Keeps the job up to date for the team</span><button class="btn btn-primary btn-sm" onclick="App.jobNote('${h(j.id)}', this)">Add</button></div>
    </div>
    <div class="group-title">Details</div>
    <div class="kv">
      ${[['Device', [j.device, j.brandModel].filter(Boolean).join(' · ')], ['Serial no.', j.serialNo], ['Problem', j.problem], ['Diagnosis / work', j.diagnosis], ['Accessories', j.accessories], ['Location', j.location],
         ['Engineer', j.assignedTo ? staffName(j.assignedTo) : 'Not assigned'], ['Promised', j.dueDate ? fmtDate(j.dueDate, true) : ''], ['Estimate', num(j.estimate) ? rupees(num(j.estimate)) : ''],
         ['Final charge', num(j.charge) ? rupees(num(j.charge)) : ''], ['Received', num(j.paid) ? rupees(num(j.paid)) + (j.paymentMode ? ' · ' + j.paymentMode : '') : ''], ['Balance due', jobBal(j) ? rupees(jobBal(j)) : ''],
         ['Received on', fmtDT(j.createdAt)], ['Completed', j.completedAt ? fmtDT(j.completedAt) : ''], ['Delivered', j.deliveredAt ? fmtDT(j.deliveredAt) : ''], ['Created by', staffName(j.createdBy)], ['Last updated', `${rel(j.updatedAt)} · ${staffName(j.updatedBy)}`]]
        .filter(x => x[1] && x[1] !== '—').map(([k, v]) => `<div><span>${k}</span><span>${h(v)}</span></div>`).join('')}
      ${j.notes ? `<div style="display:block"><span style="display:block;margin-bottom:4px">Notes</span><span style="display:block;text-align:left;font-weight:400;white-space:pre-wrap">${h(j.notes)}</span></div>` : ''}
    </div>
    <div class="group-title">History</div>
    <div class="timeline" id="jtimeline"></div>
  </div>`;
  renderJobTimeline();
}
function renderJobTimeline() {
  const el = $('#jtimeline'); if (!el) return;
  const acts = State.activity[State.openJobId];
  if (!acts) { el.innerHTML = `<div style="padding:20px;text-align:center"><span class="spinner dark" style="display:inline-block"></span></div>`; return; }
  el.innerHTML = acts.length ? acts.map(a => `<div class="tl-item">${actDot(a.type)}<div class="tl-body"><p>${h(a.text)}</p><small class="tl-who">${staffAv(a.user, 'xs')}${h(staffName(a.user))} · ${h(rel(a.timestamp))}</small></div></div>`).join('') : '<p class="muted">No history yet.</p>';
}
async function setJobStatus(id, s, btn) {
  const j = State.jobs.find(x => x.id === id); if (!j || j.status === s) return;
  if (s === 'Delivered' && !num(j.charge)) return jobForm(j, { status: 'Delivered' });
  try {
    const saved = await busy(btn, () => api('saveJob', { job: { id, status: s } }));
    upsertJob(saved); delete State.activity[id];
    toast('Status: ' + s); renderJobDrawer(); loadActivity(id); refreshUI();
  } catch (e) { toast(e.message, true); }
}
async function addJobNote(id, btn) {
  const ta = $('#job-note'); const text = ta.value.trim(); if (!text) { ta.focus(); return; }
  try {
    const r = await busy(btn, () => api('jobNote', { id, text }));
    upsertJob(r.job); if (State.activity[id]) State.activity[id].unshift(r.activity);
    toast('Update added'); renderJobDrawer(); refreshUI();
  } catch (e) { toast(e.message, true); }
}
function exportJobs() {
  const list = filteredJobs();
  csvDownload(`BestIndia_Service_${ymd()}.csv`, ['Job no.', 'Received', 'Type', 'Customer', 'Phone', 'Location', 'Device', 'Brand / model', 'Serial', 'Problem', 'Diagnosis', 'Engineer', 'Status', 'Promised', 'Completed', 'Delivered', 'Estimate', 'Charge', 'Received', 'Balance'],
    list.map(j => [j.jobNo, j.createdAt, j.jobType, j.customerName, j.phone, j.location, j.device, j.brandModel, j.serialNo, j.problem, j.diagnosis, staffName(j.assignedTo), j.status, j.dueDate, j.completedAt, j.deliveredAt, num(j.estimate), num(j.charge), num(j.paid), jobBal(j)]));
  toast(`${list.length} jobs exported`);
}

/* ======================= DASHBOARD (chairman) ======================= */
const DASH_PERIODS = [['today', 'Today'], ['week', '7 days'], ['month', 'This month'], ['lastmonth', 'Last month'], ['year', 'This FY']];
function dashNumbers(R) {
  const sales = State.sales.filter(s => inR(s.date || s.createdAt, R));
  const delivered = State.jobs.filter(j => j.status === 'Delivered' && inR(j.deliveredAt, R));
  const salesRev = sumBy(sales, s => num(s.amount)), servRev = sumBy(delivered, j => num(j.charge));
  const newC = State.customers.filter(c => inR(c.createdAt, R));
  const conv = State.customers.filter(c => isConvIn(c, R));
  const jobsIn = State.jobs.filter(j => inR(j.createdAt, R));
  return { sales, delivered, salesRev, servRev, total: salesRev + servRev, newC, conv, jobsIn };
}
function viewDashboard() {
  const R = rangeFor(State.dash.period); const P = prevRange(R); const t = ymd();
  const N = dashNumbers(R), PN = dashNumbers(P);
  const dues = sumBy(State.sales, saleBal) + sumBy(State.jobs, jobBal);
  const dueCount = State.sales.filter(saleBal).length + State.jobs.filter(jobBal).length;
  const openJobs = State.jobs.filter(j => JOB_OPEN.includes(j.status)); const odJobs = State.jobs.filter(jobOverdue);
  const odFU = State.customers.filter(c => needsFU(c) && c.followUpDate < t);
  const convRate = N.newC.length ? Math.round(N.newC.filter(c => c.status === 'Converted').length / N.newC.length * 100) : 0;
  // 14-day trend
  const days = []; for (let i = 13; i >= 0; i--) days.push(addDays(-i));
  const per = days.map(d => [sumBy(State.sales.filter(s => (s.date || '').slice(0, 10) === d), s => num(s.amount)), sumBy(State.jobs.filter(j => j.status === 'Delivered' && (j.deliveredAt || '').slice(0, 10) === d), j => num(j.charge))]);
  const mx = Math.max(1, ...per.map(p => p[0] + p[1]));
  // revenue by staff
  const byStaff = State.staff.map(s => [s, sumBy(N.sales.filter(x => x.soldBy === s.username), x => num(x.amount)) + sumBy(N.delivered.filter(j => j.assignedTo === s.username), j => num(j.charge))])
    .filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const bmax = Math.max(1, ...byStaff.map(x => x[1]));
  // sales by category
  const cat = {}; N.sales.forEach(s => { cat[s.category || 'Other'] = (cat[s.category || 'Other'] || 0) + num(s.amount); });
  const cats = Object.entries(cat).sort((a, b) => b[1] - a[1]); const cmax = Math.max(1, ...cats.map(c => c[1]));
  // service pipeline
  const pipe = JOB_OPEN.map(s => [s, State.jobs.filter(j => j.status === s).length]); const ptot = openJobs.length || 1;
  let acc = 0; const grad = pipe.filter(x => x[1]).map(([s, n]) => { const a = acc; acc += n / ptot * 360; return `${JOB_COLOR[s]} ${a}deg ${acc}deg`; }).join(',') || 'var(--fill) 0 360deg';
  // attention
  const fuByStaff = {}; odFU.forEach(c => { fuByStaff[c.assignedTo] = (fuByStaff[c.assignedTo] || 0) + 1; });
  const bigDues = State.sales.filter(saleBal).map(s => ({ name: s.customerName || 'Walk-in', what: s.items, bal: saleBal(s), click: `App.editSale('${h(s.id)}')`, when: s.date }))
    .concat(State.jobs.filter(jobBal).map(j => ({ name: j.customerName, what: j.jobNo + ' · ' + j.device, bal: jobBal(j), click: `App.openJob('${h(j.id)}')`, when: (j.deliveredAt || '').slice(0, 10) })))
    .sort((a, b) => b.bal - a.bal).slice(0, 5);
  return `
  <div class="page-head">
    <div><p class="eyebrow">${h(R.label)}</p><h1 class="title">${greeting()}, ${h(State.me.name.split(' ')[0])}.</h1></div>
    <div style="display:flex;gap:8px">${createOptions().length ? `<button class="btn btn-primary desk-only" onclick="App.quickAdd(this)">${ico('plus', 'sm')} New</button>` : ''}</div>
  </div>
  <div class="card pad" style="margin-bottom:18px;padding:14px 16px">${periodChips(State.dash.period, DASH_PERIODS, "App.dash('period',")}</div>
  <div class="tiles">
    <div class="tile hero"><div class="t-ico">${ico('rupee')}</div><div class="t-val">${shortRs(N.total)}</div><div class="t-lbl">Total revenue ${delta(N.total, PN.total)}</div></div>
    <button class="tile" onclick="App.go('sales')"><div class="t-ico c-green">${ico('cart')}</div><div class="t-val">${shortRs(N.salesRev)}</div><div class="t-lbl">Sales · ${N.sales.length} bills ${delta(N.salesRev, PN.salesRev)}</div></button>
    <button class="tile" onclick="App.go('service')"><div class="t-ico c-teal">${ico('wrench')}</div><div class="t-val">${shortRs(N.servRev)}</div><div class="t-lbl">Service · ${N.delivered.length} jobs delivered ${delta(N.servRev, PN.servRev)}</div></button>
    <button class="tile" onclick="${can('accounts') ? `App.go('debtors')` : `App.sf('period','dues');App.go('sales')`}"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${shortRs(dues)}</div><div class="t-lbl">To collect · ${dueCount} pending</div></button>
  </div>
  <div class="tiles" style="margin-top:14px">
    <button class="tile" onclick="App.goFilter('all','month')"><div class="t-ico c-blue">${ico('userPlus')}</div><div class="t-val">${N.newC.length}</div><div class="t-lbl">New customers · ${convRate}% converted</div></button>
    <div class="tile"><div class="t-ico c-green">${ico('trophy')}</div><div class="t-val">${N.conv.length}</div><div class="t-lbl">Enquiries converted ${delta(N.conv.length, PN.conv.length)}</div></div>
    <button class="tile" onclick="App.jf('status','Open');App.go('service')"><div class="t-ico c-purple">${ico('wrench')}</div><div class="t-val">${openJobs.length}</div><div class="t-lbl">Open service jobs · <span style="color:var(--red)">${odJobs.length} overdue</span></div></button>
    <button class="tile" onclick="App.setFuScope('all');App.go('followups')"><div class="t-ico c-orange">${ico('bell')}</div><div class="t-val">${odFU.length}</div><div class="t-lbl">Overdue follow-ups</div></button>
  </div>

  <div class="two-col section">
    <div class="card pad">
      <div class="section-head" style="margin-bottom:4px"><b>Revenue · last 14 days</b><span class="legend-inline"><i style="background:var(--accent)"></i>Sales <i style="background:var(--teal)"></i>Service</span></div>
      <div class="bars tall">${per.map(([sa, sv], i) => `<div class="bar ${i === 13 ? 'today' : ''}" title="${h(fmtDate(days[i]))}: sales ${rupees(sa)}, service ${rupees(sv)}"><em>${sa + sv ? kfmt(sa + sv) : ''}</em><div class="stk" style="height:${Math.round((sa + sv) / mx * 100)}%"><i style="flex:${sv};background:var(--teal)"></i><i style="flex:${sa}"></i></div><span>${parse(days[i]).getDate()}</span></div>`).join('')}</div>
    </div>
    <div class="card pad" id="dash-team">${dashTeam()}</div>
  </div>

  <div class="two-col even section" style="margin-top:18px">
    <div class="card pad"><div class="section-head" style="margin-bottom:8px"><b>Revenue by staff</b><span class="muted tiny">sales + service delivered</span></div>
      ${byStaff.length ? byStaff.map(([s, v]) => `<div class="hbar"><span class="nm" style="width:90px">${h(s.name)}</span><span class="track"><i style="width:${v / bmax * 100}%"></i></span><b style="width:84px">${shortRs(v)}</b></div>`).join('') : '<p class="muted">No revenue in this period yet.</p>'}</div>
    <div class="card pad"><b>Service jobs in progress</b>
      <div class="donut-wrap" style="margin-top:16px"><div class="donut" style="background:conic-gradient(${grad})"><div class="c"><span>${openJobs.length}</span><small>open jobs</small></div></div>
      <div class="legend">${pipe.map(([s, n]) => `<div><i style="background:${JOB_COLOR[s]}"></i>${s}<b>${n}</b></div>`).join('')}</div></div></div>
  </div>

  <div class="rp-3 section" style="margin-top:18px">
    <div class="card pad"><div class="section-head" style="margin-bottom:8px"><b>Sales by category</b></div>
      ${cats.length ? cats.slice(0, 8).map(([c, v]) => `<div class="hbar"><span class="nm" style="width:96px">${h(c)}</span><span class="track"><i style="width:${v / cmax * 100}%;background:var(--purple)"></i></span><b style="width:76px">${shortRs(v)}</b></div>`).join('') : '<p class="muted">No sales in this period.</p>'}</div>
    <div class="card pad"><div class="section-head" style="margin-bottom:8px"><b>Needs attention</b></div>
      <div class="att">
        ${odJobs.length ? `<button onclick="App.jf('status','Overdue');App.go('service')"><span class="badge c-red">${odJobs.length}</span>Service jobs past promised date</button>` : ''}
        ${Object.entries(fuByStaff).sort((a, b) => b[1] - a[1]).map(([u, n]) => `<button onclick="App.setFuScope('all');App.go('followups')"><span class="badge c-orange">${n}</span>Overdue follow-ups · ${h(staffName(u))}</button>`).join('')}
        ${State.jobs.filter(j => j.status === 'Ready' && (Date.now() - (parse(j.completedAt) || Date.now())) > 3 * 86400000).length ? `<button onclick="App.jf('status','Ready');App.go('service')"><span class="badge c-purple">${State.jobs.filter(j => j.status === 'Ready' && (Date.now() - (parse(j.completedAt) || Date.now())) > 3 * 86400000).length}</span>Ready jobs not collected for 3+ days</button>` : ''}
        ${!odJobs.length && !odFU.length ? '<p class="muted" style="margin:0">Nothing urgent. 👍</p>' : ''}
      </div></div>
    <div class="card pad"><div class="section-head" style="margin-bottom:8px"><b>Biggest dues</b><span class="muted tiny">${rupees(dues)}</span></div>
      ${bigDues.length ? bigDues.map(d => `<button class="due-row" onclick="${d.click}"><div style="min-width:0"><b>${h(d.name)}</b><small>${h(d.what)}</small></div><b style="color:var(--red)">${rupees(d.bal)}</b></button>`).join('') : '<p class="muted">No pending payments.</p>'}</div>
  </div>`;
}
function dashTeam() {
  if (!can('performance')) {
    const t = ymd();
    const rows = State.staff.map(s => [s, State.sales.filter(x => x.soldBy === s.username && (x.date || '').slice(0, 10) === t).length]).sort((a, b) => b[1] - a[1]);
    return `<div class="section-head" style="margin-bottom:8px"><b>Team today</b><span class="muted tiny">bills</span></div>${rows.map(([s, n]) => `<div class="hbar"><span class="nm" style="width:110px">${h(s.name)}</span><b>${n}</b></div>`).join('')}`;
  }
  const R = rangeFor(State.perf.period);
  const head = `<div class="section-head" style="margin-bottom:8px"><b>Team performance</b><button class="link-btn" onclick="App.go('performance')">Details ${ico('chev', 'sm')}</button></div>`;
  if (!State.perf.acts || State.perf.key !== R.from + '|' + R.to) return head + `<div style="padding:30px;text-align:center"><span class="spinner dark" style="display:inline-block"></span></div>`;
  const rows = computePerf(R, State.perf.acts).sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));
  return head + `<p class="muted tiny" style="margin:-4px 0 8px">${h(R.label)}</p><div class="team-mini">${rows.map(r => { const rt = rate(r.overall); return `<button onclick="App.perfOpen('${h(r.u)}')">${staffAv(r.u, 'sm')}<span class="nm"><b>${h(r.name)}</b><small>${h(r.title)}</small></span><span class="rt ${rt.cls}">${r.overall == null ? '—' : r.overall}</span></button>`; }).join('')}</div>`;
}

/* ======================= STAFF PERFORMANCE ======================= */
const PERF_PERIODS = [['week', 'Last 7 days'], ['month', 'This month'], ['30', 'Last 30 days'], ['lastmonth', 'Last month']];
const PERF_SORTS = [['score', 'Overall'], ['punct', 'Punctuality'], ['work', 'Work rate'], ['results', 'Results'], ['fresh', 'Up to date'], ['revenue', 'Revenue'], ['name', 'Name']];
const PERF_W = { punct: 35, work: 25, results: 25, fresh: 15 };
function rate(s) {
  if (s == null) return { cls: 'rt-n', label: 'No data' };
  if (s >= 75) return { cls: 'rt-g', label: 'On track' };
  if (s >= 50) return { cls: 'rt-o', label: 'Needs attention' };
  return { cls: 'rt-r', label: 'Poor' };
}
function workingDays(R) {
  let n = 0; let d = R.from; const end = R.to > ymd() ? ymd() : R.to;
  for (let i = 0; d <= end && i < 400; i++) { if (parse(d).getDay() !== 0) n++; d = addDays(1, d); }
  return Math.max(1, n);
}
function computePerf(R, acts) {
  const t = ymd(); const wd = workingDays(R);
  const [oh, om] = String(SHOP.openTime || '09:30').split(':').map(Number);
  const limit = oh * 60 + om + Number(SHOP.lateGraceMin == null ? 15 : SHOP.lateGraceMin);
  const byUser = {}; (acts || []).forEach(a => (byUser[a.user] = byUser[a.user] || []).push(a));
  const daysSince = s => { const d = parse(s); return d ? (Date.now() - d.getTime()) / 86400000 : 99; };
  const rows = State.staff.filter(s => s.username !== State.me.username).map(s => {
    const u = s.username; const A = byUser[u] || [];
    const work = A.filter(a => a.type !== 'login'); const logins = A.filter(a => a.type === 'login');
    const first = {}; logins.forEach(a => { const d = a.timestamp.slice(0, 10); if (!first[d] || a.timestamp < first[d]) first[d] = a.timestamp; });
    const loginDays = Object.keys(first);
    const lateDays = loginDays.filter(d => { const x = parse(first[d]); return x.getHours() * 60 + x.getMinutes() > limit; });
    const metas = work.map(a => { try { return a.meta ? JSON.parse(a.meta) : null; } catch (e) { return null; } }).filter(Boolean);
    const fuM = metas.filter(m => !m.job), jobM = metas.filter(m => m.job);
    const fuOn = fuM.filter(m => m.onTime).length, jobOn = jobM.filter(m => m.onTime).length;
    const odFU = State.customers.filter(c => c.assignedTo === u && needsFU(c) && c.followUpDate < t);
    const odJobs = State.jobs.filter(j => j.assignedTo === u && jobOverdue(j));
    const updDen = fuM.length + odFU.length + jobM.length + odJobs.length;
    const updRate = updDen ? (fuOn + jobOn) / updDen : null;
    const arrival = loginDays.length ? (loginDays.length - lateDays.length) / loginDays.length : null;
    const pParts = [[updRate, 2], [arrival, 1]].filter(p => p[0] != null);
    const punct = pParts.length ? sumBy(pParts, p => p[0] * p[1]) / sumBy(pParts, p => p[1]) : null;
    const activeDays = new Set(A.map(a => a.timestamp.slice(0, 10))).size;
    const perDay = work.length / wd;
    const salesRev = sumBy(State.sales.filter(x => x.soldBy === u && inR(x.date || x.createdAt, R)), x => num(x.amount));
    const servJobs = State.jobs.filter(j => j.assignedTo === u && j.status === 'Delivered' && inR(j.deliveredAt, R));
    const servRev = sumBy(servJobs, j => num(j.charge));
    const conv = State.customers.filter(c => c.assignedTo === u && isConvIn(c, R)).length;
    const hasRecords = State.sales.some(x => x.soldBy === u) || State.jobs.some(j => j.assignedTo === u) || State.customers.some(c => c.assignedTo === u);
    const openC = State.customers.filter(c => c.assignedTo === u && OPEN.includes(c.status));
    const openJ = State.jobs.filter(j => j.assignedTo === u && JOB_OPEN.includes(j.status));
    const staleC = openC.filter(c => (!c.followUpDate || c.followUpDate < t) && daysSince(c.updatedAt) > 3);
    const staleJ = openJ.filter(j => daysSince(j.updatedAt) > 3);
    const openN = openC.length + openJ.length;
    const lastAct = A.reduce((m, a) => a.timestamp > m ? a.timestamp : m, '');
    return { u, name: s.name, title: s.title || roleLabel(s), lastLogin: [s.lastLogin || '', lastAct].sort().pop(), raw: {
      acts: work.length, perDay, activeDays, wd, loginDays: loginDays.length, lateDays: lateDays.length, firstTimes: first,
      fuHandled: fuM.length, fuOn, jobsDone: jobM.length, jobOn, odFU, odJobs, updRate, arrival,
      salesRev, servRev, revenue: salesRev + servRev, conv, servJobs: servJobs.length, hasRecords, openN, staleC, staleJ },
      punct, hasData: A.length > 0 };
  });
  const mPD = Math.max(0, ...rows.map(r => r.raw.perDay));
  const mRev = Math.max(0, ...rows.map(r => r.raw.revenue)), mConv = Math.max(0, ...rows.map(r => r.raw.conv)), mJobs = Math.max(0, ...rows.map(r => r.raw.servJobs));
  rows.forEach(r => {
    const x = r.raw; const sc = {};
    sc.punct = r.punct == null ? null : Math.round(r.punct * 100);
    sc.work = !r.hasData ? null : mPD ? Math.round(Math.min(1, x.perDay / (mPD * 0.8)) * 100) : 0;
    sc.results = !x.hasRecords ? null : Math.round(Math.max(mRev ? x.revenue / mRev : 0, mConv ? x.conv / mConv : 0, mJobs ? x.servJobs / mJobs : 0) * 100);
    sc.fresh = x.openN ? Math.round((1 - (x.staleC.length + x.staleJ.length) / x.openN) * 100) : null;
    const parts = Object.keys(PERF_W).filter(k => sc[k] != null);
    r.sc = sc;
    r.overall = parts.length ? Math.round(sumBy(parts, k => sc[k] * PERF_W[k]) / sumBy(parts, k => PERF_W[k])) : null;
  });
  return rows;
}
async function afterPerf() {
  if (!can('performance')) return;
  const R = rangeFor(State.perf.period); const key = R.from + '|' + R.to;
  const fresh = State.perf.acts && State.perf.key === key && Date.now() - (State.perf.at || 0) < 5 * 60000;
  if (fresh) { if (State.view === 'overview') paintOverviewStaff(); return; }
  if (State.perf.loading === key) return;
  State.perf.loading = key;
  try {
    const acts = await api('perfData', { from: R.from, to: R.to });
    State.perf.acts = acts; State.perf.key = key; State.perf.at = Date.now();
  } catch (e) { toast(e.message, true); State.perf.at = Date.now(); }
  finally { State.perf.loading = false; }
  if (State.view === 'performance') { const v = $('#view'); if (v && !stack.length) { v.innerHTML = viewPerformance(); } }
  if (State.view === 'dashboard') { const d = $('#dash-team'); if (d) d.innerHTML = dashTeam(); }
  if (State.view === 'overview') paintOverviewStaff();
}
const pill = (s, sub) => { const r = rate(s); return `<span class="score ${r.cls}"><i></i><b>${s == null ? '—' : s}</b>${sub ? `<small>${sub}</small>` : ''}</span>`; };
const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
function perfSubs(r) {
  const x = r.raw;
  return {
    punct: x.updRate == null && x.arrival == null ? 'no data' : `${x.fuOn + x.jobOn}/${x.fuHandled + x.jobsDone + x.odFU.length + x.odJobs.length} on time${x.loginDays ? ` · late ${x.lateDays}/${x.loginDays}d` : ''}`,
    work: `${x.perDay.toFixed(1)} updates/day`,
    results: x.revenue ? shortRs(x.revenue) + (x.conv ? ` · ${x.conv} conv.` : '') : x.conv ? `${x.conv} converted` : x.hasRecords ? 'nothing yet' : 'n/a',
    fresh: x.openN ? `${x.staleC.length + x.staleJ.length} of ${x.openN} stale` : 'no open items'
  };
}
function viewPerformance() {
  const R = rangeFor(State.perf.period); const key = R.from + '|' + R.to;
  const ready = State.perf.acts && State.perf.key === key;
  const head = `
  <div class="page-head">
    <div><p class="eyebrow">${h(R.label)} · ${workingDays(R)} working days</p><h1 class="title">Staff performance</h1></div>
    <div class="head-btns">${reportButton('staff')}<button class="btn btn-ghost" onclick="App.perfRefresh(this)" title="Refresh">${ico('refresh', 'sm')}</button></div>
  </div>
  <div class="card pad" style="margin-bottom:18px;padding:14px 16px">
    ${periodChips(State.perf.period, PERF_PERIODS, "App.perf('period',")}
    <div class="toolbar" style="margin:12px 0 0"><span class="muted tiny" style="font-weight:600">SORT BY</span>
      <div class="scroll-x" style="flex:1"><div class="chips">${PERF_SORTS.map(([v, l]) => `<button class="chip sm ${State.perf.sort === v ? 'on' : ''}" onclick="App.perf('sort','${v}')">${l}</button>`).join('')}</div></div></div>
  </div>`;
  if (!ready) return head + `<div class="list"><div class="empty"><span class="spinner dark" style="margin:auto;display:block"></span><p style="margin-top:14px">Loading team activity…</p></div></div>`;
  const rows = computePerf(R, State.perf.acts);
  const key2 = State.perf.sort;
  const val = r => key2 === 'score' ? r.overall : key2 === 'revenue' ? r.raw.revenue : r.sc[key2];
  rows.sort((a, b) => key2 === 'name' ? a.name.localeCompare(b.name) : ((val(b) ?? -1) - (val(a) ?? -1)) || a.name.localeCompare(b.name));
  const cnt = c => rows.filter(r => rate(r.overall).cls === c).length;
  const rated = rows.filter(r => r.overall != null);
  const avg = rated.length ? Math.round(sumBy(rated, r => r.overall) / rated.length) : null;
  return head + `
  <div class="tiles">
    <div class="tile"><div class="t-ico c-green">${ico('check')}</div><div class="t-val">${cnt('rt-g')}</div><div class="t-lbl">On track (75+)</div></div>
    <div class="tile"><div class="t-ico c-orange">${ico('alert')}</div><div class="t-val">${cnt('rt-o')}</div><div class="t-lbl">Needs attention (50–74)</div></div>
    <div class="tile"><div class="t-ico c-red">${ico('x')}</div><div class="t-val">${cnt('rt-r')}</div><div class="t-lbl">Poor (below 50)</div></div>
    <div class="tile hero"><div class="t-ico">${ico('target')}</div><div class="t-val">${avg == null ? '—' : avg}</div><div class="t-lbl">Team average score</div></div>
  </div>
  <div class="section">
    <div class="table-wrap perf-table"><table class="tbl"><thead><tr><th>Employee</th><th>Overall</th><th>Punctuality</th><th>Work rate</th><th>Results</th><th>Up to date</th><th>Last seen</th></tr></thead><tbody>
    ${rows.map(r => { const sb = perfSubs(r); const rt = rate(r.overall); return `<tr class="${rt.cls}" onclick="App.perfOpen('${h(r.u)}')">
      <td><div class="who">${staffAv(r.u, 'sm')}<div><b>${h(r.name)}</b><small>${h(r.title)}</small></div></div></td>
      <td><span class="overall ${rt.cls}"><b>${r.overall == null ? '—' : r.overall}</b>${rt.label}</span></td>
      <td>${pill(r.sc.punct, sb.punct)}</td><td>${pill(r.sc.work, sb.work)}</td><td>${pill(r.sc.results, sb.results)}</td><td>${pill(r.sc.fresh, sb.fresh)}</td>
      <td class="nowrap muted">${h(r.lastLogin ? rel(r.lastLogin) : 'never')}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="mob-cards">${rows.map(r => { const rt = rate(r.overall); const sb = perfSubs(r); return `<button class="perf-card ${rt.cls}" onclick="App.perfOpen('${h(r.u)}')">
      <div class="top">${staffAv(r.u, '')}<div style="flex:1;min-width:0"><b>${h(r.name)}</b><small>${h(r.title)}</small></div><span class="overall ${rt.cls}"><b>${r.overall == null ? '—' : r.overall}</b>${rt.label}</span></div>
      <div class="grid4">${[['punct', 'Punctuality'], ['work', 'Work rate'], ['results', 'Results'], ['fresh', 'Up to date']].map(([k, l]) => `<div><small>${l}</small>${pill(r.sc[k])}<em>${h(sb[k])}</em></div>`).join('')}</div></button>`; }).join('')}</div>
  </div>
  <details class="card pad how section">
    <summary><b>How the scores work</b></summary>
    <div class="how-grid">
      <div><b>${ico('clock', 'sm')} Punctuality (${PERF_W.punct}%)</b><p>Follow-ups and service jobs handled on or before their due date (counts double), plus first sign-in of the day by ${h(SHOP.openTime || '09:30')} (${SHOP.lateGraceMin == null ? 15 : SHOP.lateGraceMin} min grace). Items that are overdue right now count as late.</p></div>
      <div><b>${ico('activity', 'sm')} Work rate (${PERF_W.work}%)</b><p>Updates logged per working day (calls, notes, visits, sales, job updates). Compared with the most active person on the team.</p></div>
      <div><b>${ico('trophy', 'sm')} Results (${PERF_W.results}%)</b><p>Sales value, service revenue delivered and enquiries converted. Compared with the team's best. Shown as “n/a” for people with no customers, sales or jobs.</p></div>
      <div><b>${ico('refresh', 'sm')} Up to date (${PERF_W.fresh}%)</b><p>Share of their open customers and jobs touched in the last 3 days. Customers waiting on a future follow-up date don't count as stale.</p></div>
    </div>
    <p class="muted" style="margin:12px 0 0"><span class="score rt-g"><i></i><b>75+</b></span> On track &nbsp; <span class="score rt-o"><i></i><b>50–74</b></span> Needs attention &nbsp; <span class="score rt-r"><i></i><b>&lt;50</b></span> Poor &nbsp; <span class="score rt-n"><i></i><b>—</b></span> Not enough data. You are not listed yourself.</p>
  </details>`;
}
function perfDetail(u) {
  const R = rangeFor(State.perf.period);
  if (!State.perf.acts) return;
  const r = computePerf(R, State.perf.acts).find(x => x.u === u); if (!r) return;
  const x = r.raw; const rt = rate(r.overall); const t = ymd();
  const bar = (k, l, sub) => { const s = r.sc[k]; const c = rate(s).cls; return `<div class="pd-bar"><div class="pd-l"><b>${l}</b><small>${h(sub)}</small></div><div class="pd-track"><i class="${c}" style="width:${s == null ? 0 : s}%"></i></div><span class="score ${c}"><i></i><b>${s == null ? '—' : s}</b></span></div>`; };
  const tips = [];
  if (x.odFU.length) tips.push(`${x.odFU.length} follow-up${x.odFU.length > 1 ? 's are' : ' is'} overdue right now — clearing them lifts punctuality straight away.`);
  if (x.odJobs.length) tips.push(`${x.odJobs.length} service job${x.odJobs.length > 1 ? 's are' : ' is'} past the promised date.`);
  if (x.loginDays && x.lateDays / x.loginDays > 0.3) tips.push(`Signed in late on ${x.lateDays} of ${x.loginDays} days (after ${SHOP.openTime || '09:30'} + grace).`);
  if (x.staleC.length + x.staleJ.length) tips.push(`${x.staleC.length + x.staleJ.length} open item${x.staleC.length + x.staleJ.length > 1 ? 's have' : ' has'} not been updated for 3+ days.`);
  if (r.sc.work != null && r.sc.work < 50) tips.push('Few updates logged — ask them to note every call, visit and job step in the app.');
  const days = Object.keys(x.firstTimes).sort().slice(-12);
  const body = `
    <div class="pd-head"><span class="overall big ${rt.cls}"><b>${r.overall == null ? '—' : r.overall}</b>${rt.label}</span>
      <div class="pd-facts"><div><b>${Math.min(x.activeDays, x.wd)}</b><small>active days of ${x.wd}</small></div><div><b>${x.acts}</b><small>updates logged</small></div><div><b>${shortRs(x.revenue)}</b><small>revenue</small></div><div><b>${x.conv}</b><small>converted</small></div></div></div>
    ${bar('punct', 'Punctuality', [x.fuHandled + x.odFU.length ? `Follow-ups on time ${x.fuOn}/${x.fuHandled + x.odFU.length}` : '', x.jobsDone + x.odJobs.length ? `jobs on time ${x.jobOn}/${x.jobsDone + x.odJobs.length}` : '', x.loginDays ? `on-time sign-in ${pct(x.arrival)}` : ''].filter(Boolean).join(' · ') || 'No due items or sign-ins yet')}
    ${bar('work', 'Work rate', `${x.perDay.toFixed(1)} updates per working day`)}
    ${bar('results', 'Results', `Sales ${rupees(x.salesRev)} · service ${rupees(x.servRev)} (${x.servJobs} jobs) · ${x.conv} converted`)}
    ${bar('fresh', 'Up to date', x.openN ? `${x.openN - x.staleC.length - x.staleJ.length} of ${x.openN} open items updated in the last 3 days` : 'No open customers or jobs')}
    ${tips.length ? `<div class="group-title" style="margin-top:20px">What to look at</div><ul class="tips">${tips.map(s => `<li>${h(s)}</li>`).join('')}</ul>` : `<p class="hint" style="margin:18px 2px 0;color:var(--green);font-weight:600">No issues found for this period.</p>`}
    ${days.length ? `<div class="group-title" style="margin-top:20px">First sign-in of the day</div><div class="chips">${days.map(d => { const tm = parse(x.firstTimes[d]); const [oh, om] = String(SHOP.openTime || '09:30').split(':').map(Number); const late = tm.getHours() * 60 + tm.getMinutes() > oh * 60 + om + Number(SHOP.lateGraceMin == null ? 15 : SHOP.lateGraceMin); return `<span class="badge ${late ? 'c-red' : 'c-green'}" title="${h(fmtDate(d, true))}">${parse(d).getDate()} ${MON[parse(d).getMonth()]} · ${fmtTime(tm)}</span>`; }).join('')}</div>` : ''}
    ${x.odFU.length || x.odJobs.length ? `<div class="group-title" style="margin-top:20px">Overdue now</div><div class="list">${x.odFU.slice(0, 6).map(c => `<button class="row" onclick="App.close();App.open('${h(c.id)}')">${avatar(c.name, 'sm', c.id)}<div class="main-txt"><b>${h(c.name)}</b><small>Follow-up · ${h(c.requirement || '')}</small></div><div class="meta"><span class="badge c-red">${h(relDay(c.followUpDate))}</span></div></button>`).join('')}
      ${x.odJobs.slice(0, 6).map(j => `<button class="row" onclick="App.close();App.openJob('${h(j.id)}')"><div class="tl-dot c-red">${ico('wrench', 'sm')}</div><div class="main-txt"><b>${h(j.jobNo)} · ${h(j.customerName)}</b><small>${h(j.device || '')} · ${h(j.problem || '')}</small></div><div class="meta"><span class="badge c-red">${h(relDay(j.dueDate))}</span></div></button>`).join('')}</div>` : ''}`;
  openOverlay(modal({ title: h(r.name), sub: `${h(r.title)} · ${h(R.label)}`, body, cls: 'wide' }));
}

/* ======================= DEBTORS (money customers owe us) ======================= */
const creditBal = c => Math.max(0, num(c.amount) - num(c.paid));
const daysAgo = d => { const x = parse(d); return x ? Math.max(0, Math.floor((parse(ymd()) - x) / 86400000)) : 0; };
function dueItems() {
  return State.sales.filter(saleBal).map(s => ({ kind: 'sale', id: s.id, date: (s.date || s.createdAt || '').slice(0, 10), name: s.customerName || 'Walk-in', phone: s.phone,
    ref: s.billNo || 'Sale', what: s.items, amount: num(s.amount), paid: num(s.paid), bal: saleBal(s), by: s.soldBy }))
    .concat(State.jobs.filter(jobBal).map(j => ({ kind: 'job', id: j.id, date: (j.deliveredAt || j.createdAt || '').slice(0, 10), name: j.customerName, phone: j.phone,
      ref: j.jobNo, what: `${j.device || ''} · ${j.problem || ''}`, amount: num(j.charge), paid: num(j.paid), bal: jobBal(j), by: j.assignedTo })))
    .sort((a, b) => a.date.localeCompare(b.date));
}
function groupBy(items, keyFn, nameFn) {
  const m = {};
  items.forEach(d => { const k = keyFn(d); (m[k] = m[k] || { key: k, name: nameFn(d), phone: d.phone, items: [], bal: 0, oldest: d.date }).items.push(d); m[k].bal += d.bal; if (d.date < m[k].oldest) m[k].oldest = d.date; });
  return Object.values(m).sort((a, b) => b.bal - a.bal);
}
const debtorGroups = items => groupBy(items, d => last10(d.phone) || d.name.trim().toLowerCase(), d => d.name);
const ageBadge = date => { const n = daysAgo(date); return `<span class="badge ${toneBadge[debtTone(date)]}">${n === 0 ? 'Today' : n + ' day' + (n > 1 ? 's' : '')}</span>`; };

function viewDebtors() {
  const all = dueItems(); const groups = debtorGroups(all); const f = State.df;
  const q = f.q.trim().toLowerCase(); const qd = digits(q);
  groups.forEach(g => { g.newest = g.items.reduce((m, d) => d.date > m ? d.date : m, ''); });
  const sorters = { amount: (a, b) => b.bal - a.bal, 'amount-asc': (a, b) => a.bal - b.bal, oldest: (a, b) => a.oldest.localeCompare(b.oldest), newest: (a, b) => b.newest.localeCompare(a.newest), name: (a, b) => a.name.localeCompare(b.name) };
  groups.sort(sorters[f.sort] || sorters.amount);
  const list = groups.filter(g => (f.age === '30' ? daysAgo(g.oldest) > 30 : f.age === '60' ? daysAgo(g.oldest) > 60 : true)
    && (!q || g.name.toLowerCase().includes(q) || (qd.length >= 3 && digits(g.phone).includes(qd))));
  const old30 = sumBy(all.filter(d => daysAgo(d.date) > 30), d => d.bal);
  return `
  <div class="page-head">
    <div><p class="eyebrow">Money customers owe the shop</p><h1 class="title">Debtors</h1></div>
    <div class="head-btns">${reportButton('debtors')}</div>
  </div>
  <div class="tiles">
    <div class="tile hero"><div class="t-ico">${ico('in')}</div><div class="t-val">${shortRs(sumBy(all, d => d.bal))}</div><div class="t-lbl">To collect in total</div></div>
    <div class="tile"><div class="t-ico c-blue">${ico('users')}</div><div class="t-val">${groups.length}</div><div class="t-lbl">Customers owing · ${all.length} bills</div></div>
    <button class="tile" onclick="App.df('age','30')"><div class="t-ico c-orange">${ico('clock')}</div><div class="t-val">${shortRs(old30)}</div><div class="t-lbl">Pending over 30 days</div></button>
    <div class="tile"><div class="t-ico c-green">${ico('cart')}</div><div class="t-val">${shortRs(sumBy(all.filter(d => d.kind === 'sale'), d => d.bal))}</div><div class="t-lbl">From sales · ${shortRs(sumBy(all.filter(d => d.kind === 'job'), d => d.bal))} from service</div></div>
  </div>
  <div class="toolbar" style="margin-top:22px">
    <div class="tone-legend"><span class="amt-green">● up to 15 days</span><span class="amt-yellow">● 16–25 days</span><span class="amt-orange">● 26–30 days</span><span class="amt-red">● over 30 days</span></div>
    <div class="seg">${[['', 'All'], ['30', 'Over 30 days'], ['60', 'Over 60 days']].map(([v, l]) => `<button class="${f.age === v ? 'on' : ''}" onclick="App.df('age','${v}')">${l}</button>`).join('')}</div>
    <label class="sort-pick">${ico('chart', 'sm')}<select class="select sm-select" onchange="App.df('sort',this.value)">${[['amount', 'Amount: highest first'], ['amount-asc', 'Amount: lowest first'], ['oldest', 'Oldest bill first'], ['newest', 'Newest bill first'], ['name', 'Name A–Z']].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  </div>
  <label class="search mob-only" style="display:flex;max-width:none;height:42px;margin-bottom:12px">${ico('search', 'sm')}<input placeholder="Search name or phone…" value="${h(f.q)}" oninput="App.search(this.value)"></label>
  <div id="mod-results">${list.length ? `<div class="list">${list.map(g => `<button class="row" onclick="App.debtor('${h(g.key)}')">${avatar(g.name, '', g.key)}
    <div class="main-txt"><b>${h(g.name)}</b><small>${h(fmtPhone(g.phone))} · ${g.items.length} bill${g.items.length > 1 ? 's' : ''} · oldest ${h(fmtDate(g.oldest))}</small></div>
    <div class="meta">${moneyTone(debtTone(g.oldest), g.bal)}${ageBadge(g.oldest)}</div></button>`).join('')}</div>`
    : `<div class="list">${emptyBox('check', 'Nobody owes money', 'All bills are fully paid.')}</div>`}</div>`;
}
function debtorDetail(key) {
  const g = debtorGroups(dueItems()).find(x => x.key === key);
  if (!g) { closeOverlay(); return toast('Fully paid ✓'); }
  const msg = `Hi ${g.name}, this is a friendly reminder from ${SHOP.name}. Pending balance: ₹${g.bal.toLocaleString('en-IN')}. Thank you!`;
  const body = `
    <div class="debt-sum"><div><small>Total due</small><b class="money-due">${rupees(g.bal)}</b></div>
      <div class="debt-act">${g.phone ? `<a class="btn btn-ghost btn-sm" href="tel:${h(digits(g.phone))}">${ico('phone', 'sm')} Call</a><a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${h(waLink(g.phone))}?text=${encodeURIComponent(msg)}">${ico('chat', 'sm')} Remind</a>` : ''}</div></div>
    <div class="list">${g.items.map(d => `<div class="row"><div class="tl-dot ${d.kind === 'sale' ? 'c-green' : 'c-teal'}" style="width:38px;height:38px;border-radius:11px">${ico(d.kind === 'sale' ? 'cart' : 'wrench', 'sm')}</div>
      <div class="main-txt"><b>${h(d.ref)} · ${h(d.what)}</b><small>${h(fmtDate(d.date, true))} · bill ${rupees(d.amount)} · paid ${rupees(d.paid)}</small></div>
      <div class="meta">${moneyTone(debtTone(d.date), d.bal)}${ageBadge(d.date)}<button class="btn btn-primary btn-sm" onclick="App.pay('${d.kind}','${h(d.id)}')">Receive</button></div></div>`).join('')}</div>`;
  const top = stack.length && stack[stack.length - 1].el.querySelector('#debtor-modal');
  if (top) { top.querySelector('.modal-body').innerHTML = body; return; }
  openOverlay(modal({ title: h(g.name), sub: `${h(fmtPhone(g.phone))} · ${g.items.length} unpaid bill${g.items.length > 1 ? 's' : ''}`, body, cls: 'wide" id="debtor-modal' }));
}

/** Receive money from a customer (sale / job) or pay a supplier (credit). */
function paymentForm(kind, id) {
  const rec = kind === 'sale' ? State.sales.find(x => x.id === id) : kind === 'job' ? State.jobs.find(x => x.id === id) : State.credits.find(x => x.id === id);
  if (!rec) return;
  const bal = kind === 'sale' ? saleBal(rec) : kind === 'job' ? Math.max(0, num(rec.charge) - num(rec.paid)) : creditBal(rec);
  const who = kind === 'credit' ? rec.supplier : (rec.customerName || 'Walk-in');
  const el = openOverlay(modal({ title: kind === 'credit' ? 'Pay supplier' : 'Receive payment', sub: `${h(who)} · balance ${rupees(bal)}`, cls: 'narrow', body: `<form id="pay-form">
    <label class="field"><span>Amount (₹)</span><input class="input lg" name="amount" inputmode="numeric" value="${bal}" required autofocus></label>
    <div class="field"><span>Paid by</span><div class="chips" id="pay-modes">${PAY_MODES.filter(m => m !== 'Credit').map((m, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-m="${m}">${m}</button>`).join('')}</div></div></form>`,
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="pay-save">${kind === 'credit' ? 'Save payment' : 'Save receipt'}</button>` }));
  let mode = 'Cash';
  el.querySelectorAll('#pay-modes .chip').forEach(b => b.onclick = () => { mode = b.dataset.m; el.querySelectorAll('#pay-modes .chip').forEach(x => x.classList.toggle('on', x === b)); });
  el.querySelector('#pay-save').onclick = async ev => {
    const amount = num(el.querySelector('[name=amount]').value);
    if (!amount) return toast('Enter the amount', true);
    if (amount > bal && !await confirmBox('More than the balance?', `${rupees(amount)} is more than the balance of ${rupees(bal)}. Save anyway?`, 'Save')) return;
    try {
      const o = await busy(ev.currentTarget, () => api('recordPayment', { kind, id, amount, mode }));
      const arr = kind === 'sale' ? State.sales : kind === 'job' ? State.jobs : State.credits;
      const i = arr.findIndex(x => x.id === o.id); if (i >= 0) arr[i] = o;
      delete State.activity[o.id];
      closeOverlay(); toast(`${kind === 'credit' ? 'Paid' : 'Received'} ${rupees(amount)}`);
      refreshUI();
      const dm = document.querySelector('#debtor-modal'); if (dm && kind !== 'credit') debtorDetail(State.openDebtor);
      const cm = document.querySelector('#credit-modal'); if (cm && kind === 'credit') { closeOverlay(); creditForm(o); }
      if (State.openJobId === o.id) renderJobDrawer();
    } catch (e) { toast(e.message, true); }
  };
}

/* ======================= CREDITORS (money the shop owes suppliers) ======================= */
function filteredCredits() {
  const f = State.cf; const t = ymd(); const q = f.q.trim().toLowerCase();
  return State.credits.filter(c => {
    if (f.status === 'unpaid' && !creditBal(c)) return false;
    if (f.status === 'overdue' && !(creditBal(c) && c.dueDate && c.dueDate < t)) return false;
    if (f.status === 'paid' && creditBal(c)) return false;
    if (q && ![c.supplier, c.billNo, c.items, c.notes].join(' ').toLowerCase().includes(q)) return false;
    return true;
  }).sort({
    due: (a, b) => (creditBal(b) ? 0 : 1) - (creditBal(a) ? 0 : 1) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'),
    amount: (a, b) => (creditBal(b) || num(b.amount)) - (creditBal(a) || num(a.amount)), 'amount-asc': (a, b) => (creditBal(a) || num(a.amount)) - (creditBal(b) || num(b.amount)),
    newest: (a, b) => (b.date || '').localeCompare(a.date || ''), oldest: (a, b) => (a.date || '').localeCompare(b.date || ''), name: (a, b) => a.supplier.localeCompare(b.supplier) || (a.dueDate || '').localeCompare(b.dueDate || '')
  }[f.sort] || ((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')));
}
function viewCreditors() {
  const t = ymd(); const unpaid = State.credits.filter(creditBal);
  const overdue = unpaid.filter(c => c.dueDate && c.dueDate < t);
  const week = unpaid.filter(c => c.dueDate && c.dueDate >= t && c.dueDate <= addDays(7));
  const suppliers = groupBy(unpaid.map(c => ({ ...c, bal: creditBal(c), date: c.date })), c => c.supplier.trim().toLowerCase(), c => c.supplier);
  const list = filteredCredits();
  const chip = (v, l, n) => `<button class="chip ${State.cf.status === v ? 'on' : ''}" onclick="App.cf('status','${v}')">${l}<span class="n">${n}</span></button>`;
  const due = c => { if (!creditBal(c)) return '<span class="badge c-gray">Paid</span>'; if (!c.dueDate) return '<span class="muted">—</span>'; return `<span class="badge ${toneBadge[creditTone(c)]}">${h(relDay(c.dueDate))}</span>`; };
  return `
  <div class="page-head">
    <div><p class="eyebrow">Money the shop owes suppliers</p><h1 class="title">Creditors</h1></div>
    <div class="head-btns">${reportButton('creditors')}<button class="btn btn-primary" onclick="App.newCredit()">${ico('plus', 'sm')} <span>Supplier bill</span></button></div>
  </div>
  <div class="tiles">
    <div class="tile hero"><div class="t-ico">${ico('out')}</div><div class="t-val">${shortRs(sumBy(unpaid, creditBal))}</div><div class="t-lbl">To pay in total · ${unpaid.length} bills</div></div>
    <button class="tile" onclick="App.cf('status','overdue')"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${shortRs(sumBy(overdue, creditBal))}</div><div class="t-lbl">Overdue · ${overdue.length} bills</div></button>
    <div class="tile"><div class="t-ico c-orange">${ico('cal')}</div><div class="t-val">${shortRs(sumBy(week, creditBal))}</div><div class="t-lbl">Due in the next 7 days</div></div>
    <div class="tile"><div class="t-ico c-blue">${ico('store')}</div><div class="t-val">${suppliers.length}</div><div class="t-lbl">Suppliers to pay</div></div>
  </div>
  <div class="tone-legend" style="margin-top:22px"><span class="amt-green">● not due yet</span><span class="amt-yellow">● due within 5 days</span><span class="amt-red">● overdue</span></div>
  <div class="scroll-x" style="margin:10px 0 12px"><div class="chips">
    ${chip('unpaid', 'To pay', unpaid.length)}${chip('overdue', 'Overdue', overdue.length)}${chip('paid', 'Paid', State.credits.length - unpaid.length)}${chip('all', 'All', State.credits.length)}
  </div></div>
  <div class="toolbar"><label class="sort-pick">${ico('chart', 'sm')}<select class="select sm-select" onchange="App.cf('sort',this.value)">${[['due', 'Due date: soonest first'], ['amount', 'Amount: highest first'], ['amount-asc', 'Amount: lowest first'], ['newest', 'Bill date: newest first'], ['oldest', 'Bill date: oldest first'], ['name', 'Supplier A–Z']].map(([v, l]) => `<option value="${v}" ${State.cf.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
  <label class="search mob-only" style="display:flex;max-width:none;height:42px;margin-bottom:12px">${ico('search', 'sm')}<input placeholder="Search supplier, bill no…" value="${h(State.cf.q)}" oninput="App.search(this.value)"></label>
  <div id="mod-results">${list.length ? `
  <div class="table-wrap"><table class="tbl"><thead><tr><th>Supplier</th><th>Bill</th><th>Due</th><th style="text-align:right">Amount</th><th style="text-align:right">Balance</th></tr></thead><tbody>
  ${list.map(c => `<tr onclick="App.editCredit('${h(c.id)}')"><td><b>${h(c.supplier)}</b><small class="muted" style="display:block">${h(fmtDate(c.date))}</small></td>
    <td><div class="ellip">${h(c.billNo || '')}${c.items ? ' · ' + h(c.items) : ''}</div></td><td>${due(c)}</td>
    <td style="text-align:right">${rupees(num(c.amount))}</td><td style="text-align:right">${creditBal(c) ? moneyTone(creditTone(c), creditBal(c)) : '<span class="muted">Paid</span>'}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="cust-cards list">${list.map(c => `<button class="row" onclick="App.editCredit('${h(c.id)}')"><div class="tl-dot c-purple" style="width:40px;height:40px;border-radius:12px">${ico('out', 'sm')}</div>
    <div class="main-txt"><b>${h(c.supplier)}</b><small>${h(c.billNo || '')} · ${h(c.items || '')} · ${h(fmtDate(c.date))}</small></div>
    <div class="meta">${creditBal(c) ? moneyTone(creditTone(c), creditBal(c)) : `<b class="amt amt-gray">${rupees(num(c.amount))}</b>`}${due(c)}</div></button>`).join('')}</div>`
    : `<div class="list">${emptyBox('check', 'Nothing here', State.cf.status === 'unpaid' ? 'No supplier bills to pay.' : 'No bills match.')}</div>`}</div>`;
}
function creditForm(c) {
  const edit = !!(c && c.id); c = c || {};
  const bal = edit ? creditBal(c) : 0;
  const body = `<form id="credit-form" autocomplete="off">
    <div class="grid-2">
      <label class="field"><span>Supplier <em>*</em></span><input class="input" name="supplier" list="sup-list" value="${h(c.supplier)}" required ${edit ? '' : 'autofocus'} placeholder="e.g. Kerala IT Supplies"></label>
      <label class="field"><span>Supplier phone</span><input class="input" name="phone" type="tel" value="${h(c.phone)}"></label>
    </div>
    <datalist id="sup-list">${[...new Set(State.credits.map(x => x.supplier))].map(sname => `<option value="${h(sname)}">`).join('')}</datalist>
    <div class="grid-2 keep">
      <label class="field"><span>Bill date</span><input class="input" type="date" name="date" value="${h(c.date || ymd())}"></label>
      <label class="field"><span>Bill / invoice no.</span><input class="input" name="billNo" value="${h(c.billNo)}"></label>
    </div>
    <label class="field"><span>What was bought</span><input class="input" name="items" value="${h(c.items)}" placeholder="e.g. Laptops x4, printer stock"></label>
    <div class="grid-2 keep">
      <label class="field"><span>Bill amount (₹) <em>*</em></span><input class="input" name="amount" inputmode="numeric" value="${h(c.amount)}" required></label>
      <label class="field"><span>Already paid (₹)</span><input class="input" name="paid" inputmode="numeric" value="${h(c.paid || '0')}"></label>
    </div>
    <div class="field"><span>Pay by (due date)</span><input class="input" type="date" name="dueDate" value="${h(c.dueDate)}">
      <div class="chips" style="margin-top:8px">${[['7 days', 7], ['15 days', 15], ['30 days', 30], ['45 days', 45]].map(([l, n]) => `<button type="button" class="chip" data-d="${n}">${l}</button>`).join('')}</div></div>
    <label class="field"><span>Notes</span><textarea class="textarea" name="notes" style="min-height:60px">${h(c.notes)}</textarea></label>
  </form>`;
  const el = openOverlay(modal({ title: edit ? h(c.supplier) : 'New supplier bill', sub: edit ? `${h(c.billNo || 'Bill')} · ${bal ? 'balance ' + rupees(bal) : 'fully paid'}` : 'Something bought on credit', body, cls: 'wide" id="credit-modal',
    foot: `${edit && can('delete') ? `<button class="btn btn-danger" id="cr-del" style="margin-right:auto">${ico('trash', 'sm')}</button>` : ''}${edit && bal ? `<button class="btn btn-ghost" id="cr-pay" style="color:var(--green)">${ico('rupee', 'sm')} Pay</button>` : ''}<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="cr-save">${edit ? 'Save' : 'Add bill'}</button>` }));
  const f = el.querySelector('#credit-form');
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { f.dueDate.value = addDays(Number(b.dataset.d), f.date.value || ymd()); });
  el.querySelector('#cr-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f).entries()); if (edit) data.id = c.id;
    try {
      const saved = await busy(ev.currentTarget, () => api('saveCredit', { credit: data }));
      const i = State.credits.findIndex(x => x.id === saved.id); if (i >= 0) State.credits[i] = saved; else State.credits.unshift(saved);
      closeOverlay(); toast(edit ? 'Bill updated' : 'Supplier bill added'); refreshUI();
    } catch (e) { toast(e.message, true); }
  };
  const pay = el.querySelector('#cr-pay'); if (pay) pay.onclick = () => paymentForm('credit', c.id);
  const del = el.querySelector('#cr-del');
  if (del) del.onclick = async () => {
    if (!await confirmBox('Delete this supplier bill?', `${c.supplier} — ${rupees(num(c.amount))}. This removes it permanently.`, 'Delete', true)) return;
    try { await api('deleteCredit', { id: c.id }); State.credits = State.credits.filter(x => x.id !== c.id); closeOverlay(); toast('Bill deleted'); refreshUI(); } catch (e) { toast(e.message, true); }
  };
}

/* ======================= CHAIRMAN'S SIMPLE HOME ======================= */
function viewOverview() {
  const t = ymd(); const M = rangeFor('month'); const now = new Date();
  const mSales = State.sales.filter(s => inR(s.date, M)); const tSales = State.sales.filter(s => (s.date || '') === t);
  const mJobs = State.jobs.filter(j => j.status === 'Delivered' && inR(j.deliveredAt, M));
  const open = State.jobs.filter(j => JOB_OPEN.includes(j.status)); const od = State.jobs.filter(jobOverdue);
  const newC = State.customers.filter(c => inR(c.createdAt, M));
  const fuToday = State.customers.filter(c => needsFU(c) && c.followUpDate <= t);
  const debt = dueItems(); const unpaid = State.credits.filter(creditBal); const crOver = unpaid.filter(c => c.dueDate && c.dueDate < t);
  const tile = (view, icon, cls, name, val, sub, id) => `<button class="big-tile" onclick="App.go('${view}')"${id ? ` id="${id}"` : ''}>
    <span class="bt-ico ${cls}">${ico(icon)}</span><span class="bt-name">${name}</span><span class="bt-val">${val}</span><span class="bt-sub">${sub}</span></button>`;
  const tiles = [];
  if (can('sales')) tiles.push(tile('sales', 'cart', 'c-green', 'Sales', shortRs(sumBy(mSales, s => num(s.amount))), `This month · Today ${shortRs(sumBy(tSales, s => num(s.amount)))}`));
  if (can('service')) tiles.push(tile('service', 'wrench', 'c-teal', 'Service', shortRs(sumBy(mJobs, j => num(j.charge))), `This month · ${open.length} jobs open${od.length ? ` · <em class="warn">${od.length} late</em>` : ''}`));
  if (can('performance')) tiles.push(tile('performance', 'trophy', 'c-orange', 'Staff performance', '<span class="spinner dark" style="display:inline-block"></span>', 'Loading…', 'ov-staff'));
  if (can('crm')) tiles.push(tile('customers', 'users', 'c-blue', 'Customers', String(newC.length), `New this month · ${fuToday.length} follow-ups due`));
  if (can('accounts')) {
    tiles.push(tile('debtors', 'in', 'c-purple', 'Debtors', shortRs(sumBy(debt, d => d.bal)), `To collect · ${debtorGroups(debt).length} customers`));
    tiles.push(tile('creditors', 'out', 'c-red', 'Creditors', shortRs(sumBy(unpaid, creditBal)), `To pay · ${crOver.length ? `<em class="warn">${crOver.length} overdue</em>` : `${unpaid.length} bills`}`));
  }
  return `
  <div class="page-head ov-head">
    <div><p class="eyebrow">${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS_L[now.getMonth()]}</p><h1 class="title">${greeting()}, ${h(State.me.name.split(' ')[0])}.</h1></div>
  </div>
  <div class="big-grid">${tiles.join('')}</div>
  ${can('advances') ? (() => { const pend = State.advances.filter(a => a.status === 'Pending'); const M = rangeFor('month'); const given = State.advances.filter(a => ['Approved', 'Paid'].includes(a.status) && inR(a.createdAt, M));
    return `<button class="wide-tile" onclick="App.go('advances')"><span class="bt-ico c-yellow">${ico('rupee')}</span><span style="flex:1;min-width:0"><b>Salary advances</b><small>${pend.length ? `<em class="warn">${pend.length} waiting for approval</em> · ` : ''}${shortRs(sumBy(given, a => num(a.amount)))} given this month</small></span>${ico('chev')}</button>`; })() : ''}
  ${can('dashboard') ? `<div style="text-align:center;margin-top:26px"><button class="link-btn" onclick="App.go('dashboard')">${ico('chart', 'sm')} Detailed charts</button></div>` : ''}`;
}
function paintOverviewStaff() {
  const el = $('#ov-staff'); if (!el) return;
  const R = rangeFor(State.perf.period);
  if (!State.perf.acts || State.perf.key !== R.from + '|' + R.to) return;
  const rows = computePerf(R, State.perf.acts); const n = c => rows.filter(r => rate(r.overall).cls === c).length;
  el.querySelector('.bt-val').innerHTML = `<span class="dots3"><span class="rt rt-g">${n('rt-g')}</span><span class="rt rt-o">${n('rt-o')}</span><span class="rt rt-r">${n('rt-r')}</span></span>`;
  el.querySelector('.bt-sub').textContent = 'On track · Needs attention · Poor (this month)';
}

/* ======================= REPORT DOWNLOADS (in every section) ======================= */
const _scripts = {};
function loadScript(src) {
  if (!_scripts[src]) _scripts[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete _scripts[src]; rej(new Error('Could not load ' + src)); }; document.head.appendChild(s); });
  return _scripts[src];
}
let _logoData;
async function logoDataURL() {
  if (_logoData !== undefined) return _logoData;
  try {
    const b = await (await fetch('logo-sm.png')).blob();
    _logoData = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(null); fr.readAsDataURL(b); });
  } catch (e) { _logoData = null; }
  return _logoData;
}
const pdfTxt = v => String(v == null ? '' : v).replace(/₹\s?/g, 'Rs. ').replace(/[—–]/g, '-').replace(/·/g, '-').replace(/…/g, '...').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x00-\xFF]/g, '');
function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const rs = n => 'Rs. ' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const canDownload = () => can('reports') || can('export');
const REPORT_PERIODS = [['thisweek', 'This week'], ['lastweek', 'Last week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['year', 'This FY'], ['custom', 'Custom dates']];
const REPORT_NAMES = { advances: 'Salary advance', sales: 'Sales', service: 'Service', staff: 'Staff performance', customers: 'Customers', debtors: 'Debtors', creditors: 'Creditors' };
const reportButton = section => canDownload() ? `<button class="btn btn-ghost" onclick="App.report('${section}')">${ico('download', 'sm')} <span>Report</span></button>` : '';

function reportDialog(section) {
  if (!canDownload()) return toast('No permission to download reports', true);
  let period = ls.get('bicrm_rp_period', 'month');
  const el = openOverlay(modal({ title: `${REPORT_NAMES[section]} report`, sub: 'Pick the dates, then the file type', cls: 'narrow', body: `
    <div class="chips" id="rd-per">${REPORT_PERIODS.map(([v, l]) => `<button type="button" class="chip ${period === v ? 'on' : ''}" data-p="${v}">${l}</button>`).join('')}</div>
    <div id="rd-custom" class="grid-2 keep" style="margin-top:14px;${period === 'custom' ? '' : 'display:none'}">
      <label class="field"><span>From</span><input class="input" type="date" id="rd-from" value="${addDays(-30)}" max="${ymd()}"></label>
      <label class="field"><span>To</span><input class="input" type="date" id="rd-to" value="${ymd()}" max="${ymd()}"></label></div>
    <p class="rd-label" id="rd-label"></p>
    <div class="rd-btns">
      <button class="btn btn-dark" data-f="pdf">${ico('pdf', 'sm')} PDF</button>
      <button class="btn btn-ghost" data-f="xlsx">${ico('sheet', 'sm')} Excel</button>
      <button class="btn btn-ghost" data-f="csv">${ico('download', 'sm')} CSV</button>
    </div>` }));
  const R = () => rangeFor(period, el.querySelector('#rd-from').value, el.querySelector('#rd-to').value);
  const paint = () => { el.querySelector('#rd-label').textContent = R().label; };
  el.querySelectorAll('#rd-per .chip').forEach(b => b.onclick = () => {
    period = b.dataset.p; ls.set('bicrm_rp_period', period);
    el.querySelectorAll('#rd-per .chip').forEach(x => x.classList.toggle('on', x === b));
    el.querySelector('#rd-custom').style.display = period === 'custom' ? '' : 'none'; paint();
  });
  el.querySelectorAll('#rd-from,#rd-to').forEach(i => i.onchange = paint); paint();
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = async () => {
    try { await busy(b, async () => { const spec = await REPORTS[section](R()); spec.range = R(); await exportSpec(spec, b.dataset.f); }); toast('Report downloaded'); }
    catch (e) { toast(e.message, true); }
  });
}

/* Each report is a "spec": { title, file, kpis: [[label, value, isMoney]], tables: [{ title, head, rows, money: [col], num: [col] }] } */
const countBy = (arr, keyFn, valFn) => { const m = {}; arr.forEach(x => { const k = keyFn(x) || 'Other'; m[k] = m[k] || [k, 0, 0]; m[k][1]++; m[k][2] += valFn ? valFn(x) : 0; }); return Object.values(m).sort((a, b) => b[2] - a[2] || b[1] - a[1]); };
const REPORTS = {
  async advances(R) {
    const list = State.advances.filter(a => inR(a.createdAt, R)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const sum = st => sumBy(list.filter(a => st.includes(a.status)), a => num(a.amount));
    return { title: 'Salary advance report', file: 'Salary_Advances',
      kpis: [['Requested', sum(['Pending', 'Approved', 'Paid', 'Rejected']), 1], ['Approved + paid', sum(['Approved', 'Paid']), 1], ['Paid out', sum(['Paid']), 1], ['Waiting for approval', list.filter(a => a.status === 'Pending').length]],
      tables: [
        { title: 'By person (approved + paid)', sheet: 'By person', head: ['Staff', 'Advances', 'Amount'], num: [1], money: [2],
          rows: countBy(list.filter(a => ['Approved', 'Paid'].includes(a.status)), a => a.name, a => num(a.amount)) },
        { title: `All requests (${list.length})`, sheet: 'Requests', head: ['Asked on', 'Staff', 'For month', 'Amount', 'Reason', 'Status', 'Decided by', 'Decided on'], money: [3],
          rows: list.map(a => [fmtDate(a.createdAt, true), a.name, a.month, num(a.amount), a.reason || '', a.status, a.decidedBy ? staffName(a.decidedBy) : '', a.decidedAt ? fmtDate(a.decidedAt, true) : '']) }
      ] };
  },
  async sales(R) {
    const list = State.sales.filter(s => inR(s.date || s.createdAt, R)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const total = sumBy(list, s => num(s.amount)), got = sumBy(list, s => num(s.paid));
    return { title: 'Sales report', file: 'Sales',
      kpis: [['Total sales', total, 1], ['Bills', list.length], ['Average bill', list.length ? total / list.length : 0, 1], ['Received', got, 1], ['Balance due', sumBy(list, saleBal), 1]],
      tables: [
        { title: 'Sales by staff', head: ['Staff', 'Bills', 'Amount'], rows: countBy(list, s => staffName(s.soldBy), s => num(s.amount)), num: [1], money: [2] },
        { title: 'Sales by category', head: ['Category', 'Bills', 'Amount'], rows: countBy(list, s => s.category, s => num(s.amount)), num: [1], money: [2] },
        { title: 'By payment mode', head: ['Payment', 'Bills', 'Amount'], rows: countBy(list, s => s.paymentMode, s => num(s.amount)), num: [1], money: [2] },
        { title: `All bills (${list.length})`, sheet: 'Bills', head: ['Date', 'Bill no.', 'Customer', 'Phone', 'Items', 'Category', 'Sold by', 'Payment', 'Amount', 'Received', 'Balance'],
          rows: list.map(s => [fmtDate(s.date, true), s.billNo || '', s.customerName || 'Walk-in', fmtPhone(s.phone), s.items, s.category || '', staffName(s.soldBy), s.paymentMode || '', num(s.amount), num(s.paid), saleBal(s)]), money: [8, 9, 10] }
      ] };
  },
  async service(R) {
    const got = State.jobs.filter(j => inR(j.createdAt, R)); const done = State.jobs.filter(j => j.status === 'Delivered' && inR(j.deliveredAt, R));
    const open = State.jobs.filter(j => JOB_OPEN.includes(j.status));
    const engs = [...new Set(got.concat(done).map(j => j.assignedTo))];
    return { title: 'Service report', file: 'Service',
      kpis: [['Jobs received', got.length], ['Jobs delivered', done.length], ['Service revenue', sumBy(done, j => num(j.charge)), 1], ['Collected', sumBy(done, j => num(j.paid)), 1], ['Open now', open.length], ['Late now', State.jobs.filter(jobOverdue).length]],
      tables: [
        { title: 'By engineer', head: ['Engineer', 'Received', 'Delivered', 'On time', 'Revenue'], num: [1, 2], money: [4],
          rows: engs.map(u => { const d = done.filter(j => j.assignedTo === u); const ot = d.filter(j => !j.dueDate || (j.completedAt || j.deliveredAt || '').slice(0, 10) <= j.dueDate).length;
            return [u ? staffName(u) : 'Not assigned', got.filter(j => j.assignedTo === u).length, d.length, d.length ? Math.round(ot / d.length * 100) + '%' : '-', sumBy(d, j => num(j.charge))]; }).sort((a, b) => b[4] - a[4]) },
        { title: `Jobs delivered (${done.length})`, sheet: 'Delivered', head: ['Job', 'Delivered', 'Customer', 'Phone', 'Type', 'Device', 'Problem', 'Engineer', 'Charge', 'Received'],
          rows: done.map(j => [j.jobNo, fmtDate(j.deliveredAt, true), j.customerName, fmtPhone(j.phone), j.jobType || '', [j.device, j.brandModel].filter(Boolean).join(' '), j.problem || '', staffName(j.assignedTo), num(j.charge), num(j.paid)]), money: [8, 9] },
        { title: `Jobs received (${got.length})`, sheet: 'Received', head: ['Job', 'Received', 'Customer', 'Type', 'Device', 'Problem', 'Engineer', 'Status', 'Promised'],
          rows: got.map(j => [j.jobNo, fmtDate(j.createdAt, true), j.customerName, j.jobType || '', j.device || '', j.problem || '', staffName(j.assignedTo), j.status, j.dueDate ? fmtDate(j.dueDate, true) : '']) }
      ] };
  },
  async staff(R) {
    if (!can('performance')) throw new Error('No permission for staff performance');
    const acts = await api('perfData', { from: R.from, to: R.to });
    const rows = computePerf(R, acts).sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));
    const n = c => rows.filter(r => rate(r.overall).cls === c).length; const rated = rows.filter(r => r.overall != null);
    const v = x => x == null ? '-' : x;
    return { title: 'Staff performance report', file: 'Staff_Performance',
      kpis: [['Team average', rated.length ? Math.round(sumBy(rated, r => r.overall) / rated.length) : '-'], ['On track (75+)', n('rt-g')], ['Needs attention', n('rt-o')], ['Poor (below 50)', n('rt-r')]],
      tables: [{ title: 'Scores (out of 100)', sheet: 'Scores', head: ['Employee', 'Role', 'Overall', 'Rating', 'Punctuality', 'Work rate', 'Results', 'Up to date', 'Updates/day', 'Late sign-ins', 'Revenue'],
        rows: rows.map(r => [r.name, r.title, v(r.overall), rate(r.overall).label, v(r.sc.punct), v(r.sc.work), v(r.sc.results), v(r.sc.fresh), Number(r.raw.perDay.toFixed(1)), `${r.raw.lateDays}/${r.raw.loginDays}`, r.raw.revenue]),
        num: [2, 4, 5, 6, 7, 8], money: [10], rating: 3 }] };
  },
  async customers(R) {
    const t = ymd(); const amt = c => num(c.amount);
    const newC = State.customers.filter(c => inR(c.createdAt, R)).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const conv = State.customers.filter(c => isConvIn(c, R));
    const fu = State.customers.filter(needsFU).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
    const grp = key => countBy(newC, c => c[key]).map(([k, n]) => [k, n, newC.length ? Math.round(n / newC.length * 100) + '%' : '0%']);
    return { title: 'Customers report', file: 'Customers',
      kpis: [['New customers', newC.length], ['Converted', conv.length], ['Avg days to convert', conv.length ? Math.round(sumBy(conv, c => daysBetween(c.createdAt, convDate(c))) / conv.length) : '-'], ['Conversion (new)', (newC.length ? Math.round(newC.filter(c => c.status === 'Converted').length / newC.length * 100) : 0) + '%'], ['Value won (bills)', sumBy(conv, convValue), 1],
        ['Open follow-ups', fu.length], ['Overdue follow-ups', fu.filter(c => c.followUpDate < t).length], ['Lost', State.customers.filter(c => c.status === 'Lost' && inR(c.updatedAt, R)).length], ['Open pipeline', sumBy(State.customers.filter(c => OPEN.includes(c.status)), amt), 1]],
      tables: [
        { title: 'Team', head: ['Staff', 'Added', 'Converted', 'Value won', 'Open follow-ups', 'Overdue'], num: [1, 2, 4, 5], money: [3],
          rows: State.staff.filter(s => s.perms && (s.perms.crm || s.role === 'admin')).map(s => [s.name, newC.filter(c => c.createdBy === s.username).length, conv.filter(c => c.assignedTo === s.username).length,
            sumBy(conv.filter(c => c.assignedTo === s.username), convValue), fu.filter(c => c.assignedTo === s.username).length, fu.filter(c => c.assignedTo === s.username && c.followUpDate < t).length]).sort((a, b) => b[1] - a[1]) },
        { title: 'By status', head: ['Status', 'Count', '%'], rows: grp('status'), num: [1, 2] },
        { title: 'By source', head: ['Source', 'Count', '%'], rows: grp('source'), num: [1, 2] },
        { title: `Pending follow-ups (${fu.length})`, sheet: 'Follow-ups', head: ['Due', 'Customer', 'Phone', 'Requirement', 'Status', 'Assigned'],
          rows: fu.map(c => [(c.followUpDate < t ? 'OVERDUE ' : '') + fmtDate(c.followUpDate, true), c.name, fmtPhone(c.phone), c.requirement || c.category || '', c.status, staffName(c.assignedTo)]) },
        { title: `Converted to sale (${conv.length})`, sheet: 'Conversions', head: ['First visit', 'Converted', 'Days', 'Customer', 'Phone', 'Enquiry', 'Bill(s)', 'Bill value', 'Converted by'], num: [2], money: [7],
          rows: conv.map(c => { const b = customerSales(c); return [fmtDate(c.createdAt, true), fmtDate(convDate(c), true), daysBetween(c.createdAt, convDate(c)), c.name, fmtPhone(c.phone), c.requirement || '', b.map(x => x.billNo || x.items).join(', ') || 'not linked', convValue(c), staffName(c.convertedBy || c.assignedTo)]; }) },
        { title: `New customers (${newC.length})`, sheet: 'New customers', head: ['Date', 'Customer', 'Phone', 'Location', 'Requirement', 'Amount', 'Status', 'Assigned', 'Source'],
          rows: newC.map(c => [fmtDT(c.createdAt), c.name, fmtPhone(c.phone), c.location || '', c.requirement || '', amt(c), c.status, staffName(c.assignedTo), c.source || '']), money: [5] }
      ] };
  },
  async debtors(R) {
    const all = dueItems(); const inP = all.filter(d => inR(d.date, R));
    return { title: 'Debtors report', file: 'Debtors',
      kpis: [['Total to collect (all)', sumBy(all, d => d.bal), 1], ['Customers owing', debtorGroups(all).length], ['From bills in this period', sumBy(inP, d => d.bal), 1], ['Pending over 30 days', sumBy(all.filter(d => daysAgo(d.date) > 30), d => d.bal), 1]],
      tables: [
        { title: 'Who owes (all pending)', sheet: 'Debtors', head: ['Customer', 'Phone', 'Bills', 'Oldest bill', 'Days', 'Balance due'], num: [2, 4], money: [5],
          rows: debtorGroups(all).map(g => [g.name, fmtPhone(g.phone), g.items.length, fmtDate(g.oldest, true), daysAgo(g.oldest), g.bal]) },
        { title: `Unpaid bills dated in this period (${inP.length})`, sheet: 'Bills', head: ['Date', 'Type', 'Ref', 'Customer', 'Phone', 'Details', 'Amount', 'Received', 'Balance'],
          rows: inP.map(d => [fmtDate(d.date, true), d.kind === 'sale' ? 'Sale' : 'Service', d.ref, d.name, fmtPhone(d.phone), d.what, d.amount, d.paid, d.bal]), money: [6, 7, 8] }
      ] };
  },
  async creditors(R) {
    const t = ymd(); const unpaid = State.credits.filter(creditBal); const inP = State.credits.filter(c => inR(c.date, R)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const sup = groupBy(unpaid.map(c => ({ ...c, bal: creditBal(c) })), c => c.supplier.trim().toLowerCase(), c => c.supplier);
    return { title: 'Creditors report', file: 'Creditors',
      kpis: [['Total to pay (all)', sumBy(unpaid, creditBal), 1], ['Overdue', sumBy(unpaid.filter(c => c.dueDate && c.dueDate < t), creditBal), 1], ['Purchases in period', sumBy(inP, c => num(c.amount)), 1], ['Still unpaid from period', sumBy(inP, creditBal), 1]],
      tables: [
        { title: 'Suppliers to pay', sheet: 'Suppliers', head: ['Supplier', 'Phone', 'Bills', 'Next due', 'Balance'], num: [2], money: [4],
          rows: sup.map(g => [g.name, fmtPhone(g.phone), g.items.length, (d => d ? fmtDate(d, true) : '-')(g.items.map(c => c.dueDate).filter(Boolean).sort()[0]), g.bal]) },
        { title: `Supplier bills in this period (${inP.length})`, sheet: 'Bills', head: ['Date', 'Supplier', 'Bill no.', 'Items', 'Due', 'Amount', 'Paid', 'Balance'],
          rows: inP.map(c => [fmtDate(c.date, true), c.supplier, c.billNo || '', c.items || '', c.dueDate ? fmtDate(c.dueDate, true) : '', num(c.amount), num(c.paid), creditBal(c)]), money: [5, 6, 7] }
      ] };
  }
};

const specFile = spec => `BestIndia_${spec.file}_${spec.range.from}_to_${spec.range.to}`;
const genStamp = () => `Generated by ${State.me.name} on ${fmtDate(ymd(), true)}, ${fmtTime(new Date())}`;
async function exportSpec(spec, fmt) {
  if (fmt === 'pdf') return specPDF(spec);
  if (fmt === 'xlsx') return specXLSX(spec);
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const lines = [[SHOP.name], [spec.title], ['Period', spec.range.label], [genStamp()], []]
    .concat(spec.kpis.map(([l, v]) => [l, v]), [[]]);
  spec.tables.forEach(t => { lines.push([t.title], t.head, ...t.rows, []); });
  saveBlob(new Blob(['﻿' + lines.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), specFile(spec) + '.csv');
}
async function specXLSX(spec) {
  await loadScript('vendor/xlsx.full.min.js');
  const X = window.XLSX; const wb = X.utils.book_new(); const used = new Set();
  const add = (name, aoa) => {
    let n = String(name).replace(/[\[\]:*?\/\\]/g, '').replace(/\s*\(\d+\)$/, '').slice(0, 28) || 'Sheet'; let k = n, i = 2; while (used.has(k)) k = n + ' ' + i++; used.add(k);
    const ws = X.utils.aoa_to_sheet(aoa);
    ws['!cols'] = (aoa.reduce((m, r) => r.length > m.length ? r : m, [])).map((_, c) => ({ wch: Math.min(42, Math.max(10, ...aoa.map(r => String(r[c] == null ? '' : r[c]).length + 2))) }));
    X.utils.book_append_sheet(wb, ws, k);
  };
  add('Summary', [[SHOP.name], [spec.title], ['Period', spec.range.label], [genStamp()], [], ['Figure', 'Value'], ...spec.kpis.map(([l, v]) => [l, v])]);
  spec.tables.forEach(t => add(t.sheet || t.title, [t.head, ...t.rows]));
  X.writeFile(wb, specFile(spec) + '.xlsx');
}
async function specPDF(spec) {
  await loadScript('vendor/jspdf.umd.min.js');
  await loadScript('vendor/jspdf.plugin.autotable.min.js');
  const { jsPDF } = window.jspdf;
  const wide = Math.max(...spec.tables.map(t => t.head.length)) > 8;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: wide ? 'landscape' : 'portrait' });
  const W = doc.internal.pageSize.getWidth(), H = () => doc.internal.pageSize.getHeight(), M = 40, BLUE = [0, 113, 227], INK = [29, 29, 31], GRAY = [110, 110, 115];
  const logo = await logoDataURL();
  doc.setFillColor(245, 245, 247); doc.rect(0, 0, W, 100, 'F');
  let x = M; if (logo) { doc.addImage(logo, 'PNG', M, 18, 72, 62); x = M + 86; }
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(pdfTxt(SHOP.name), x, 42);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text(pdfTxt([SHOP.address, SHOP.gst ? 'GSTIN ' + SHOP.gst : ''].filter(Boolean).join('  |  ')), x, 57);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...BLUE); doc.text(pdfTxt(spec.title.toUpperCase()), x, 78);
  let y = 126;
  doc.setTextColor(...INK); doc.setFontSize(15); doc.text(pdfTxt(spec.range.label), M, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY); doc.text(pdfTxt(genStamp()), M, y + 14);
  y += 30;
  const per = 4, bw = (W - 2 * M - (per - 1) * 10) / per, bh = 50;
  spec.kpis.forEach(([l, v, money], i) => {
    const bx = M + (i % per) * (bw + 10), by = y + Math.floor(i / per) * (bh + 10); const val = pdfTxt(money ? rs(v) : v);
    doc.setFillColor(...(i === 0 ? BLUE : [245, 245, 247])); doc.roundedRect(bx, by, bw, bh, 8, 8, 'F');
    doc.setTextColor(...(i === 0 ? [255, 255, 255] : INK)); doc.setFont('helvetica', 'bold'); doc.setFontSize(val.length > 12 ? 12 : 16); doc.text(val, bx + 11, by + 24);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...(i === 0 ? [220, 235, 255] : GRAY)); doc.text(pdfTxt(l), bx + 11, by + 40);
  });
  y += Math.ceil(spec.kpis.length / per) * (bh + 10) + 22;
  spec.tables.forEach(t => {
    if (y > H() - 110) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...INK); doc.text(pdfTxt(t.title), M, y);
    const right = (t.money || []).concat(t.num || []); const colStyles = {}; right.forEach(c => { colStyles[c] = { halign: 'right' }; });
    const body = t.rows.map(r => r.map((v, c) => pdfTxt((t.money || []).includes(c) ? (v ? rs(v) : '-') : v)));
    doc.autoTable({
      startY: y + 8, head: [t.head.map(pdfTxt)], body: body.length ? body : [[{ content: 'Nothing in this period', colSpan: t.head.length, styles: { halign: 'center', textColor: GRAY } }]],
      margin: { left: M, right: M }, theme: 'grid', columnStyles: colStyles,
      styles: { font: 'helvetica', fontSize: t.head.length > 8 ? 7.5 : 8.5, cellPadding: 4.5, lineColor: [228, 228, 232], lineWidth: 0.5, textColor: INK, overflow: 'linebreak' },
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [250, 250, 252] },
      didParseCell: d => {
        if (d.section !== 'body') return;
        const raw = String(d.cell.raw);
        if (raw.startsWith('OVERDUE')) { d.cell.styles.textColor = [215, 40, 30]; d.cell.styles.fontStyle = 'bold'; }
        if (t.rating === d.column.index) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.textColor = raw === 'On track' ? [29, 157, 75] : raw === 'Needs attention' ? [217, 119, 6] : raw === 'Poor' ? [215, 40, 30] : GRAY; }
      }
    });
    y = doc.lastAutoTable.finalY + 26;
  });
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setDrawColor(228, 228, 232); doc.line(M, H() - 34, W - M, H() - 34);
    doc.setFontSize(8); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal');
    doc.text(pdfTxt(`${SHOP.name} - ${spec.title} - ${spec.range.label}`), M, H() - 20);
    doc.text(`Page ${i} of ${pages}`, W - M, H() - 20, { align: 'right' });
  }
  doc.save(specFile(spec) + '.pdf');
}

/* ======================= SMART SEARCH & REPEAT-CUSTOMER AUTOFILL ======================= */
/**
 * "Logical" name matching. Every typed word must match one word of the name:
 *   start of a word ("arj" → Arjun)  >  anywhere in the name ("jun" → Arjun)  >  letters in order inside a word that
 *   starts with the same letter ("amn" → Ameen). Returns a score (0 = no match) so the best matches come first.
 */
function smartScore(text, query) {
  const t = String(text || '').toLowerCase(); const q = String(query || '').toLowerCase().trim();
  if (!q) return 0;
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  let score = 0;
  for (const tok of q.split(/\s+/)) {
    if (words.some(w => w.startsWith(tok))) { score += 3; continue; }
    if (t.includes(tok)) { score += 2; continue; }
    const inOrder = w => { if (w[0] !== tok[0]) return false; let i = 0; for (const ch of w) if (ch === tok[i]) i++; return i === tok.length; };
    if (tok.length >= 2 && words.some(inOrder)) { score += 1; continue; }
    return 0;
  }
  return score + (t.startsWith(q) ? 2 : 0);
}
/** Everyone the shop has dealt with (CRM customers, sale and service customers), one entry per phone number. */
function peopleIndex() {
  const m = new Map();
  const put = (key, o) => { const ex = m.get(key); if (!ex) m.set(key, o); else { ex.count += o.count; if ((o.last || '') > (ex.last || '')) ex.last = o.last; ex.cust = ex.cust || o.cust; ['location', 'email', 'altPhone'].forEach(k => { ex[k] = ex[k] || o[k]; }); } };
  State.customers.forEach(c => put(last10(c.phone) || 'c:' + c.id, { name: c.name, phone: c.phone, altPhone: c.altPhone, location: c.location, email: c.email, cust: c, count: Number(c.visits) || 1, last: c.lastVisit || c.createdAt }));
  State.sales.forEach(s => { if (s.customerName && s.phone) put(last10(s.phone), { name: s.customerName, phone: s.phone, count: 1, last: s.date }); });
  State.jobs.forEach(j => { if (j.customerName && j.phone) put(last10(j.phone), { name: j.customerName, phone: j.phone, location: j.location, count: 1, last: j.createdAt }); });
  return [...m.values()];
}
/** Shows matching past customers under an input after 2 letters (or 3 digits); picking one calls onPick(person). */
function attachSuggest(input, onPick) {
  const box = document.createElement('div'); box.className = 'suggest hidden';
  input.parentNode.style.position = 'relative'; input.parentNode.appendChild(box); input.setAttribute('autocomplete', 'off');
  let items = [], idx = -1;
  const close = () => { box.classList.add('hidden'); idx = -1; };
  const render = () => {
    const q = input.value.trim(); const qd = digits(q);
    if (q.length < 2 || (/^\d+$/.test(q) && qd.length < 3)) { close(); return; }
    items = peopleIndex().map(p => [p, /^\d+$/.test(q) ? (digits(p.phone).includes(qd) || digits(p.altPhone).includes(qd) ? 3 : 0) : smartScore(p.name, q)])
      .filter(x => x[1]).sort((a, b) => b[1] - a[1] || (b[0].last || '').localeCompare(a[0].last || '')).slice(0, 6).map(x => x[0]);
    if (!items.length) { close(); return; }
    box.innerHTML = `<div class="sg-head">Returning customer?</div>` + items.map((p, i) => `<button type="button" class="sg-item ${i === idx ? 'on' : ''}" data-i="${i}">${avatar(p.name, 'sm', p.phone)}
      <span><b>${h(p.name)}</b><small>${h(fmtPhone(p.phone))}${p.location ? ' · ' + h(p.location) : ''} · ${p.count > 1 ? p.count + ' visits · ' : ''}last ${h(String(p.last || '').length <= 10 ? fmtDate(p.last) : rel(p.last))}</small></span></button>`).join('');
    box.classList.remove('hidden');
    box.querySelectorAll('.sg-item').forEach(b => b.onmousedown = e => { e.preventDefault(); const p = items[Number(b.dataset.i)]; close(); onPick(p); });
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', e => {
    if (box.classList.contains('hidden')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; box.querySelectorAll('.sg-item').forEach((b, i) => b.classList.toggle('on', i === idx)); }
    if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); const p = items[idx]; close(); onPick(p); }
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  });
}

/* ======================= SERVICE STAFF LIST ======================= */
/** Who can be given service jobs: the two engineers, plus Shylesh, Sona and Deepak to help when there's a lot of work. */
function serviceStaff() {
  const list = (CFG.SERVICE_STAFF || ['nikhil', 'safwan', 'shylesh', 'sona', 'deepak']).map(u => String(u).toLowerCase());
  return list.map(u => State.staff.find(s => s.username === u)).filter(Boolean);
}

/* ======================= MONEY COLOURS ======================= */
/** Debtors, by how old the bill is: up to 15 days green, 16–25 yellow, 26–30 orange, over 30 red. */
const debtTone = date => { const n = daysAgo(date); return n > 30 ? 'red' : n > 25 ? 'orange' : n > 15 ? 'yellow' : 'green'; };
/** Creditors, by the pay-by date: overdue red, due within 5 days yellow-orange, otherwise green. */
const creditTone = c => { if (!creditBal(c)) return 'gray'; if (!c.dueDate) return 'green'; const t = ymd(); return c.dueDate < t ? 'red' : c.dueDate <= addDays(5) ? 'yellow' : 'green'; };
const toneBadge = { green: 'c-green', yellow: 'c-yellow', orange: 'c-orange', red: 'c-red', gray: 'c-gray' };
const moneyTone = (tone, v) => `<b class="amt amt-${tone}">${rupees(v)}</b>`;

/* ======================= SALARY ADVANCE ======================= */
const ADV_CLS = { Pending: 'c-yellow', Approved: 'c-blue', Rejected: 'c-red', Paid: 'c-green' };
const canRequestAdvance = () => !!State.me && !/chairman/i.test(State.me.title || '');
function monthOptions() {
  const out = []; const d = new Date(); d.setDate(1);
  for (let i = -1; i <= 2; i++) { const x = new Date(d.getFullYear(), d.getMonth() + i, 1); out.push(MONTHS_L[x.getMonth()] + ' ' + x.getFullYear()); }
  return out;
}
function viewAdvances() {
  const mine = State.advances.filter(a => a.username === State.me.username).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const manage = can('advances');
  const badge = a => `<span class="badge ${ADV_CLS[a.status] || 'c-gray'}"><i></i>${h(a.status)}</span>`;
  let html = `
  <div class="page-head">
    <div><p class="eyebrow">${manage ? 'Requests from the team' : 'Ask for part of your salary early'}</p><h1 class="title">Salary advance${manage ? 's' : ''}</h1></div>
    <div class="head-btns">${manage ? reportButton('advances') : ''}${canRequestAdvance() ? `<button class="btn btn-primary" onclick="App.advRequest()">${ico('plus', 'sm')} <span>Request advance</span></button>` : ''}</div>
  </div>`;
  if (manage) {
    const t = ymd(); const all = State.advances.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const f = State.af; const FY = rangeFor('year'); const M = rangeFor('month');
    const pend = all.filter(a => a.status === 'Pending'), appr = all.filter(a => a.status === 'Approved');
    const paidM = all.filter(a => a.status === 'Paid' && inR(a.decidedAt, M));
    const list = all.filter(a => (!f.status || a.status === f.status) && (!f.staff || a.username === f.staff));
    const byPerson = groupBy(all.filter(a => ['Approved', 'Paid'].includes(a.status) && inR(a.createdAt, FY)).map(a => ({ ...a, bal: num(a.amount), date: a.createdAt.slice(0, 10), phone: '' })), a => a.username, a => a.name);
    const chip = (v, l, n) => `<button class="chip ${f.status === v ? 'on' : ''}" onclick="App.af('status','${v}')">${l}${n != null ? `<span class="n">${n}</span>` : ''}</button>`;
    html += `
    <div class="tiles">
      <button class="tile hero" onclick="App.af('status','Pending')"><div class="t-ico">${ico('clock')}</div><div class="t-val">${pend.length}</div><div class="t-lbl">Waiting for approval · ${rupees(sumBy(pend, a => num(a.amount)))}</div></button>
      <button class="tile" onclick="App.af('status','Approved')"><div class="t-ico c-blue">${ico('check')}</div><div class="t-val">${shortRs(sumBy(appr, a => num(a.amount)))}</div><div class="t-lbl">Approved, not yet paid · ${appr.length}${State.me.advPay && appr.length ? ' · <b>pay these</b>' : ''}</div></button>
      <div class="tile"><div class="t-ico c-green">${ico('rupee')}</div><div class="t-val">${shortRs(sumBy(paidM, a => num(a.amount)))}</div><div class="t-lbl">Paid this month</div></div>
      <div class="tile"><div class="t-ico c-purple">${ico('chart')}</div><div class="t-val">${shortRs(sumBy(byPerson, g => g.bal))}</div><div class="t-lbl">Given this financial year</div></div>
    </div>
    <div class="toolbar" style="margin-top:22px">
      <div class="scroll-x" style="flex:1"><div class="chips">${chip('', 'All', all.length)}${['Pending', 'Approved', 'Paid', 'Rejected'].map(s => chip(s, s, all.filter(a => a.status === s).length)).join('')}</div></div>
      <select class="select sm-select" onchange="App.af('staff',this.value)"><option value="">Everyone</option>${State.staff.filter(s => !/chairman/i.test(s.title || '')).map(s => `<option value="${h(s.username)}" ${f.staff === s.username ? 'selected' : ''}>${h(s.name)}</option>`).join('')}</select>
    </div>
    ${list.length ? `<div class="list">${list.map(a => `<div class="row adv-row">${staffAv(a.username, '', a.name)}
      <div class="main-txt"><b>${h(a.name)} · ${rupees(num(a.amount))}</b><small style="white-space:normal">For ${h(a.month)} · asked ${h(rel(a.createdAt))}${a.reason ? ' · “' + h(a.reason) + '”' : ''}${a.decidedBy ? ` · ${h(a.status.toLowerCase())} by ${h(staffName(a.decidedBy))}` : ''}</small></div>
      <div class="meta">${badge(a)}<div class="adv-act">${a.status === 'Pending' && State.me.advApprove ? `<button class="btn btn-sm" style="background:var(--green-soft);color:var(--green)" onclick="App.advDecide('${h(a.id)}','Approved',this)">Approve</button><button class="btn btn-sm btn-danger" onclick="App.advDecide('${h(a.id)}','Rejected',this)">Reject</button>`
        : a.status === 'Approved' && State.me.advPay ? `<button class="btn btn-sm btn-ghost" onclick="App.advDecide('${h(a.id)}','Paid',this)">Mark paid</button>` : ''}</div></div></div>`).join('')}</div>`
      : `<div class="list">${emptyBox('check', 'No requests here', '')}</div>`}
    <div class="section"><div class="section-head"><h2 class="h2">This financial year by person</h2><span class="muted tiny">approved + paid</span></div>
      <div class="list">${byPerson.length ? byPerson.map(g => `<div class="row">${staffAv(g.key, 'sm', g.name)}<div class="main-txt"><b>${h(g.name)}</b><small>${g.items.length} advance${g.items.length > 1 ? 's' : ''}</small></div><div class="meta"><b>${rupees(g.bal)}</b></div></div>`).join('') : emptyBox('rupee', 'None yet', '')}</div></div>`;
  }
  if (canRequestAdvance()) {
    html += `<div class="section"><div class="section-head"><h2 class="h2">My requests</h2></div>
      <div class="list">${mine.length ? mine.map(a => `<div class="row"><div class="tl-dot ${ADV_CLS[a.status] || 'c-gray'}" style="width:40px;height:40px;border-radius:12px">${ico('rupee', 'sm')}</div>
        <div class="main-txt"><b>${rupees(num(a.amount))} · ${h(a.month)}</b><small>Asked ${h(rel(a.createdAt))}${a.decidedBy ? ` · ${h(staffName(a.decidedBy))}, ${h(rel(a.decidedAt))}` : ''}</small></div>
        <div class="meta">${badge(a)}</div></div>`).join('') : emptyBox('rupee', 'No requests yet', 'Tap “Request advance” when you need one.')}</div></div>`;
  }
  return html;
}
function mailTargets() {
  const find = u => State.staff.find(s => s.username === u);
  const to = ['saneed', 'midhila'].map(find).filter(Boolean), cc = ['shaneer'].map(find).filter(Boolean);
  return { to, cc };
}
function advanceForm() {
  const tg = mailTargets(); const months = monthOptions();
  const el = openOverlay(modal({ title: 'Request salary advance', sub: `Goes to ${tg.to.map(s => s.name).join(' & ')}${tg.cc.length ? ', copy to ' + tg.cc.map(s => s.name).join(', ') : ''}`, cls: 'narrow', body: `<form id="adv-form">
    <div class="field"><span>For which month?</span><div class="chips" id="adv-months">${months.map((m, i) => `<button type="button" class="chip ${i === 1 ? 'on' : ''}" data-m="${h(m)}">${h(m)}</button>`).join('')}</div></div>
    <label class="field"><span>Amount (₹)</span><input class="input lg" name="amount" inputmode="numeric" required autofocus placeholder="e.g. 5000"></label>
    <label class="field"><span>Reason <small class="muted">(optional)</small></span><input class="input" name="reason" placeholder="e.g. Medical, rent, function"></label>
    <label class="field"><span>Your email</span><input class="input" name="email" type="email" value="${h(State.me.email || '')}" placeholder="name@gmail.com"></label>
    <p class="hint" style="margin-top:-6px">An email goes out automatically. Replies come to this address.</p></form>`,
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="adv-send">Send request</button>` }));
  let month = months[1];
  el.querySelectorAll('#adv-months .chip').forEach(b => b.onclick = () => { month = b.dataset.m; el.querySelectorAll('#adv-months .chip').forEach(x => x.classList.toggle('on', x === b)); });
  const f = el.querySelector('#adv-form');
  el.querySelector('#adv-send').onclick = async ev => {
    if (!f.reportValidity()) return;
    const email = f.email.value.trim().toLowerCase();
    try {
      const r = await busy(ev.currentTarget, async () => {
        if (email !== (State.me.email || '')) { await api('setEmail', { email }); State.me.email = email; ls.set('bicrm_me', State.me); }
        return api('requestAdvance', { month, amount: f.amount.value, reason: f.reason.value });
      });
      State.advances.unshift(r.advance);
      closeOverlay(); renderView();
      if (r.mailed) toast(`Request sent · email sent to ${tg.to.map(s => s.name).join(' & ')}`);
      else mailFallback(r.mail, r.mailError);
    } catch (e) { toast(e.message, true); }
  };
}
/** When the email can't go out automatically, open Gmail (or the phone's mail app) with the same message ready to send. */
function mailFallback(mail, why) {
  const to = (mail.to || []).join(','), cc = (mail.cc || []).join(',');
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
  const mailto = `mailto:${to}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
  openOverlay(modal({ title: 'Request saved', sub: 'Send the email yourself, it’s ready', cls: 'narrow', body: `
    <p class="hint warn" style="margin:0 0 14px">The email could not be sent automatically${why ? ` (${h(why)})` : ''}. Your request is saved in the app.</p>
    <div class="mail-prev"><small>To: ${h(to || 'add Saneed & Midhila’s emails in Admin → Staff')}${cc ? '<br>Cc: ' + h(cc) : ''}</small><b>${h(mail.subject)}</b><pre>${h(mail.body)}</pre></div>`,
    foot: `<a class="btn btn-ghost" href="${h(mailto)}">Mail app</a><a class="btn btn-primary" href="${h(gmail)}" target="_blank" rel="noopener" onclick="App.close()">Open in Gmail</a>` }));
}
async function decideAdvance(id, status, btn) {
  const a = State.advances.find(x => x.id === id); if (!a) return;
  if (status === 'Rejected' && !await confirmBox(`Reject ${a.name}'s request?`, `${rupees(num(a.amount))} for ${a.month}.`, 'Reject', true)) return;
  try {
    const r = await busy(btn, () => api('decideAdvance', { id, status }));
    const i = State.advances.findIndex(x => x.id === id); if (i >= 0) State.advances[i] = r;
    toast(`${a.name}: ${status.toLowerCase()}`); renderView(); updateBell();
  } catch (e) { toast(e.message, true); }
}
function emailForm(username) {
  const u = username ? (State.users.find(x => x.username === username) || State.staff.find(x => x.username === username)) : State.me;
  const el = openOverlay(modal({ title: username && username !== State.me.username ? `${h(u.name)}'s email` : 'My email', cls: 'narrow', body: `<form id="em-form">
    <label class="field"><span>Email address</span><input class="input" type="email" name="email" value="${h(u.email || '')}" placeholder="name@gmail.com" autofocus></label>
    <p class="hint">Used for salary advance emails.</p></form>`,
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="em-save">Save</button>` }));
  el.querySelector('#em-save').onclick = async ev => {
    const email = el.querySelector('[name=email]').value.trim().toLowerCase();
    try {
      await busy(ev.currentTarget, () => api('setEmail', { username: u.username, email }));
      [State.staff, State.users].forEach(arr => { const x = arr.find(y => y.username === u.username); if (x) x.email = email; });
      if (u.username === State.me.username) { State.me.email = email; ls.set('bicrm_me', State.me); }
      closeOverlay(); toast('Email saved');
    } catch (e) { toast(e.message, true); }
  };
}

/* ======================= CUSTOMERS ON A DATE ======================= */
async function loadDayVisits(date) {
  if (State.dayVisits[date]) return;
  try { State.dayVisits[date] = await api('visitsOn', { date }); }
  catch (e) { State.dayVisits[date] = null; toast(e.message, true); }
  if (State.view === 'customers' && State.period === 'date' && State.onDate === date) renderView();
}
function daySummary() {
  const d = State.onDate; const v = State.dayVisits[d];
  if (v === undefined) return `<div class="day-sum"><span class="spinner dark" style="display:inline-block"></span> Loading ${h(fmtDate(d, true))}…</div>`;
  const ids = new Set((v || []).map(x => x.id)); const list = State.customers.filter(c => ids.has(c.id) || (c.createdAt || '').slice(0, 10) === d);
  const fresh = list.filter(c => (c.createdAt || '').slice(0, 10) === d).length;
  return `<div class="day-sum"><b>${list.length}</b> customer${list.length === 1 ? '' : 's'} on <b>${h(DAYS[parse(d).getDay()])}, ${h(fmtDate(d, true))}</b><span class="muted"> · ${fresh} new · ${list.length - fresh} repeat</span></div>`;
}

/* ======================= CONVERSIONS (enquiry → sale) ======================= */
/** When the customer became a sale. Older records without a saved date fall back to their last update. */
const convDate = c => c.status === 'Converted' ? (c.convertedAt || c.updatedAt || '') : '';
const isConvIn = (c, R) => c.status === 'Converted' && inR(convDate(c), R);
/** Bills linked to this customer: by the saved link first, otherwise by the same phone number. */
function customerSales(c) {
  const p = last10(c.phone);
  return State.sales.filter(s => s.customerId === c.id || (p && !s.customerId && last10(s.phone) === p))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
const convValue = c => { const s = customerSales(c); return s.length ? sumBy(s, x => num(x.amount)) : num(c.amount); };
const daysBetween = (a, b) => { const x = parse(String(a).slice(0, 10)), y = parse(String(b).slice(0, 10)); return x && y ? Math.max(0, Math.round((y - x) / 86400000)) : 0; };
function conversionBlock(c) {
  const sales = customerSales(c);
  const conv = c.status === 'Converted';
  if (!conv && !sales.length) return '';
  const linked = c.saleId ? State.sales.find(s => s.id === c.saleId) : sales[sales.length - 1];
  return `<div class="group-title">Purchases</div>
  <div class="conv-card">
    ${conv ? `<div class="conv-head">${ico('trophy', 'sm')}<span>Converted <b>${h(fmtDate(convDate(c), true))}</b> · ${daysBetween(c.createdAt, convDate(c))} day${daysBetween(c.createdAt, convDate(c)) === 1 ? '' : 's'} after first visit${c.convertedBy ? ' · by ' + h(staffName(c.convertedBy)) : ''}${linked ? ` · bill ${h(linked.billNo || '')} ${rupees(num(linked.amount))}` : c.convertedAt ? '' : ' · <em>no bill linked</em>'}</span></div>` : ''}
    ${sales.length ? `<div class="list" style="box-shadow:none">${sales.map(s => `<button class="row" onclick="App.editSale('${h(s.id)}')"><div class="tl-dot c-green" style="width:34px;height:34px;border-radius:10px">${ico('cart', 'sm')}</div>
      <div class="main-txt"><b>${h(s.items)}</b><small>${h(fmtDate(s.date, true))}${s.billNo ? ' · ' + h(s.billNo) : ''} · ${h(staffName(s.soldBy))}</small></div><div class="meta"><b>${rupees(num(s.amount))}</b>${saleBal(s) ? `<small style="color:var(--red)">due ${rupees(saleBal(s))}</small>` : ''}</div></button>`).join('')}</div>
      <p class="muted tiny" style="margin:8px 2px 0">Total bought: <b>${rupees(sumBy(sales, s => num(s.amount)))}</b> in ${sales.length} bill${sales.length > 1 ? 's' : ''}</p>` : `<p class="muted tiny" style="margin:6px 2px 0">No bill recorded yet. Record the sale under Sales with this phone number to link it.</p>`}
  </div>`;
}

/* ======================= HAPPY CALLS (feedback within 7 days of a first visit) ======================= */
const HAPPY_DAYS = 7;
/** New customers who should get a feedback call: not AMC, not regular / daily customers, first visit in the last 14 days. */
function happyList() {
  return State.customers.filter(c => {
    const age = daysAgo(c.createdAt);
    if (age > 14 || !c.createdAt) return false;
    if (c.category === 'AMC' || c.source === 'Existing customer') return false;
    if ((Number(c.visits) || 1) > 2) return false; // regular / daily customer
    return true;
  });
}
const happyDue = c => addDays(HAPPY_DAYS, String(c.createdAt).slice(0, 10));
const HAPPY_FACE = { Happy: ['😊', 'c-green'], Okay: ['😐', 'c-yellow'], Unhappy: ['😞', 'c-red'] };
function viewHappy() {
  const all = happyList(); const t = ymd();
  const todo = all.filter(c => c.happyStatus !== 'Done' && daysAgo(c.createdAt) <= HAPPY_DAYS).sort((a, b) => happyDue(a).localeCompare(happyDue(b)));
  const missed = all.filter(c => c.happyStatus !== 'Done' && daysAgo(c.createdAt) > HAPPY_DAYS).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const done = all.filter(c => c.happyStatus === 'Done').sort((a, b) => (b.happyAt || '').localeCompare(a.happyAt || ''));
  const recent = State.customers.filter(c => c.happyStatus === 'Done' && daysAgo(c.happyAt) <= 30);
  const happyPct = recent.length ? Math.round(recent.filter(c => c.happyRating === 'Happy').length / recent.length * 100) : null;
  const tab = State.hf.tab;
  const list = tab === 'missed' ? missed : tab === 'done' ? done : todo;
  const left = c => { const n = daysBetween(t, happyDue(c)); return n <= 0 ? ['Last day today', 'c-red'] : n === 1 ? ['1 day left', 'c-orange'] : [`${n} days left`, n <= 3 ? 'c-yellow' : 'c-blue']; };
  const row = c => {
    const face = HAPPY_FACE[c.happyRating];
    const right = tab === 'done' ? `<span class="badge ${face ? face[1] : 'c-gray'}">${face ? face[0] + ' ' : ''}${h(c.happyRating || '')}</span><small>${h(rel(c.happyAt))}</small>`
      : tab === 'missed' ? `<span class="badge c-gray">${daysAgo(c.createdAt)} days ago</span>${c.happyStatus === 'No answer' ? `<small>no answer ×${h(c.happyTries || 1)}</small>` : ''}`
      : `<span class="badge ${left(c)[1]}">${left(c)[0]}</span>${c.happyStatus === 'No answer' ? `<small>no answer ×${h(c.happyTries || 1)}</small>` : ''}`;
    return `<div class="row happy-row">${avatar(c.name, '', c.id)}
      <div class="main-txt" onclick="App.open('${h(c.id)}')" style="cursor:pointer"><b>${h(c.name)}</b><small>${h(fmtPhone(c.phone))} · came ${h(fmtDate(c.createdAt))} · ${h(c.requirement || c.category || '')}${tab === 'done' && c.happyNote ? ' · “' + h(c.happyNote) + '”' : ''}</small></div>
      <div class="meta">${right}</div>
      ${tab !== 'done' && can('happycalls') ? `<div class="happy-act"><a class="icon-btn" style="background:var(--accent-soft);color:var(--accent)" href="tel:${h(digits(c.phone))}" title="Call">${ico('phone', 'sm')}</a><button class="btn btn-primary btn-sm" onclick="App.happy('${h(c.id)}')">Record</button></div>` : ''}</div>`;
  };
  return `
  <div class="page-head">
    <div><p class="eyebrow">Feedback call within ${HAPPY_DAYS} days of a new customer's first visit · AMC and regular customers left out</p><h1 class="title">Happy calls</h1></div>
  </div>
  <div class="tiles">
    <button class="tile hero" onclick="App.hf('tab','todo')"><div class="t-ico">${ico('phone')}</div><div class="t-val">${todo.length}</div><div class="t-lbl">To call · ${todo.filter(c => happyDue(c) <= t).length} on their last day</div></button>
    <button class="tile" onclick="App.hf('tab','missed')"><div class="t-ico c-red">${ico('alert')}</div><div class="t-val">${missed.length}</div><div class="t-lbl">Missed (past ${HAPPY_DAYS} days)</div></button>
    <button class="tile" onclick="App.hf('tab','done')"><div class="t-ico c-green">${ico('check')}</div><div class="t-val">${done.filter(c => daysAgo(c.happyAt) <= 6).length}</div><div class="t-lbl">Done in the last 7 days</div></button>
    <div class="tile"><div class="t-ico c-yellow">${ico('trophy')}</div><div class="t-val">${happyPct == null ? '—' : happyPct + '%'}</div><div class="t-lbl">Customers happy (30 days)</div></div>
  </div>
  <div class="seg" style="margin:22px 0 14px">${[['todo', `To call (${todo.length})`], ['missed', `Missed (${missed.length})`], ['done', `Done (${done.length})`]].map(([v, l]) => `<button class="${tab === v ? 'on' : ''}" onclick="App.hf('tab','${v}')">${l}</button>`).join('')}</div>
  <div class="list">${list.length ? list.map(row).join('') : emptyBox(tab === 'todo' ? 'check' : 'phone', tab === 'todo' ? 'No calls to make right now' : 'Nothing here', tab === 'todo' ? 'New customers will appear here the day they visit.' : '')}</div>`;
}
function happyForm(id) {
  const c = State.customers.find(x => x.id === id); if (!c) return;
  const el = openOverlay(modal({ title: 'Happy call · ' + h(c.name), sub: `${h(fmtPhone(c.phone))} · came ${h(fmtDate(c.createdAt, true))} for ${h(c.requirement || c.category || 'a visit')}`, cls: 'narrow', body: `
    <div class="happy-script"><b>Say:</b> “Hi ${h(c.name.split(' ')[0])}, this is ${h(State.me.name)} from ${h(SHOP.short || SHOP.name)}. You visited us on ${h(fmtDate(c.createdAt))}. How was your experience with us?”</div>
    <div class="field"><span>How did it go?</span><div class="happy-opts" id="hp-opts">
      ${[['Happy', '😊', 'Happy'], ['Okay', '😐', 'Okay'], ['Unhappy', '😞', 'Unhappy'], ['No answer', '📵', 'No answer']].map(([v, e, l]) => `<button type="button" data-v="${v}"><span>${e}</span>${l}</button>`).join('')}</div></div>
    <label class="field"><span>What did they say?</span><textarea class="textarea" id="hp-note" style="min-height:70px" placeholder="e.g. Happy with the laptop, wants a mouse next week"></textarea></label>`,
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="hp-save" disabled>Save</button>` }));
  let result = '';
  el.querySelectorAll('#hp-opts button').forEach(b => b.onclick = () => { result = b.dataset.v; el.querySelectorAll('#hp-opts button').forEach(x => x.classList.toggle('on', x === b)); el.querySelector('#hp-save').disabled = false; });
  el.querySelector('#hp-save').onclick = async ev => {
    try {
      const r = await busy(ev.currentTarget, () => api('happyCall', { customerId: id, result, note: el.querySelector('#hp-note').value }));
      upsert(r.customer); if (State.activity[id]) State.activity[id].unshift(r.activity);
      closeOverlay();
      toast(result === 'No answer' ? 'Saved · try again later' : result === 'Unhappy' ? 'Saved · managers will see this feedback' : 'Feedback saved 😊');
      refreshUI();
    } catch (e) { toast(e.message, true); }
  };
}

/* ======================= TASKS ======================= */
const TASK_PRI = ['Low', 'Normal', 'High', 'Urgent'];
const TASK_ST = ['Open', 'In progress', 'Done'];
const PRI_CLS = { Urgent: 'c-red', High: 'c-orange', Normal: 'c-blue', Low: 'c-gray' };
const ST_CLS = { 'Open': 'c-blue', 'In progress': 'c-yellow', 'Done': 'c-green' };
const canAssign = () => !!(State.me && State.me.taskTargets && State.me.taskTargets.length);
const myOpenTasks = () => State.tasks.filter(t => t.assignedTo === State.me.username && t.status !== 'Done');
const priRank = p => 3 - TASK_PRI.indexOf(p || 'Normal');
function viewTasks() {
  const me = State.me.username; const f = State.tf;
  const tabs = [['mine', 'My tasks', State.tasks.filter(t => t.assignedTo === me && t.status !== 'Done').length]];
  if (canAssign()) tabs.push(['given', 'Assigned by me', State.tasks.filter(t => t.assignedBy === me && t.status !== 'Done').length]);
  if (isAdmin()) tabs.push(['all', 'Everyone', State.tasks.filter(t => t.status !== 'Done').length]);
  if (!tabs.find(x => x[0] === f.tab)) f.tab = tabs[0][0];
  const scope = State.tasks.filter(t => f.tab === 'mine' ? t.assignedTo === me : f.tab === 'given' ? t.assignedBy === me : true);
  const list = scope.filter(t => f.status === 'open' ? t.status !== 'Done' : f.status === 'done' ? t.status === 'Done' : true)
    .sort((a, b) => (a.status === 'Done') - (b.status === 'Done') || priRank(a.priority) - priRank(b.priority) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (b.createdAt || '').localeCompare(a.createdAt || ''));
  const t0 = ymd();
  const dueB = t => !t.dueDate || t.status === 'Done' ? '' : `<span class="badge ${t.dueDate < t0 ? 'c-red' : t.dueDate === t0 ? 'c-orange' : 'c-gray'}">${t.dueDate < t0 ? 'Late · ' : 'Due '}${h(relDay(t.dueDate))}</span>`;
  return `
  <div class="page-head">
    <div><p class="eyebrow">${f.tab === 'mine' ? 'Work given to you' : f.tab === 'given' ? 'Work you gave to the team' : 'All tasks in the shop'}</p><h1 class="title">Tasks</h1></div>
    <div class="head-btns">${canAssign() ? `<button class="btn btn-primary" onclick="App.newTask()">${ico('plus', 'sm')} <span>Assign task</span></button>` : ''}</div>
  </div>
  ${tabs.length > 1 ? `<div class="seg" style="margin-bottom:14px">${tabs.map(([v, l, n]) => `<button class="${f.tab === v ? 'on' : ''}" onclick="App.tf('tab','${v}')">${l}${n ? ` <span class="seg-n">${n}</span>` : ''}</button>`).join('')}</div>` : ''}
  <div class="chips" style="margin-bottom:14px">${[['open', 'To do'], ['done', 'Done'], ['all', 'All']].map(([v, l]) => `<button class="chip ${f.status === v ? 'on' : ''}" onclick="App.tf('status','${v}')">${l}</button>`).join('')}</div>
  <div class="list">${list.length ? list.map(t => `<button class="row task-row pri-${h((t.priority || 'Normal').toLowerCase())}" onclick="App.openTask('${h(t.id)}')">
    ${staffAv(f.tab === 'mine' ? t.assignedBy : t.assignedTo, '')}
    <div class="main-txt"><b>${h(t.title)}</b><small>${f.tab === 'mine' ? 'From ' + h(staffName(t.assignedBy)) : 'To ' + h(staffName(t.assignedTo)) + (f.tab === 'all' ? ' · from ' + h(staffName(t.assignedBy)) : '')} · ${h(rel(t.createdAt))}${t.lastNote ? ' · “' + h(t.lastNote) + '”' : ''}${Number(t.remindCount) ? ` · reminded ${h(t.remindCount)}×` : ''}</small></div>
    <div class="meta"><span class="badge ${PRI_CLS[t.priority] || 'c-blue'}">${h(t.priority || 'Normal')}</span><span class="badge ${ST_CLS[t.status] || 'c-gray'}"><i></i>${h(t.status)}</span>${dueB(t)}</div></button>`).join('')
    : emptyBox('check', f.status === 'open' ? 'Nothing to do' : 'No tasks here', f.tab === 'mine' && f.status === 'open' ? 'Tasks given to you will show up here and on the 🔔 bell.' : '')}</div>`;
}
function taskForm(t) {
  const edit = !!(t && t.id); t = t || {};
  const targets = (State.me.taskTargets || []).map(u => State.staff.find(s => s.username === u)).filter(Boolean);
  let pri = t.priority || 'Normal';
  const el = openOverlay(modal({ title: edit ? 'Edit task' : 'Assign a task', cls: 'wide', body: `<form id="task-form" autocomplete="off">
    <label class="field"><span>Give to <em>*</em></span><select class="select" name="assignedTo" required><option value="">Choose a person…</option>${targets.map(s => `<option value="${h(s.username)}" ${t.assignedTo === s.username ? 'selected' : ''}>${h(s.name)}${s.title ? ' · ' + h(s.title) : ''}</option>`).join('')}</select></label>
    <label class="field"><span>What needs to be done? <em>*</em></span><input class="input" name="title" value="${h(t.title)}" required autofocus placeholder="e.g. Call Govt. College about the tender"></label>
    <label class="field"><span>Details</span><textarea class="textarea" name="details" style="min-height:70px">${h(t.details)}</textarea></label>
    <div class="field"><span>Priority</span><div class="chips" id="tk-pri">${TASK_PRI.map(p => `<button type="button" class="chip pri-chip pri-${p.toLowerCase()} ${pri === p ? 'on' : ''}" data-p="${p}">${p}</button>`).join('')}</div></div>
    <div class="field"><span>Finish by</span><input class="input" type="date" name="dueDate" value="${h(t.dueDate)}">
      <div class="chips" style="margin-top:8px">${[['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['1 week', 7]].map(([l, n]) => `<button type="button" class="chip" data-d="${n}">${l}</button>`).join('')}</div></div>
  </form>`, foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="tk-save">${edit ? 'Save' : 'Assign task'}</button>` }));
  const f = el.querySelector('#task-form');
  el.querySelectorAll('#tk-pri .chip').forEach(b => b.onclick = () => { pri = b.dataset.p; el.querySelectorAll('#tk-pri .chip').forEach(x => x.classList.toggle('on', x === b)); });
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { f.dueDate.value = addDays(Number(b.dataset.d)); });
  el.querySelector('#tk-save').onclick = async ev => {
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f).entries()); data.priority = pri; if (edit) data.id = t.id;
    try {
      const saved = await busy(ev.currentTarget, () => api('saveTask', { task: data }));
      upsertTask(saved); delete State.activity[saved.id];
      closeOverlay(); toast(edit ? 'Task updated' : `Task sent to ${staffName(saved.assignedTo)}`);
      if (edit && State.openTaskId === saved.id) { closeOverlay(); openTask(saved.id); } else refreshUI();
    } catch (e) { toast(e.message, true); }
  };
}
function upsertTask(t) { const i = State.tasks.findIndex(x => x.id === t.id); if (i >= 0) State.tasks[i] = t; else State.tasks.unshift(t); }
function openTask(id) {
  const t = State.tasks.find(x => x.id === id); if (!t) return toast('Task not found', true);
  State.openTaskId = id;
  const me = State.me.username; const mine = t.assignedTo === me, owner = t.assignedBy === me;
  const body = `
    <div class="task-top"><span class="badge ${PRI_CLS[t.priority]}">${h(t.priority)} priority</span><span class="badge ${ST_CLS[t.status]}"><i></i>${h(t.status)}</span>${t.dueDate ? `<span class="badge ${t.status !== 'Done' && t.dueDate < ymd() ? 'c-red' : 'c-gray'}">Finish by ${h(fmtDate(t.dueDate, true))}</span>` : ''}</div>
    ${t.details ? `<p class="task-details">${h(t.details)}</p>` : ''}
    <div class="kv"><div><span>From</span><span>${h(staffName(t.assignedBy))}</span></div><div><span>To</span><span>${h(staffName(t.assignedTo))}</span></div>
      <div><span>Given</span><span>${h(fmtDT(t.createdAt))}</span></div>${Number(t.remindCount) ? `<div><span>Reminders sent</span><span>${h(t.remindCount)} · last ${h(rel(t.remindedAt))}</span></div>` : ''}${t.doneAt ? `<div><span>Done</span><span>${h(fmtDT(t.doneAt))}</span></div>` : ''}</div>
    ${mine || owner ? `<div class="group-title">Add an update</div>
    <div class="composer"><textarea id="tk-note" rows="2" placeholder="${mine ? 'What have you done so far?' : 'Add a note for ' + h(staffName(t.assignedTo))}"></textarea>
      <div class="composer-foot"><div class="seg" id="tk-st">${TASK_ST.map(s => `<button class="${t.status === s ? 'on' : ''}" data-s="${s}">${s}</button>`).join('')}</div><button class="btn btn-primary btn-sm" id="tk-upd">Update</button></div></div>` : ''}
    ${owner ? `<div class="group-title">Priority</div><div class="chips" id="tk-pri2" style="margin-bottom:18px">${TASK_PRI.map(p => `<button class="chip pri-chip pri-${p.toLowerCase()} ${t.priority === p ? 'on' : ''}" data-p="${p}">${p}</button>`).join('')}</div>` : ''}
    <div class="group-title">History</div><div class="timeline" id="ttimeline"></div>`;
  const el = openOverlay(modal({ title: h(t.title), sub: `${h(staffName(t.assignedBy))} → ${h(staffName(t.assignedTo))}`, body, cls: 'wide',
    foot: owner ? `<button class="btn btn-danger" id="tk-del" style="margin-right:auto">${ico('trash', 'sm')}</button><button class="btn btn-ghost" id="tk-edit">${ico('edit', 'sm')} Edit</button>${t.status !== 'Done' ? `<button class="btn btn-primary" id="tk-remind">${ico('bell', 'sm')} Resend reminder</button>` : ''}` : '' }),
    { onClose: () => { State.openTaskId = null; } });
  let st = t.status;
  el.querySelectorAll('#tk-st button').forEach(b => b.onclick = () => { st = b.dataset.s; el.querySelectorAll('#tk-st button').forEach(x => x.classList.toggle('on', x === b)); });
  const after = (saved, msg) => { upsertTask(saved); toast(msg); closeOverlay(); refreshUI(); updateBell(); openTask(saved.id); };
  const upd = el.querySelector('#tk-upd');
  if (upd) upd.onclick = async ev => {
    try { const r = await busy(ev.currentTarget, () => api('taskUpdate', { id, status: st, note: el.querySelector('#tk-note').value })); if (State.activity[id]) State.activity[id].unshift(r.activity); after(r.task, st === 'Done' && t.status !== 'Done' ? 'Task done ✓' : 'Update saved'); }
    catch (e) { toast(e.message, true); }
  };
  el.querySelectorAll('#tk-pri2 .chip').forEach(b => b.onclick = async () => {
    if (b.dataset.p === t.priority) return;
    try { const saved = await busy(b, () => api('saveTask', { task: { id, priority: b.dataset.p } })); delete State.activity[id]; after(saved, 'Priority: ' + saved.priority); } catch (e) { toast(e.message, true); }
  });
  const rm = el.querySelector('#tk-remind');
  if (rm) rm.onclick = async ev => { try { const saved = await busy(ev.currentTarget, () => api('remindTask', { id })); delete State.activity[id]; after(saved, `Reminder sent to ${staffName(saved.assignedTo)}`); } catch (e) { toast(e.message, true); } };
  const ed = el.querySelector('#tk-edit'); if (ed) ed.onclick = () => taskForm(t);
  const del = el.querySelector('#tk-del');
  if (del) del.onclick = async () => {
    if (!await confirmBox('Delete this task?', t.title, 'Delete', true)) return;
    try { await api('deleteTask', { id }); State.tasks = State.tasks.filter(x => x.id !== id); closeOverlay(); toast('Task deleted'); refreshUI(); updateBell(); } catch (e) { toast(e.message, true); }
  };
  const paint = () => {
    const box = el.querySelector('#ttimeline'); if (!box) return; const acts = State.activity[id];
    box.innerHTML = !acts ? `<div style="padding:14px;text-align:center"><span class="spinner dark" style="display:inline-block"></span></div>` : acts.length ? acts.map(a => `<div class="tl-item">${actDot(a.type)}<div class="tl-body"><p>${h(a.text)}</p><small class="tl-who">${staffAv(a.user, 'xs')}${h(staffName(a.user))} · ${h(rel(a.timestamp))}</small></div></div>`).join('') : '<p class="muted">No history yet.</p>';
  };
  paint();
  if (!State.activity[id]) api('getActivity', { customerId: id }).then(a => { State.activity[id] = a; paint(); }).catch(() => { State.activity[id] = []; paint(); });
}

/* ======================= BACKUP & SETTINGS (Saneed only, PIN-locked) ======================= */
const VAULT_MINUTES = 10; // after the right PIN, the panel stays open for this long without asking again
function vaultPin() { return State.vault && Date.now() - State.vault.at < VAULT_MINUTES * 60000 ? State.vault.pin : ''; }
async function openVault() {
  if (!State.me.backupAdmin) return toast('Only Saneed can open Backup & settings', true);
  if (vaultPin()) return vaultPanel();
  let st;
  try { st = await api('pinStatus'); } catch (e) { return toast(e.message, true); }
  const create = !st.isSet;
  const el = openOverlay(modal({ title: create ? 'Create a PIN' : 'Enter your PIN', sub: create ? 'This PIN protects backup, restore and connection settings. Keep it private.' : 'Backup & settings is locked', cls: 'narrow', body: `<form id="pin-form">
    <label class="field"><span>${create ? 'New PIN (4–6 digits)' : 'PIN'}</span><input class="input lg pin-input" name="pin" type="password" inputmode="numeric" pattern="\\d{4,6}" maxlength="6" required autofocus autocomplete="off"></label>
    ${create ? `<label class="field"><span>Type it again</span><input class="input lg pin-input" name="pin2" type="password" inputmode="numeric" maxlength="6" required autocomplete="off"></label>` : ''}
    <div id="pin-err" class="hint err hidden"></div></form>`,
    foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="pin-go">${create ? 'Save PIN' : 'Unlock'}</button>` }));
  const f = el.querySelector('#pin-form'); const err = el.querySelector('#pin-err');
  const go = async ev => {
    if (ev && ev.preventDefault) ev.preventDefault();
    err.classList.add('hidden');
    const pin = f.pin.value.trim();
    if (!/^\d{4,6}$/.test(pin)) { err.textContent = 'PIN must be 4 to 6 digits'; err.classList.remove('hidden'); return; }
    if (create && pin !== f.pin2.value.trim()) { err.textContent = 'The two PINs are different'; err.classList.remove('hidden'); return; }
    try {
      await busy(el.querySelector('#pin-go'), () => api(create ? 'setPin' : 'pinCheck', { pin }));
      State.vault = { pin, at: Date.now() };
      closeOverlay(); if (create) toast('PIN saved'); vaultPanel();
    } catch (e) { err.textContent = e.message; err.classList.remove('hidden'); f.pin.value = ''; f.pin.focus(); }
  };
  f.onsubmit = go; el.querySelector('#pin-go').onclick = go;
}
async function vaultPanel() {
  const pin = vaultPin(); if (!pin) return openVault();
  const el = openOverlay(modal({ title: `${ico('shield', 'sm')} Backup & settings`, sub: 'Locks again after ' + VAULT_MINUTES + ' minutes', cls: 'wide', body: `<div id="vault-body"><div class="empty"><span class="spinner dark" style="margin:auto;display:block"></span></div></div>` }));
  let info = {};
  try { info = await api('adminInfo', { pin }); } catch (e) { el.querySelector('#vault-body').innerHTML = `<p class="hint err">${h(e.message)}</p>`; return; }
  const apiUrl = currentApiUrl(); const devKey = currentApiKey();
  el.querySelector('#vault-body').innerHTML = `
    <div class="vault-sec">
      <div class="vault-h">${ico('download')}<div><b>Download backup</b><small>Every customer, sale, job, supplier bill, advance, task, staff login and history entry up to now, in one file.${info.lastBackup ? ' Last backup: ' + h(fmtDT(info.lastBackup.split(' by ')[0])) + (info.lastBackup.includes(' by ') ? ' by ' + h(info.lastBackup.split(' by ')[1]) : '') + '.' : ''}</small></div></div>
      <button class="btn btn-dark" id="v-backup">${ico('download', 'sm')} Download backup (${h(fmtDate(ymd(), true))})</button>
      <p class="hint" style="margin:10px 2px 0">Keep it somewhere safe (Google Drive, a pen drive). One backup a week is a good habit, and always one before updating the app.</p>
    </div>
    <div class="vault-sec">
      <div class="vault-h">${ico('refresh')}<div><b>Restore from a backup</b><small>Replaces <b>all</b> current data with the backup file. A copy of today's data is kept first as hidden tabs in the Google Sheet (“Before restore …”), so this can be undone.</small></div></div>
      <label class="btn btn-ghost file-btn">${ico('note', 'sm')} Choose backup file<input type="file" id="v-file" accept=".json,application/json"></label>
      <div id="v-preview"></div>
    </div>
    <div class="vault-sec">
      <div class="vault-h">${ico('sheet')}<div><b>Connection</b><small>Where the app saves its data.</small></div></div>
      <div class="kv">
        <div><span>Google Sheet</span><span>${info.sheetUrl ? `<a href="${h(info.sheetUrl)}" target="_blank" rel="noopener">Open the sheet</a>` : DEMO ? 'Demo mode (this browser only)' : '—'}</span></div>
        <div><span>Apps Script link</span><span class="mono">${h(info.scriptUrl || apiUrl || '—')}</span></div>
        <div><span>This device uses</span><span class="mono">${h(apiUrl || 'demo mode')}${localGet('bicrm_api_url') ? ' (changed on this device)' : ''}</span></div>
      </div>
      <label class="field" style="margin-top:12px"><span>Apps Script link for this device</span><input class="input mono" id="v-url" value="${h(localGet('bicrm_api_url') || '')}" placeholder="${h(CFG.API_URL || 'https://script.google.com/macros/s/…/exec')}"></label>
      <p class="hint" style="margin-top:-6px">Leave empty to use the link in <code>config.js</code> (what every staff phone uses). Fill it only to test a new deployment on this device.</p>
      <div class="vault-btns"><button class="btn btn-ghost btn-sm" id="v-url-save">Save on this device</button><button class="btn btn-ghost btn-sm" id="v-url-test">Test connection</button><span id="v-url-msg" class="tiny"></span></div>
    </div>
    <div class="vault-sec">
      <div class="vault-h">${ico('key')}<div><b>Backend key</b><small>Optional extra lock: when on, only copies of the app that know this key can read or change the sheet, even if someone finds the Apps Script link.</small></div></div>
      <div class="kv"><div><span>Status</span><span>${info.keyOn ? '<span class="badge c-green"><i></i>On</span>' : '<span class="badge c-gray">Off</span>'}</span></div>
        ${info.keyOn ? `<div><span>Key</span><span class="mono">${h(info.key)}</span></div>` : ''}
        <div><span>This device sends</span><span class="mono">${devKey ? h(devKey.slice(0, 6)) + '…' : 'no key'}</span></div></div>
      <p class="hint warn" style="margin-top:10px">Before turning it on: put the key in <code>config.js</code> as <code>API_KEY</code> and upload the app to Vercel, or every staff phone will stop working. To undo from the Apps Script editor, run <code>turnOffBackendKey</code>.</p>
      <div class="vault-btns">${info.keyOn ? `<button class="btn btn-danger btn-sm" id="v-key-off">Turn off</button>` : ''}<button class="btn btn-ghost btn-sm" id="v-key-new">${info.keyOn ? 'Change key' : 'Turn on with a new key'}</button></div>
    </div>
    <div class="vault-sec">
      <div class="vault-h">${ico('shield')}<div><b>PIN</b><small>Forgot it? In the Apps Script editor run <code>resetAdminPin</code>, then set a new one here.</small></div></div>
      <button class="btn btn-ghost btn-sm" id="v-pin">Change PIN</button>
    </div>`;
  const q = s => el.querySelector(s);
  q('#v-backup').onclick = async ev => {
    try {
      const data = await busy(ev.currentTarget, () => api('backup', { pin: vaultPin() || pin }));
      const n = Object.values(data.sheets).reduce((t, x) => t + x.rows.length, 0);
      saveBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `BestIndia_Backup_${ymd()}.json`);
      toast(`Backup downloaded · ${n.toLocaleString('en-IN')} rows`);
    } catch (e) { toast(e.message, true); }
  };
  q('#v-file').onchange = () => {
    const file = q('#v-file').files[0]; if (!file) return;
    const box = q('#v-preview');
    const fr = new FileReader();
    fr.onload = () => {
      let data; try { data = JSON.parse(fr.result); } catch (e) { box.innerHTML = `<p class="hint err">That file is not a backup (could not read it).</p>`; return; }
      if (!data || data.app !== 'Best India CRM' || !data.sheets) { box.innerHTML = `<p class="hint err">That file is not a Best India backup.</p>`; return; }
      const rows = Object.entries(data.sheets).map(([k, v]) => `<div><span>${h(k)}</span><span>${(v.rows || []).length.toLocaleString('en-IN')} rows</span></div>`).join('');
      box.innerHTML = `<div class="restore-box"><b>Backup from ${h(fmtDT(data.createdAt))}${data.by ? ' · made by ' + h(data.by) : ''}</b>
        <div class="kv" style="margin:10px 0">${rows}</div>
        <label class="field"><span>Type <b>RESTORE</b> to confirm</span><input class="input" id="v-confirm" autocomplete="off" placeholder="RESTORE"></label>
        <button class="btn btn-danger" id="v-restore" disabled>${ico('refresh', 'sm')} Replace all data with this backup</button></div>`;
      const c = box.querySelector('#v-confirm'), b = box.querySelector('#v-restore');
      c.oninput = () => { b.disabled = c.value.trim() !== 'RESTORE'; };
      b.onclick = async () => {
        try {
          const r = await busy(b, () => api('restore', { pin: vaultPin() || pin, data }));
          toast('Backup restored'); State.activity = {}; State.perf.at = 0; dataSig = '';
          await sync(); closeOverlay(true); renderShell();
          openOverlay(modal({ title: 'Backup restored', cls: 'narrow', body: `<div class="kv">${Object.entries(r.counts).map(([k, v]) => `<div><span>${h(k)}</span><span>${v} rows</span></div>`).join('')}</div><p class="hint">Old data kept as: ${h(r.keptAs)}</p>`,
            foot: `<button class="btn btn-primary" onclick="App.close()">OK</button>` }));
        } catch (e) { toast(e.message, true); }
      };
    };
    fr.readAsText(file);
  };
  q('#v-url-save').onclick = () => {
    const v = q('#v-url').value.trim();
    if (v && !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(v)) return toast('That doesn’t look like an Apps Script web app link (…/exec)', true);
    localSet('bicrm_api_url', v);
    toast(v ? 'Saved on this device. Reloading…' : 'Using the link from config.js. Reloading…');
    setTimeout(() => location.reload(), 900);
  };
  q('#v-url-test').onclick = async ev => {
    const url = q('#v-url').value.trim() || apiUrl; const msg = q('#v-url-msg');
    if (!url) { msg.textContent = 'Demo mode, nothing to test'; return; }
    try { await busy(ev.currentTarget, async () => { const d = await (await fetch(url, { redirect: 'follow' })).json(); if (!d.ok) throw new Error(); msg.innerHTML = `<span style="color:var(--green)">● Connected${d.sheet === false ? ' (sheet not set up yet)' : ''}</span>`; }); }
    catch (e) { msg.innerHTML = `<span style="color:var(--red)">● Could not connect</span>`; }
  };
  const keyNew = q('#v-key-new');
  if (keyNew) keyNew.onclick = async () => {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(16).padStart(2, '0')).join('');
    const ok = await confirmBox('Turn on the backend key?', `New key: ${key}\n\nThis device will start using it right away. Every other phone needs it in config.js (API_KEY) — upload that first, or they will stop working.`, 'Turn on');
    if (!ok) return;
    try { await api('setBackendKey', { pin: vaultPin() || pin, key }); localSet('bicrm_api_key', key); toast('Backend key is on'); closeOverlay(); vaultPanel(); } catch (e) { toast(e.message, true); }
  };
  const keyOff = q('#v-key-off');
  if (keyOff) keyOff.onclick = async () => {
    if (!await confirmBox('Turn off the backend key?', 'Any copy of the app will be able to connect again with just a staff login.', 'Turn off', true)) return;
    try { await api('setBackendKey', { pin: vaultPin() || pin, key: '' }); localSet('bicrm_api_key', ''); toast('Backend key is off'); closeOverlay(); vaultPanel(); } catch (e) { toast(e.message, true); }
  };
  q('#v-pin').onclick = () => {
    const e2 = openOverlay(modal({ title: 'Change PIN', cls: 'narrow', body: `<form id="cp-form">
      <label class="field"><span>Current PIN</span><input class="input pin-input" name="o" type="password" inputmode="numeric" maxlength="6" required autofocus></label>
      <label class="field"><span>New PIN (4–6 digits)</span><input class="input pin-input" name="n" type="password" inputmode="numeric" maxlength="6" required></label></form>`,
      foot: `<button class="btn btn-ghost" onclick="App.close()">Cancel</button><button class="btn btn-primary" id="cp-go">Save</button>` }));
    e2.querySelector('#cp-go').onclick = async ev => {
      const f = e2.querySelector('#cp-form');
      try { await busy(ev.currentTarget, () => api('setPin', { oldPin: f.o.value, pin: f.n.value })); State.vault = { pin: f.n.value, at: Date.now() }; closeOverlay(); toast('PIN changed'); } catch (e) { toast(e.message, true); }
    };
  };
}

/* ======================= SYNC / BOOT ======================= */
const CACHE_KEY = 'bicrm_cache';
let dataSig = '';
function applyData(d) {
  State.customers = d.customers || []; State.staff = d.staff || [];
  State.sales = d.sales || []; State.jobs = d.jobs || []; State.credits = d.credits || []; State.advances = d.advances || []; State.tasks = d.tasks || [];
}
/** Cheap fingerprint of the data, so the screen is only redrawn when something actually changed. */
function signature(d) {
  const part = (arr, k) => (arr || []).length + ':' + (arr || []).reduce((m, x) => (x[k] || '') > m ? x[k] : m, '');
  return [part(d.customers, 'updatedAt'), part(d.sales, 'updatedAt'), part(d.jobs, 'updatedAt'), part(d.credits, 'updatedAt'), (d.advances || []).map(a => a.status).join(''), part(d.advances, 'decidedAt'), part(d.tasks, 'updatedAt'), (d.tasks || []).length + ':' + (d.tasks || []).map(t => t.remindedAt).sort().pop(), (d.staff || []).map(s => s.username + s.name + s.title + (s.photo || '').length + (s.email || '')).join(',')].join('|');
}
/** Returns true when the data changed since the last sync. */
async function sync() {
  const d = await api('bootstrap');
  if (!State.token) return false; // signed out while this was loading
  State.me = d.me; ls.set('bicrm_me', d.me);
  if (d.token) { State.token = d.token; ls.set('bicrm_token', d.token); } // session renewed while the app is in use
  const sig = signature(d);
  const changed = sig !== dataSig; dataSig = sig;
  if (changed) {
    applyData(d);
    State.perf.at = 0; // performance numbers are refreshed on next view
    // keep a copy on this device so the app opens instantly next time (cleared on sign out)
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ u: d.me.username, customers: d.customers, staff: d.staff, sales: d.sales, jobs: d.jobs, credits: d.credits, advances: d.advances, tasks: d.tasks })); } catch (e) {}
  }
  State.lastSync = Date.now();
  setSync('ok');
  return changed;
}

function startShell(fresh) {
  State.loaded = true;
  if (fresh || !State.view) State.view = (navItems()[0] || ['home'])[0];
  if (!fresh && location.hash.length > 1 && navItems().some(n => n[0] === location.hash.slice(1))) State.view = location.hash.slice(1);
  State.fuScope = isAdmin() ? 'all' : 'mine';
  renderShell();
}

async function boot(fresh) {
  if (!State.token) return renderLogin();
  // Opening the app again more than 2 hours after signing in → sign in again.
  if (!fresh && sessionOver()) return logout(true, `Your ${SESSION_HOURS}-hour session has ended. Please sign in again.`);
  // Show the last saved data straight away, then refresh from Google Sheets in the background.
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) {}
  if (cached && State.me && cached.u === State.me.username) {
    applyData(cached); dataSig = signature(cached);
    startShell(fresh);
    setSync('syncing');
    try { if (await sync()) { if (!stack.length) refreshUI(); else { updateBell(); renderTabbar(); } } } catch (e) { if (!State.token) return; toast(e.message, true); }
  } else {
    if (!State.loaded) $('#app').innerHTML = `<div class="splash">${brandMark()}</div>`;
    try { await sync(); } catch (e) { if (!State.token) return; toast(e.message, true); if (!State.me) return renderLogin(); }
    startShell(fresh);
  }
  if (!State.token) return;
  setTimeout(() => showReminder(false), 500);
  clearInterval(State.poll);
  let lastDay = ymd();
  State.poll = setInterval(async () => {
    if (document.hidden || !State.token) return;
    try {
      const changed = await sync();
      if (changed) { if (!stack.length) refreshUI(); else { updateBell(); renderTabbar(); } }
      if (ymd() !== lastDay) { lastDay = ymd(); refreshUI(); showReminder(false); }
    } catch (e) {}
  }, DEMO ? 30000 : 90000);
}

document.addEventListener('visibilitychange', () => { if (!document.hidden && State.token && State.loaded && Date.now() - (State.lastSync || 0) > 60000) sync().then(ch => { if (ch && !stack.length) refreshUI(); }).catch(() => {}); });

/* ======================= PUBLIC HANDLERS ======================= */
let searchT;
window.App = {
  close: () => closeOverlay(),
  go(v) { State.view = v; State.limit = 60; State.sf.limit = 60; State.jf.limit = 60; renderView(); window.scrollTo({ top: 0 }); },
  quickAdd, more_: moreMenu, vault: () => openVault(),
  async signOut() { if (await confirmBox('Sign out?', `You'll need your ID and passcode to sign in again.`, 'Sign out', true)) logout(); },
  openAny(id) { id = String(id); if (id.startsWith('go:')) return App.go(id.slice(3)); if (id[0] === 'T') return openTask(id); if (id[0] === 'V') return App.go('advances'); if (String(id)[0] === 'J') openJob(id); else if (String(id)[0] === 'S') { const s = State.sales.find(x => x.id === id); if (s) saleForm(s); } else openCustomer(id); },
  newSale() { saleForm(null); }, editSale(id) { saleForm(State.sales.find(s => s.id === id)); },
  newJob() { jobForm(null); }, openJob: id => openJob(id), editJob(id) { jobForm(State.jobs.find(j => j.id === id)); },
  sf(k, v) { State.sf[k] = v; State.sf.limit = 60; renderView(); },
  jf(k, v) { State.jf[k] = v; State.jf.limit = 60; renderView(); },
  sfMore() { State.sf.limit += 60; renderView(); }, jfMore() { State.jf.limit += 60; renderView(); },
  dash(k, v) { State.dash[k] = v; renderView(); },
  perf(k, v) { State.perf[k] = v; renderView(); },
  perfOpen: u => perfDetail(u),
  async perfRefresh(btn) { State.perf.at = 0; await busy(btn, async () => { await sync(); await afterPerf(); }); renderView(); },
  jobStatus: (id, s, btn) => setJobStatus(id, s, btn),
  jobNote: (id, btn) => addJobNote(id, btn),
  exportSales, exportJobs,
  goFilter(status, period) { State.status = status; State.period = period; State.assignee = ''; State.q = ''; const s = $('#top-search'); if (s) s.value = ''; App.go('customers'); },
  search(v) {
    if (State.view === 'debtors' || State.view === 'creditors') {
      (State.view === 'debtors' ? State.df : State.cf).q = v; clearTimeout(searchT); searchT = setTimeout(renderView, 150); return;
    }
    if (State.view === 'sales' || State.view === 'service') {
      const st = State.view === 'sales' ? State.sf : State.jf; st.q = v; st.limit = 60;
      clearTimeout(searchT);
      searchT = setTimeout(() => { const r = $('#mod-results'); if (r) r.innerHTML = State.view === 'sales' ? salesResults() : jobResults(); }, 120);
      return;
    }
    if (!can('crm')) return;
    State.q = v; State.limit = 60;
    clearTimeout(searchT);
    searchT = setTimeout(() => {
      if (v && State.view !== 'customers') { State.view = 'customers'; State.status = 'all'; renderView(); return; }
      if (v && State.status === 'Open') { State.status = 'all'; renderView(); return; }
      const r = $('#cust-results'); if (r) r.innerHTML = custResults();
    }, 120);
  },
  setStatus(s) { State.status = s; State.limit = 60; renderView(); },
  setPeriod(p) { if (p === 'date') return App.setDate(State.onDate || ymd()); State.period = p; renderView(); },
  setAssignee(a) { State.assignee = a; $('#cust-results').innerHTML = custResults(); },
  setFuScope(s) { State.fuScope = s; renderView(); },
  more() { State.limit += 60; $('#cust-results').innerHTML = custResults(); },
  adminTab(t) { State.adminTab = t; renderView(); },
  newCustomer() { if (!can('add')) return toast('No permission to add customers', true); customerForm(null); },
  edit(id) { customerForm(State.customers.find(c => c.id === id)); },
  open: openCustomer,
  async del(id) {
    const c = State.customers.find(x => x.id === id);
    if (!await confirmBox(`Delete ${c.name}?`, 'This removes the customer from the sheet permanently. History stays in the Activity log.', 'Delete', true)) return;
    try { await api('deleteCustomer', { id }); State.customers = State.customers.filter(x => x.id !== id); closeOverlay(); toast('Customer deleted'); refreshUI(); } catch (e) { toast(e.message, true); }
  },
  visit: (id, btn) => logVisit(id, btn),
  logCall(id) { setTimeout(() => activity(id, { type: 'call', text: 'Called customer' }, null, null), 400); },
  setFu(id, date, btn) {
    if (!date) return;
    const c = State.customers.find(x => x.id === id);
    const p = { type: 'followup', followUpDate: date, text: 'Follow-up set for ' + fmtDate(date, true) };
    if (DONE.includes(c.status) || c.status === 'New') p.status = 'Follow-up';
    activity(id, p, btn && btn.tagName === 'BUTTON' ? btn : null, 'Reminder set · ' + relDay(date));
  },
  setStatusOf(id, s, btn) {
    const c = State.customers.find(x => x.id === id); if (c.status === s) return;
    const p = { type: 'status', status: s };
    if (['Follow-up', 'Pending'].includes(s) && !c.followUpDate) { p.followUpDate = addDays(1); }
    if (DONE.includes(s)) p.followUpDate = '';
    activity(id, p, btn, 'Status: ' + s + (p.followUpDate ? ' · reminder tomorrow' : ''));
  },
  fuDone(id, btn) { activity(id, { type: 'followup', followUpDate: '', text: 'Follow-up done' }, btn, 'Follow-up done ✓'); },
  snooze(id, btn) { activity(id, { type: 'followup', followUpDate: addDays(1), text: 'Snoozed to tomorrow' }, btn, 'Moved to tomorrow'); },
  addNote(id, btn) {
    const ta = $('#note-text'); const text = ta.value.trim();
    const type = (document.querySelector('#note-type .on') || {}).dataset.t || 'note';
    if (!text && type === 'note') { ta.focus(); return; }
    activity(id, { type, text: text || (type === 'call' ? 'Called customer' : 'Visited the shop') }, btn, type === 'visit' ? 'Visit recorded' : 'Update added');
  },
  notifs: showNotifs,
  reminder: () => showReminder(true),
  meMenu,
  editStaff: staffForm,
  exportCSV,
  async refresh(btn) { try { await busy(btn, sync); refreshUI(); toast('Up to date'); } catch (e) { toast(e.message, true); } },
  async syncNow() {
    if (DEMO) return toast('Not connected to Google Sheets — add your Apps Script URL in config.js', true);
    if (State.sync.st === 'syncing') return;
    try { await sync(); refreshUI(); toast('Synced with Google Sheets'); } catch (e) { toast(e.message, true); }
  },
  report: reportDialog,
  hf(k, v) { State.hf[k] = v; renderView(); }, happy: id => happyForm(id),
  tf(k, v) { State.tf[k] = v; renderView(); }, newTask: () => taskForm(null), openTask: id => openTask(id),
  advRequest: () => advanceForm(), advDecide: (id, st, btn) => decideAdvance(id, st, btn),
  af(k, v) { State.af[k] = v; renderView(); },
  setDate(d) { if (!d) return; State.onDate = d; State.period = 'date'; State.status = 'all'; renderView(); loadDayVisits(d); },
  dayShift(n) { const d = addDays(n, State.onDate || ymd()); if (d > ymd()) return; App.setDate(d); },
  myEmail: () => emailForm(null),
  df(k, v) { State.df[k] = v; renderView(); }, cf(k, v) { State.cf[k] = v; renderView(); },
  debtor(key) { State.openDebtor = key; debtorDetail(key); },
  pay: (kind, id) => paymentForm(kind, id),
  newCredit() { creditForm(null); }, editCredit(id) { creditForm(State.credits.find(c => c.id === id)); },
  async resetDemo() { if (await confirmBox('Reset demo data?', 'All demo customers and changes in this browser will be replaced with fresh sample data.', 'Reset', true)) { MockServer.reset(); await sync(); renderShell(); toast('Demo data reset'); } }
};

/* ======================= START ======================= */
applyTheme();
const img = new Image();
img.onerror = () => { State.logo = null; if (State.loaded) renderShell(); else if (!State.token) renderLogin(); };
img.src = 'logo.png';
boot(false);

})();
