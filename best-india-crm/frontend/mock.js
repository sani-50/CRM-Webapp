/*
 * DEMO BACKEND — used only when CRM_CONFIG.API_URL is empty.
 * Mirrors the Google Apps Script API so the app can be tried without setup.
 * Data lives in this browser's localStorage.
 */
(function () {
  const KEY = 'bicrm_demo_db_v6';
  const TOKEN_HOURS = 2;
  const PERM_KEYS = ['crm', 'add', 'edit', 'viewAll', 'delete', 'export', 'reports', 'sales', 'service', 'dashboard', 'performance', 'accounts', 'advances', 'happycalls', 'manageStaff'];
  const LOCKED = ['convertedAt', 'convertedBy', 'saleId', 'happyStatus', 'happyAt', 'happyBy', 'happyRating', 'happyNote', 'happyTries'];
  const TASK_ASSIGNERS = { saneed: ['shaneer'], deepak: ['saneed', 'shaneer'], shaneer: [] };
  const markConv = (b, a, user, ts) => { if (a.status === 'Converted' && b.status !== 'Converted') { a.convertedAt = ts; a.convertedBy = user; } if (a.status !== 'Converted' && b.status === 'Converted') { a.convertedAt = ''; a.convertedBy = ''; a.saleId = ''; } };
  const permSet = list => { const o = {}; PERM_KEYS.forEach(k => { o[k] = list.includes(k); }); return o; };
  const ADMIN = permSet(PERM_KEYS);
  const ROLE = {
    accountant: permSet(PERM_KEYS.filter(k => k !== 'manageStaff')),
    manager: permSet(PERM_KEYS.filter(k => k !== 'manageStaff' && k !== 'advances')),
    sales: permSet(['crm', 'add', 'edit', 'viewAll', 'sales', 'service']),
    callcentre: permSet(['crm', 'add', 'edit', 'viewAll', 'sales', 'service', 'happycalls']),
    engineer: permSet(['service'])
  };
  const JOB_DONE = ['Ready', 'Delivered'];

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const now = () => iso(new Date());
  const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return iso(d).slice(0, 10); };
  let rs = 7;
  const rnd = () => { rs = (rs * 16807) % 2147483647; return (rs - 1) / 2147483646; };
  const ago = (days, h, m) => { const d = new Date(); d.setDate(d.getDate() - days); d.setHours(h == null ? 11 : h, m == null ? Math.floor(rnd() * 59) : m, 0); return iso(d); };
  let seq = 0;
  const id = p => p + Date.now().toString(36) + (seq++).toString(36) + Math.floor(Math.random() * 1e4);
  const money = v => Math.round(Number(String(v || '').replace(/[^\d.]/g, '')) || 0);

  function seed() {
    rs = 7;
    const users = [
      ['saneed', 'Saneed', '8321', 'admin', 'Operations Manager'], ['shaneer', 'Shaneer', '1234', 'admin', 'Chairman'],
      ['midhila', 'Midhila', '1234', 'accountant', 'Senior Accountant'], ['deepak', 'Deepak', '1234', 'manager', 'Store Manager'],
      ['shylesh', 'Shylesh', '1234', 'sales', 'Sales'], ['sona', 'Sona', '1234', 'callcentre', 'Call Centre'],
      ['nikhil', 'Nikhil', '1234', 'engineer', 'Outdoor Engineer'], ['safwan', 'Safwan', '1234', 'engineer', 'Indoor Engineer']
    ].map(([u, n, p, r, t]) => ({ username: u, name: n, pass: p, role: r === 'admin' ? 'admin' : 'staff', title: t,
      perms: r === 'admin' ? { ...ADMIN } : { ...ROLE[r] }, active: true, createdAt: now(), lastLogin: '', email: u + '@example.com' }));

    const S = [
      ['Arjun Menon', '9847012345', 'Kozhikode', 'Walk-in', 'Sales', 'Gaming laptop, budget 85k', '85000', 'Follow-up', 'High', day(0), 'deepak', 'Comparing ASUS TUF vs Lenovo LOQ. Call after 4pm.', 2],
      ['Fathima Rinsha', '9995123456', 'Feroke', 'Phone call', 'Service', 'HP printer not feeding paper', '', 'Pending', 'Normal', day(-1), 'sona', 'Waiting for roller part.', 3],
      ['St. Joseph\'s School', '04952345678', 'Devagiri', 'Referral', 'Lab equipment', 'Computer lab — 25 desktops + networking', '650000', 'Follow-up', 'Urgent', day(0), 'saneed', 'Principal wants quotation by Monday.', 5],
      ['Rahul Das', '8086123456', 'Mavoor Road', 'WhatsApp', 'Sales', 'Refurbished ThinkPad for college', '28000', 'Converted', 'Normal', '', 'shylesh', 'Bought T480, 3-year warranty.', 6],
      ['Nisha Varghese', '9446789012', 'Palayam', 'Walk-in', 'AMC', 'AMC for 8 office systems', '24000', 'Follow-up', 'Normal', day(2), 'midhila', 'Send AMC brochure on WhatsApp.', 1],
      ['Muhammed Shafeeq', '9048112233', 'Ramanattukara', 'Instagram', 'Networking', 'CCTV 8 cameras for shop', '42000', 'New', 'Normal', '', 'sona', '', 0],
      ['Anjali Krishnan', '7012345678', 'Nadakkavu', 'Walk-in', 'Service', 'MacBook battery replacement', '9500', 'Closed', 'Normal', '', 'shylesh', 'Delivered. Customer happy.', 9],
      ['Govt. College Office', '04962234567', 'Balussery', 'Referral', 'Sales', '10 UPS + 4 printers (tender)', '180000', 'Pending', 'High', day(-3), 'shylesh', 'Tender docs submitted.', 12],
      ['Vishnu Prasad', '9387654321', 'West Hill', 'Phone call', 'Enquiry', 'Graphics card RTX 4060 availability', '32000', 'Follow-up', 'Normal', day(1), 'sona', 'Stock expected Thursday.', 0],
      ['Haris K', '9656001122', 'Kunnamangalam', 'Walk-in', 'Sales', 'Office desktop i5, 2 nos', '72000', 'Lost', 'Normal', '', 'deepak', 'Went with online price.', 15],
      ['Ameen Traders', '9744556677', 'Palayam', 'Phone call', 'Sales', '3 billing PCs + thermal printers', '96000', 'Follow-up', 'High', day(-5), 'shylesh', 'Asked for revised quote.', 8],
      ['Reshma P', '9895443322', 'Chevayur', 'WhatsApp', 'Enquiry', 'Tablet for kids', '18000', 'Follow-up', 'Normal', day(-2), 'sona', '', 4]
    ];
    const customers = [], activity = [], sales = [], jobs = [];
    const act = (refId, ts, user, type, text, meta) => activity.push({ id: id('A'), customerId: refId, timestamp: ts, user, type, text, meta: meta ? JSON.stringify(meta) : '' });
    S.forEach((s, i) => {
      const created = ago(s[12], 10 + (i % 7));
      const c = {
        id: 'C' + (1000 + i), createdAt: created, name: s[0], phone: s[1], altPhone: '', email: '', location: s[2], source: s[3],
        category: s[4], requirement: s[5], amount: s[6], status: s[7], priority: s[8], followUpDate: s[9], assignedTo: s[10],
        notes: s[11], createdBy: s[10], updatedAt: created, updatedBy: s[10], lastVisit: created, visits: '1'
      };
      if (c.status === 'Converted') { c.convertedAt = ago(Math.max(0, s[12] - 3), 15); c.convertedBy = c.assignedTo; }
      if (i % 3 === 0 && s[12] <= 7 && s[4] !== 'AMC') { c.happyStatus = 'Done'; c.happyAt = ago(Math.max(0, s[12] - 1), 12); c.happyBy = 'sona'; c.happyRating = ['Happy', 'Okay', 'Unhappy'][i % 3]; c.happyTries = '1'; }
      customers.push(c);
      act(c.id, created, c.createdBy, 'visit', 'First visit recorded — ' + c.requirement);
      if (c.notes) act(c.id, created, c.createdBy, 'note', c.notes);
    });
    const names = ['Sajith', 'Ameen', 'Reshma', 'Jithin', 'Ashik', 'Divya', 'Faisal', 'Neethu', 'Riyas', 'Sreeja', 'Akhil', 'Hiba'];
    const crmStaff = ['deepak', 'shylesh', 'sona', 'shylesh', 'sona', 'midhila'];
    const saleStaff = ['shylesh', 'deepak', 'shylesh', 'sona', 'deepak', 'shylesh', 'saneed'];
    const items = [['Pendrive 64GB & mouse', 'Accessories', 1200], ['Lenovo IdeaPad i5', 'Laptop', 56500], ['HP 2333 printer', 'Printer', 6900], ['Refurbished Dell desktop', 'Refurbished', 14500],
      ['Logitech keyboard combo', 'Accessories', 1650], ['CCTV 4-camera kit', 'CCTV', 18900], ['TP-Link router + cabling', 'Networking', 4200], ['ASUS Vivobook 15', 'Laptop', 48900],
      ['SSD 512GB upgrade', 'Accessories', 3900], ['Antivirus 3-user', 'Software', 1400], ['UPS 600VA', 'Accessories', 3200], ['Assembled i5 desktop', 'Desktop', 38500]];
    for (let d = 0; d < 45; d++) {
      const nC = Math.floor(rnd() * 4);
      for (let k = 0; k < nC; k++) {
        const t = ago(d, 10 + k * 2); const who = crmStaff[(d + k) % crmStaff.length];
        const st = ['Converted', 'Closed', 'Converted', 'Lost', 'Closed'][(d + k) % 5];
        const c = { id: id('C'), createdAt: t, name: names[(d * 3 + k) % names.length] + ' ' + ['P', 'K', 'M', 'V', 'T'][(d + k) % 5], phone: '9' + String(Math.floor(1e8 + rnd() * 9e8)), altPhone: '', email: '', location: 'Kozhikode',
          source: ['Walk-in', 'Phone call', 'WhatsApp'][k % 3], category: ['Sales', 'Service', 'Sales', 'Refurbished'][(d + k) % 4], requirement: ['Pendrive & mouse', 'Laptop service', 'Keyboard', 'Refurbished desktop'][(d + k) % 4],
          amount: String(500 + ((d * 977 + k * 311) % 30000)), status: st, priority: 'Normal', followUpDate: '', assignedTo: who, notes: '', createdBy: who, updatedAt: t, updatedBy: who, lastVisit: t, visits: '1' };
        if (st === 'Converted') { c.convertedAt = ago(Math.max(0, d - (k % 3)), 16); c.convertedBy = who; }
        if (d >= 1 && d <= 9 && (d + k) % 2 === 0) { c.happyStatus = (d + k) % 4 === 0 ? 'No answer' : 'Done'; c.happyAt = ago(Math.max(0, d - 1), 12); c.happyBy = 'sona'; c.happyRating = c.happyStatus === 'Done' ? ['Happy', 'Happy', 'Okay', 'Unhappy'][(d + k) % 4] : ''; c.happyTries = '1'; }
        customers.push(c);
        act(c.id, t, who, 'visit', 'First visit recorded — ' + c.requirement);
      }
      if (new Date(ago(d)).getDay() === 0) continue; // shop closed on Sunday
      const nS = 1 + Math.floor(rnd() * 4);
      for (let k = 0; k < nS; k++) {
        const it = items[Math.floor(rnd() * items.length)]; const who = saleStaff[Math.floor(rnd() * saleStaff.length)];
        const t = ago(d, 10 + k * 2); const amount = it[2] + Math.round(rnd() * 8) * 100;
        const credit = rnd() < 0.12;
        const s = { id: id('S'), billNo: 'B' + (5200 + sales.length), date: t.slice(0, 10), createdAt: t, customerId: '', customerName: names[Math.floor(rnd() * names.length)] + ' ' + 'KMPTV'[k % 5],
          phone: '9' + String(Math.floor(1e8 + rnd() * 9e8)), items: it[0], category: it[1], amount: String(amount), paid: String(credit ? Math.round(amount * 0.4) : amount),
          paymentMode: credit ? 'Credit' : ['Cash', 'UPI', 'UPI', 'Card'][k % 4], soldBy: who, notes: '', createdBy: who, updatedAt: t, updatedBy: who };
        sales.push(s);
        act(s.id, t, who, 'sale', `Sale Rs. ${s.amount} — ${s.items}`);
      }
    }
    // service jobs
    const probs = [['Laptop', 'Dell Inspiron 3511', 'No display, fan running'], ['Printer', 'Epson L3150', 'Paper jam, head cleaning'], ['Desktop', 'Assembled i3', 'Windows not booting'],
      ['CCTV', 'Hikvision 4ch', 'Camera 2 no signal (site visit)'], ['Networking', 'Office LAN', 'Wi-Fi drops (site visit)'], ['Laptop', 'HP 15s', 'Keyboard replacement'],
      ['UPS', 'Microtek 1KVA', 'Battery backup low'], ['Laptop', 'MacBook Air M1', 'Liquid spill'], ['Desktop', 'Office PC x4', 'AMC visit (site)'], ['Monitor', 'LG 22"', 'Flickering']];
    const flow = ['Received', 'Diagnosing', 'In progress', 'Waiting for parts', 'Ready', 'Delivered', 'Delivered', 'Delivered'];
    for (let i = 0; i < 34; i++) {
      const p = probs[i % probs.length]; const outdoor = /site/.test(p[2]);
      const eng = outdoor ? 'nikhil' : (i % 5 === 4 ? 'nikhil' : 'safwan');
      const dAgo = Math.floor(i * 1.25) + 1; const t = ago(dAgo, 10 + (i % 6));
      const due = day(-dAgo + (outdoor ? 1 : 3));
      const status = dAgo > 9 ? (i % 9 === 0 ? 'Cancelled' : 'Delivered') : flow[(i * 3) % flow.length];
      const charge = 400 + ((i * 733) % 5200);
      const j = { id: id('J'), jobNo: 'SRV-' + (1001 + i), createdAt: t, customerId: '', customerName: names[(i * 5) % names.length] + ' ' + 'KMPTV'[i % 5], phone: '9' + String(Math.floor(1e8 + rnd() * 9e8)),
        location: outdoor ? ['Feroke', 'Palayam', 'West Hill', 'Nadakkavu'][i % 4] : '', device: p[0], brandModel: p[1], serialNo: '', accessories: outdoor ? '' : 'Charger', problem: p[2],
        jobType: outdoor ? 'Outdoor' : 'Indoor', assignedTo: eng, status, priority: i % 7 === 0 ? 'Urgent' : 'Normal', dueDate: due, estimate: String(charge), charge: JOB_DONE.includes(status) ? String(charge) : '',
        paid: status === 'Delivered' ? String(i % 6 === 0 ? 0 : charge) : '', paymentMode: status === 'Delivered' ? 'UPI' : '', diagnosis: '', completedAt: '', deliveredAt: '', notes: '', createdBy: i % 3 ? 'sona' : 'deepak', updatedAt: t, updatedBy: eng };
      act(j.id, t, j.createdBy, 'job', `Job created — ${j.device}: ${j.problem}`);
      if (JOB_DONE.includes(status)) {
        const late = (eng === 'nikhil' ? i % 3 === 0 : i % 5 === 0) ? 2 : 0;
        const doneAgo = Math.max(0, dAgo - (outdoor ? 1 : 3) - late);
        j.completedAt = ago(doneAgo, 16); j.updatedAt = j.completedAt;
        act(j.id, j.completedAt, eng, 'job', `Status: In progress → ${status === 'Ready' ? 'Ready' : 'Ready'}`, { job: true, due, onTime: j.completedAt.slice(0, 10) <= due });
        if (status === 'Delivered') { j.deliveredAt = ago(Math.max(0, doneAgo - 1), 17); j.updatedAt = j.deliveredAt; act(j.id, j.deliveredAt, eng, 'job', 'Status: Ready → Delivered'); }
      } else if (status !== 'Cancelled') {
        const upd = ago(Math.max(0, dAgo - 1), 15); j.updatedAt = upd;
        act(j.id, upd, eng, 'note', 'Checked, working on it');
      }
      jobs.push(j);
    }
    // sign-ins and follow-up handling for the last 30 days (feeds the performance section)
    const habits = { saneed: [9, 15], shaneer: [10, 30], midhila: [9, 20], deepak: [9, 25], shylesh: [9, 10], sona: [9, 40], nikhil: [10, 5], safwan: [9, 28] };
    for (let d = 30; d >= 0; d--) {
      if (new Date(ago(d)).getDay() === 0) continue;
      users.forEach((u, ui) => {
        if (rnd() < 0.06) return; // day off
        const [hh, mm] = habits[u.username]; const jitter = Math.round((rnd() - 0.4) * 30);
        act('', ago(d, hh, Math.max(0, Math.min(59, mm + jitter))), u.username, 'login', 'Signed in');
        if (['shylesh', 'sona', 'deepak', 'midhila'].includes(u.username) && rnd() < 0.7) {
          const late = u.username === 'sona' ? rnd() < 0.45 : u.username === 'deepak' ? rnd() < 0.25 : rnd() < 0.1;
          act(customers[(d + ui) % customers.length].id, ago(d, 12 + (ui % 5)), u.username, 'followup', 'Follow-up done', { due: day(-d - (late ? 2 : 0)), onTime: !late });
        }
        if (['shylesh', 'sona', 'deepak'].includes(u.username)) {
          const n = { shylesh: 5, sona: 3, deepak: 4 }[u.username];
          for (let k = 0; k < Math.floor(rnd() * n); k++) act(customers[(d * 7 + k) % customers.length].id, ago(d, 11 + k), u.username, ['call', 'note', 'call'][k % 3], 'Called customer');
        }
      });
      users[0].lastLogin = ago(0, 9, 12);
    }
    // supplier bills (creditors)
    const suppliers = [['Calicut Computer Distributors', '04952721100'], ['Kerala IT Supplies', '04842390011'], ['Malabar Tech Traders', '9847200300'],
      ['Prime Peripherals', '9895011223'], ['Sigma Networks & CCTV', '9746055667']];
    const what = ['Laptops x4', 'Printers & cartridges', 'Accessories stock', 'CCTV cameras & DVR', 'SSD / RAM stock', 'Networking cables & routers', 'UPS & batteries'];
    const credits = [];
    for (let i = 0; i < 16; i++) {
      const sp = suppliers[i % suppliers.length]; const dAgo = i * 4 + 1; const amount = 8000 + ((i * 7919) % 140000);
      const paid = i % 4 === 0 ? amount : i % 3 === 0 ? Math.round(amount * 0.5) : dAgo > 40 ? amount : 0;
      const c = { id: id('P'), date: day(-dAgo), supplier: sp[0], phone: sp[1], billNo: 'INV-' + (8800 + i * 7), items: what[i % what.length], amount: String(amount), paid: String(paid),
        dueDate: day(-dAgo + (i % 2 ? 15 : 30)), notes: '', createdAt: ago(dAgo, 12), createdBy: i % 2 ? 'midhila' : 'deepak', updatedAt: ago(dAgo, 12), updatedBy: 'midhila' };
      credits.push(c); act(c.id, c.createdAt, c.createdBy, 'credit', `Supplier bill Rs. ${c.amount} — ${c.supplier}`);
    }
    const advances = [
      ['shylesh', 'Shylesh', 'October 2026', 5000, 'Family function', 'Paid', 32], ['sona', 'Sona', 'November 2026', 3000, 'Medical', 'Approved', 9],
      ['safwan', 'Safwan', 'November 2026', 4000, '', 'Pending', 1], ['deepak', 'Deepak', 'September 2026', 8000, 'House rent', 'Paid', 60],
      ['nikhil', 'Nikhil', 'November 2026', 2500, 'Bike repair', 'Rejected', 12]
    ].map(([u, n, m, amt, why, st, d]) => ({ id: id('V'), createdAt: ago(d, 11), username: u, name: n, month: m, amount: String(amt), reason: why, status: st,
      decidedBy: st === 'Pending' ? '' : 'saneed', decidedAt: st === 'Pending' ? '' : ago(Math.max(0, d - 1), 15), note: '', mailed: ago(d, 11) }));
    const tasks = [
      ['Call Govt. College about tender result', 'saneed', 'shylesh', 'High', day(0), 'In progress', 'Spoke to the clerk, waiting for the office', 2],
      ['Update price list for new ASUS stock', 'deepak', 'sona', 'Normal', day(2), 'Open', '', 1],
      ['Collect pending payment from Ameen K', 'saneed', 'midhila', 'Urgent', day(-1), 'Open', '', 3],
      ['CCTV site survey at Palayam', 'deepak', 'nikhil', 'High', day(1), 'Open', '', 0],
      ['Clean and test returned laptops', 'deepak', 'safwan', 'Low', day(3), 'Done', 'All 4 tested OK', 4],
      ['Prepare weekly stock report', 'saneed', 'deepak', 'Normal', day(0), 'Open', '', 1]
    ].map(([title, by, to, pr, due, st, note, d]) => ({ id: id('T'), createdAt: ago(d, 10), title, details: '', assignedTo: to, assignedBy: by, priority: pr, dueDate: due, status: st,
      lastNote: note, updatedAt: ago(Math.max(0, d - 1), 14), updatedBy: note ? to : by, remindedAt: '', remindCount: '0', doneAt: st === 'Done' ? ago(Math.max(0, d - 1), 14) : '' }));
    tasks.forEach(t => act(t.id, t.createdAt, t.assignedBy, 'task', `Task assigned to ${users.find(u => u.username === t.assignedTo).name} (${t.priority})`));
    return { users, customers, activity, sales, jobs, credits, advances, tasks };
  }

  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.users && d.jobs) return d; } catch (e) {}
    const d = seed(); save(d); return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  function pub(u) {
    const perms = u.role === 'admin' ? { ...ADMIN } : { ...u.perms };
    if (perms.crm === undefined) perms.crm = true;
    if (perms.accounts === undefined) perms.accounts = !!perms.dashboard;
    PERM_KEYS.forEach(k => perms[k] = !!perms[k]);
    if (perms.advances === undefined) perms.advances = /accountant/i.test(u.title || '');
    if (perms.happycalls === undefined) perms.happycalls = /call cent/i.test(u.title || '');
    return { username: u.username, name: u.name, role: u.role, title: u.title || '', email: u.email || '', perms, active: u.active !== false, createdAt: u.createdAt, lastLogin: u.lastLogin, photo: u.photo || '' };
  }
  const has = (me, p) => me.role === 'admin' || !!me.perms[p];
  function need(me, p) { if (!has(me, p)) throw new Error('You do not have permission for this (' + p + ')'); }
  const seesAll = me => me.role === 'admin' || me.perms.viewAll || me.perms.dashboard;
  const canSee = (me, c) => seesAll(me) || c.createdBy === me.username || c.assignedTo === me.username;
  const canSeeSale = (me, s) => seesAll(me) || s.soldBy === me.username || s.createdBy === me.username;
  const canSeeJob = (me, j) => seesAll(me) || j.assignedTo === me.username || j.createdBy === me.username;
  function log(db, refId, user, type, text, meta) { const a = { id: id('A'), customerId: refId, timestamp: now(), user, type, text, meta: meta || '' }; db.activity.push(a); return a; }
  function fuMeta(oldDue, newDue) {
    if (!oldDue || oldDue === newDue) return '';
    const t = now().slice(0, 10);
    if (newDue && newDue > oldDue && oldDue > t) return '';
    return JSON.stringify({ due: oldDue, onTime: t <= oldDue });
  }
  const token = (u, loginAt) => `demo.${u}.${loginAt}.${Date.now() + TOKEN_HOURS * 3600 * 1000}`;
  const clean = (inp, keys) => { const o = {}; Object.keys(inp || {}).forEach(k => { if (inp[k] != null && (!keys || keys.includes(k))) o[k] = String(inp[k]).trim(); }); return o; };

  const SHEET_MAP = { Users: 'users', Customers: 'customers', Sales: 'sales', Service: 'jobs', Creditors: 'credits', Advances: 'advances', Tasks: 'tasks', Activity: 'activity' };
  function pinOk(db, me, pin) {
    if (me.username !== 'saneed') throw new Error('Only Saneed can open Backup & settings');
    if (!db.meta.pin) throw new Error('Set a PIN first');
    if (Date.now() < (db.meta.lockUntil || 0)) throw new Error('Too many wrong PINs. Try again in 15 minutes.');
    if (String(pin || '') !== db.meta.pin) {
      db.meta.fails = (db.meta.fails || 0) + 1;
      if (db.meta.fails >= 5) { db.meta.lockUntil = Date.now() + 15 * 60000; db.meta.fails = 0; save(db); throw new Error('Wrong PIN 5 times. Locked for 15 minutes.'); }
      save(db); throw new Error(`Wrong PIN (${5 - db.meta.fails} tries left)`);
    }
    db.meta.fails = 0;
  }

  function handle(req) {
    const db = load();
    const a = req.action;
    db.meta = db.meta || {};
    if (db.meta.key && req.key !== db.meta.key) throw new Error('KEY: This app is not allowed to connect. Ask Saneed for the backend key.');
    if (a === 'login') {
      const u = db.users.find(x => x.username === String(req.username || '').trim().toLowerCase());
      if (!u || u.active === false || u.pass !== String(req.password || '')) throw new Error('Wrong ID or passcode');
      u.lastLogin = now(); log(db, '', u.username, 'login', 'Signed in'); save(db);
      const loginAt = Date.now();
      return { token: token(u.username, loginAt), loginAt, hours: TOKEN_HOURS, user: pub(u) };
    }
    const [, uname, loginAt, exp] = String(req.token || '').split('.');
    if (!loginAt || Date.now() > Number(exp)) throw new Error('AUTH: Session expired, please sign in again');
    const meRaw = db.users.find(x => x.username === uname && x.active !== false);
    if (!meRaw) throw new Error('AUTH: Please sign in');
    const me = pub(meRaw); me.loginAt = Number(loginAt);
    const findC = cid => db.customers.find(c => c.id === cid);
    const dash = has(me, 'dashboard');

    switch (a) {
      case 'bootstrap':
        me.advApprove = ['saneed', 'shaneer'].includes(me.username); me.advPay = ['midhila'].includes(me.username);
        me.backupAdmin = me.username === 'saneed';
        me.taskTargets = TASK_ASSIGNERS[me.username] ? db.users.filter(u => u.active !== false && u.username !== me.username && !TASK_ASSIGNERS[me.username].includes(u.username)).map(u => u.username) : [];
        return {
          me, token: token(me.username, me.loginAt), serverTime: now(),
          customers: has(me, 'crm') || dash ? db.customers.filter(c => canSee(me, c)) : [],
          sales: has(me, 'sales') || dash ? db.sales.filter(s => canSeeSale(me, s)) : [],
          jobs: has(me, 'service') || dash ? db.jobs.filter(j => canSeeJob(me, j)) : [],
          credits: has(me, 'accounts') || dash ? db.credits : [],
          advances: db.advances.filter(a => has(me, 'advances') || a.username === me.username),
          tasks: db.tasks.filter(t => me.role === 'admin' || t.assignedTo === me.username || t.assignedBy === me.username),
          staff: db.users.filter(u => u.active !== false).map(u => { const p = pub(u); return { username: u.username, name: u.name, role: u.role, title: u.title || '', email: u.email || '', photo: u.photo || '', perms: p.perms, lastLogin: u.lastLogin }; })
        };

      case 'saveCustomer': {
        need(me, 'crm');
        const c0 = clean(req.customer); LOCKED.forEach(k => delete c0[k]);
        if (!c0.name) throw new Error('Customer name is required');
        if (!c0.phone) throw new Error('Phone number is required');
        const ts = now();
        if (c0.id) {
          need(me, 'edit');
          const before = findC(c0.id); if (!before) throw new Error('Customer not found');
          const b = { ...before };
          const changes = [];
          Object.assign(before, c0, { id: b.id, createdAt: b.createdAt, createdBy: b.createdBy, visits: b.visits, lastVisit: b.lastVisit, updatedAt: ts, updatedBy: me.username });
          markConv(b, before, me.username, ts);
          [['status', 'Status'], ['followUpDate', 'Follow-up'], ['assignedTo', 'Assigned'], ['priority', 'Priority']].forEach(([k, l]) => {
            if ((b[k] || '') !== (before[k] || '')) changes.push(`${l}: ${b[k] || '—'} → ${before[k] || '—'}`);
          });
          log(db, before.id, me.username, 'update', changes.join(' · ') || 'Details updated', fuMeta(b.followUpDate, before.followUpDate));
          save(db); return before;
        }
        need(me, 'add');
        const c = Object.assign({ status: 'New', priority: 'Normal', source: 'Walk-in', category: 'Sales', assignedTo: me.username }, c0,
          { id: id('C'), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username, lastVisit: ts, visits: '1' });
        markConv({}, c, me.username, ts);
        db.customers.push(c);
        log(db, c.id, me.username, 'visit', 'First visit recorded' + (c.requirement ? ' — ' + c.requirement : ''));
        if (c.notes) log(db, c.id, me.username, 'note', c.notes);
        save(db); return c;
      }

      case 'deleteCustomer': {
        need(me, 'crm'); need(me, 'delete');
        const i = db.customers.findIndex(c => c.id === req.id); if (i < 0) throw new Error('Customer not found');
        const c = db.customers.splice(i, 1)[0];
        log(db, c.id, me.username, 'delete', `Customer deleted: ${c.name} (${c.phone})`);
        save(db); return { id: req.id };
      }

      case 'addActivity': {
        need(me, 'crm');
        const c = findC(req.customerId); if (!c) throw new Error('Customer not found');
        const ts = now(); const type = req.type || 'note'; const extra = []; const oldDue = c.followUpDate;
        if (type === 'visit') { c.visits = String((+c.visits || 0) + 1); c.lastVisit = ts; }
        if (req.status !== undefined && req.status !== c.status) { extra.push(`Status: ${c.status || '—'} → ${req.status}`); const b = { status: c.status }; c.status = req.status; markConv(b, c, me.username, ts); }
        if (req.followUpDate !== undefined && req.followUpDate !== c.followUpDate) { extra.push('Follow-up: ' + (req.followUpDate || 'cleared')); c.followUpDate = req.followUpDate; }
        c.updatedAt = ts; c.updatedBy = me.username;
        const text = [req.text, extra.join(' · ')].filter(Boolean).join(' — ') || (type === 'visit' ? 'Visited the shop' : 'Updated');
        const act = log(db, c.id, me.username, type, text, fuMeta(oldDue, c.followUpDate));
        save(db); return { customer: c, activity: act };
      }

      case 'getActivity':
        return db.activity.filter(x => x.customerId === req.customerId).sort((x, y) => (x.timestamp < y.timestamp ? 1 : -1));

      case 'recentActivity':
        need(me, 'reports'); return db.activity.slice().sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1)).slice(-250).reverse();

      case 'visitsOn': {
        need(me, 'crm'); const d = String(req.date || '').slice(0, 10);
        return db.activity.filter(x => x.type === 'visit' && x.timestamp.slice(0, 10) === d).map(x => ({ id: x.customerId, timestamp: x.timestamp, user: x.user }));
      }

      case 'perfData': {
        need(me, 'performance');
        const from = String(req.from || '').slice(0, 10), to = String(req.to || '9999').slice(0, 10);
        return db.activity.filter(x => { const d = x.timestamp.slice(0, 10); return d >= from && d <= to; })
          .map(x => ({ id: x.customerId, timestamp: x.timestamp, user: x.user, type: x.type, meta: x.meta }));
      }

      case 'saveSale': {
        need(me, 'sales');
        const s0 = clean(req.sale); const ts = now();
        if (!s0.items) throw new Error('Enter what was sold');
        if (!money(s0.amount)) throw new Error('Enter the bill amount');
        s0.amount = String(money(s0.amount)); s0.paid = s0.paid === undefined || s0.paid === '' ? s0.amount : String(money(s0.paid));
        let sale;
        if (s0.id) {
          sale = db.sales.find(x => x.id === s0.id); if (!sale) throw new Error('Sale not found');
          if (!canSeeSale(me, sale)) throw new Error('Not allowed');
          const keep = { id: sale.id, createdAt: sale.createdAt, createdBy: sale.createdBy };
          Object.assign(sale, s0, keep, { updatedAt: ts, updatedBy: me.username });
          log(db, sale.id, me.username, 'sale', `Sale updated · Rs. ${sale.amount} · paid ${sale.paid}`);
        } else {
          sale = Object.assign({ date: ts.slice(0, 10), paymentMode: 'Cash', soldBy: me.username, category: 'Other' }, s0, { id: id('S'), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username });
          delete sale.markConverted;
          db.sales.push(sale);
          log(db, sale.id, me.username, 'sale', `Sale Rs. ${sale.amount} — ${sale.items}`);
        }
        let customer = null;
        if (sale.customerId && !s0.id && has(me, 'crm')) {
          const c = findC(sale.customerId);
          if (c) {
            const oldDue = c.followUpDate; const extra = [];
            if (req.sale.markConverted && ['New', 'Follow-up', 'Pending'].includes(c.status)) { extra.push(`Status: ${c.status} → Converted`); const b = { status: c.status }; c.status = 'Converted'; c.followUpDate = ''; markConv(b, c, sale.soldBy || me.username, ts); }
            if (c.status === 'Converted' && !c.saleId) c.saleId = sale.id;
            c.updatedAt = ts; c.updatedBy = me.username;
            log(db, c.id, me.username, 'sale', [`Purchased: ${sale.items} (Rs. ${sale.amount})`].concat(extra).join(' — '), fuMeta(oldDue, c.followUpDate));
            customer = c;
          }
        }
        save(db); return { sale, customer };
      }

      case 'deleteSale': {
        need(me, 'sales'); need(me, 'delete');
        const i = db.sales.findIndex(x => x.id === req.id); if (i < 0) throw new Error('Sale not found');
        const s = db.sales.splice(i, 1)[0];
        log(db, s.id, me.username, 'delete', `Sale deleted: ${s.items} (Rs. ${s.amount})`);
        save(db); return { id: req.id };
      }

      case 'saveJob': {
        need(me, 'service');
        const j0 = clean(req.job); const ts = now(); const t = ts.slice(0, 10);
        ['estimate', 'charge', 'paid'].forEach(k => { if (j0[k] !== undefined && j0[k] !== '') j0[k] = String(money(j0[k])); });
        if (j0.id) {
          const j = db.jobs.find(x => x.id === j0.id); if (!j) throw new Error('Job not found');
          if (!canSeeJob(me, j)) throw new Error('Not allowed');
          const b = { ...j };
          Object.assign(j, j0, { id: b.id, jobNo: b.jobNo, createdAt: b.createdAt, createdBy: b.createdBy, updatedAt: ts, updatedBy: me.username });
          let meta = '';
          if (j.status !== b.status) {
            if (JOB_DONE.includes(j.status) && !j.completedAt) { j.completedAt = ts; meta = JSON.stringify({ job: true, due: b.dueDate || '', onTime: !b.dueDate || t <= b.dueDate }); }
            if (j.status === 'Delivered' && !j.deliveredAt) j.deliveredAt = ts;
            if (j.status !== 'Delivered') j.deliveredAt = '';
            if (!JOB_DONE.includes(j.status)) j.completedAt = '';
          }
          const changes = [];
          [['status', 'Status'], ['assignedTo', 'Engineer'], ['dueDate', 'Promised'], ['charge', 'Charge'], ['paid', 'Paid']].forEach(([k, l]) => {
            if ((b[k] || '') !== (j[k] || '')) changes.push(`${l}: ${b[k] || '—'} → ${j[k] || '—'}`);
          });
          log(db, j.id, me.username, 'job', changes.join(' · ') || 'Job details updated', meta);
          save(db); return j;
        }
        if (!j0.customerName) throw new Error('Customer name is required');
        if (!j0.phone) throw new Error('Phone number is required');
        if (!j0.problem) throw new Error('Describe the problem / work');
        const j = Object.assign({ status: 'Received', jobType: 'Indoor', priority: 'Normal', device: 'Laptop' }, j0, {
          id: id('J'), jobNo: 'SRV-' + (1001 + db.jobs.length), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username, completedAt: '', deliveredAt: '' });
        db.jobs.push(j);
        log(db, j.id, me.username, 'job', `Job created — ${j.device}: ${j.problem}`);
        save(db); return j;
      }

      case 'deleteJob': {
        need(me, 'service'); need(me, 'delete');
        const i = db.jobs.findIndex(x => x.id === req.id); if (i < 0) throw new Error('Job not found');
        const j = db.jobs.splice(i, 1)[0];
        log(db, j.id, me.username, 'delete', `Service job deleted: ${j.jobNo} (${j.customerName})`);
        save(db); return { id: req.id };
      }

      case 'jobNote': {
        need(me, 'service');
        const text = String(req.text || '').trim(); if (!text) throw new Error('Write a note first');
        const j = db.jobs.find(x => x.id === req.id); if (!j) throw new Error('Job not found');
        if (!canSeeJob(me, j)) throw new Error('Not allowed');
        j.updatedAt = now(); j.updatedBy = me.username;
        const act = log(db, j.id, me.username, 'note', text);
        save(db); return { job: j, activity: act };
      }

      case 'saveCredit': {
        need(me, 'accounts');
        const c0 = clean(req.credit); const ts = now();
        if (c0.amount !== undefined) c0.amount = String(money(c0.amount));
        if (c0.paid !== undefined) c0.paid = String(money(c0.paid));
        if (c0.id) {
          const c = db.credits.find(x => x.id === c0.id); if (!c) throw new Error('Bill not found');
          const keep = { id: c.id, createdAt: c.createdAt, createdBy: c.createdBy };
          Object.assign(c, c0, keep, { updatedAt: ts, updatedBy: me.username });
          if (!c.supplier) throw new Error('Supplier name is required');
          log(db, c.id, me.username, 'credit', `Supplier bill updated · ${c.supplier} · Rs. ${c.amount} · paid ${c.paid}`);
          save(db); return c;
        }
        if (!c0.supplier) throw new Error('Supplier name is required');
        if (!money(c0.amount)) throw new Error('Enter the bill amount');
        const c = Object.assign({ date: ts.slice(0, 10), paid: '0' }, c0, { id: id('P'), createdAt: ts, createdBy: me.username, updatedAt: ts, updatedBy: me.username });
        db.credits.push(c); log(db, c.id, me.username, 'credit', `Supplier bill Rs. ${c.amount} — ${c.supplier}`);
        save(db); return c;
      }

      case 'deleteCredit': {
        need(me, 'accounts'); need(me, 'delete');
        const i = db.credits.findIndex(x => x.id === req.id); if (i < 0) throw new Error('Bill not found');
        const c = db.credits.splice(i, 1)[0];
        log(db, c.id, me.username, 'delete', `Supplier bill deleted: ${c.supplier} (Rs. ${c.amount})`);
        save(db); return { id: req.id };
      }

      case 'recordPayment': {
        const amount = money(req.amount); if (!amount) throw new Error('Enter the amount');
        const mode = String(req.mode || 'Cash').slice(0, 20);
        const conf = { sale: [db.sales, 'amount', 'sales'], job: [db.jobs, 'charge', 'service'], credit: [db.credits, 'amount', 'accounts'] }[req.kind];
        if (!conf) throw new Error('Unknown payment type');
        if (!has(me, 'accounts') && !has(me, conf[2])) throw new Error('You do not have permission for this (accounts)');
        const o = conf[0].find(x => x.id === req.id); if (!o) throw new Error('Record not found');
        if (req.kind === 'sale' && !canSeeSale(me, o)) throw new Error('Not allowed');
        if (req.kind === 'job' && !canSeeJob(me, o)) throw new Error('Not allowed');
        o.paid = String(money(o.paid) + amount);
        if (req.kind !== 'credit') o.paymentMode = mode;
        o.updatedAt = now(); o.updatedBy = me.username;
        const bal = Math.max(0, money(o[conf[1]]) - money(o.paid));
        log(db, o.id, me.username, 'payment', `${req.kind === 'credit' ? 'Paid' : 'Received'} Rs. ${amount} (${mode})${bal ? ' · balance Rs. ' + bal : ' · fully paid'}`);
        save(db); return o;
      }

      case 'happyCall': {
        need(me, 'happycalls');
        if (!['Happy', 'Okay', 'Unhappy', 'No answer'].includes(req.result)) throw new Error('Choose how the call went');
        const c = findC(req.customerId); if (!c) throw new Error('Customer not found');
        const ts = now();
        c.happyTries = String((+c.happyTries || 0) + 1); c.happyStatus = req.result === 'No answer' ? 'No answer' : 'Done';
        if (req.result !== 'No answer') c.happyRating = req.result;
        c.happyAt = ts; c.happyBy = me.username; if (req.note) c.happyNote = String(req.note).trim();
        const a = log(db, c.id, me.username, 'happy', (req.result === 'No answer' ? `Happy call: no answer (try ${c.happyTries})` : 'Happy call: ' + req.result) + (req.note ? ' — ' + req.note : ''));
        save(db); return { customer: c, activity: a };
      }

      case 'saveTask': {
        const t0 = {}; ['id', 'title', 'details', 'assignedTo', 'priority', 'dueDate'].forEach(k => { if (req.task && req.task[k] != null) t0[k] = String(req.task[k]).trim(); });
        const targets = TASK_ASSIGNERS[me.username] ? db.users.filter(u => u.active !== false && u.username !== me.username && !TASK_ASSIGNERS[me.username].includes(u.username)).map(u => u.username) : [];
        if (t0.assignedTo !== undefined && !targets.includes(t0.assignedTo)) throw new Error('You cannot assign tasks to this person');
        if (t0.priority && !['Low', 'Normal', 'High', 'Urgent'].includes(t0.priority)) throw new Error('Unknown priority');
        const ts = now();
        if (t0.id) {
          const t = db.tasks.find(x => x.id === t0.id); if (!t) throw new Error('Task not found');
          if (t.assignedBy !== me.username) throw new Error('Only the person who assigned this task can change it');
          const b = { ...t }; Object.assign(t, t0, { updatedAt: ts, updatedBy: me.username });
          const ch = []; if (b.priority !== t.priority) ch.push(`Priority: ${b.priority} → ${t.priority}`); if (b.assignedTo !== t.assignedTo) ch.push('Reassigned to ' + ((db.users.find(u => u.username === t.assignedTo) || {}).name || t.assignedTo)); if ((b.dueDate || '') !== (t.dueDate || '')) ch.push('Due: ' + (t.dueDate || 'none'));
          log(db, t.id, me.username, 'task', ch.join(' · ') || 'Task details changed'); save(db); return t;
        }
        if (!TASK_ASSIGNERS[me.username]) throw new Error('You cannot assign tasks');
        if (!t0.title) throw new Error('Write what needs to be done');
        if (!t0.assignedTo) throw new Error('Choose who should do it');
        const t = Object.assign({ priority: 'Normal', details: '', dueDate: '' }, t0, { id: id('T'), createdAt: ts, assignedBy: me.username, status: 'Open', lastNote: '', updatedAt: ts, updatedBy: me.username, remindedAt: '', remindCount: '0', doneAt: '' });
        db.tasks.push(t); log(db, t.id, me.username, 'task', `Task assigned to ${(db.users.find(u => u.username === t.assignedTo) || {}).name || t.assignedTo} (${t.priority})`); save(db); return t;
      }

      case 'taskUpdate': {
        const t = db.tasks.find(x => x.id === req.id); if (!t) throw new Error('Task not found');
        if (t.assignedTo !== me.username && t.assignedBy !== me.username) throw new Error('This is not your task');
        const note = String(req.note || '').trim();
        if (req.status && !['Open', 'In progress', 'Done'].includes(req.status)) throw new Error('Unknown status');
        if (!note && (!req.status || req.status === t.status)) throw new Error('Write an update or change the status');
        const ts = now(); const was = t.status;
        if (req.status) t.status = req.status;
        t.doneAt = t.status === 'Done' ? (t.doneAt || ts) : '';
        if (note) t.lastNote = note;
        t.updatedAt = ts; t.updatedBy = me.username;
        const a = log(db, t.id, me.username, 'task', [was !== t.status ? `Status: ${was} → ${t.status}` : '', note].filter(Boolean).join(' — '));
        save(db); return { task: t, activity: a };
      }

      case 'remindTask': {
        const t = db.tasks.find(x => x.id === req.id); if (!t) throw new Error('Task not found');
        if (t.assignedBy !== me.username) throw new Error('Only the person who assigned this task can send a reminder');
        if (t.status === 'Done') throw new Error('This task is already done');
        t.remindedAt = now(); t.remindCount = String((+t.remindCount || 0) + 1);
        log(db, t.id, me.username, 'task', `Reminder sent (${t.remindCount})`); save(db); return t;
      }

      case 'deleteTask': {
        const i = db.tasks.findIndex(x => x.id === req.id); if (i < 0) throw new Error('Task not found');
        if (db.tasks[i].assignedBy !== me.username) throw new Error('Only the person who assigned this task can delete it');
        const t = db.tasks.splice(i, 1)[0]; log(db, t.id, me.username, 'delete', 'Task deleted: ' + t.title); save(db); return { id: req.id };
      }

      case 'requestAdvance': {
        if (/chairman/i.test(me.title || '')) throw new Error('Not needed for the chairman');
        const amount = money(req.amount); const month = String(req.month || '').trim();
        if (!month) throw new Error('Choose the month');
        if (!amount) throw new Error('Enter the amount');
        const a = { id: id('V'), createdAt: now(), username: me.username, name: me.name, month, amount: String(amount), reason: String(req.reason || '').trim(), status: 'Pending', decidedBy: '', decidedAt: '', note: '', mailed: '' };
        const emailOf = list => list.map(u => (db.users.find(x => x.username === u) || {}).email).filter(Boolean);
        const subject = `Salary advance request – ${me.name} – ${month}`;
        const body = `Dear Saneed and Midhila,\n\nI would like to request a salary advance of Rs. ${amount.toLocaleString('en-IN')} for ${month}.\n${a.reason ? 'Reason: ' + a.reason + '\n' : ''}\nKindly approve.\n\nThank you,\n${me.name}\n${me.title || ''}\n\n(Sent from Best India Shop Manager)`;
        db.advances.push(a); log(db, a.id, me.username, 'advance', `Salary advance requested: Rs. ${amount} for ${month}`);
        save(db);
        return { advance: a, mailed: false, mailError: 'demo mode', mail: { to: emailOf(['saneed', 'midhila']), cc: emailOf(['shaneer']), subject, body } };
      }

      case 'decideAdvance': {
        if (req.status === 'Paid' && !['midhila'].includes(me.username)) throw new Error('Only Midhila can mark an advance as paid');
        if (req.status !== 'Paid' && !['saneed', 'shaneer'].includes(me.username)) throw new Error('Only Saneed or Shaneer can approve or reject advances');
        const a = db.advances.find(x => x.id === req.id); if (!a) throw new Error('Request not found');
        if (!['Pending', 'Approved', 'Rejected', 'Paid'].includes(req.status)) throw new Error('Unknown status');
        Object.assign(a, { status: req.status, decidedBy: me.username, decidedAt: now(), note: String(req.note || a.note || '') });
        log(db, a.id, me.username, 'advance', `Salary advance ${req.status.toLowerCase()}: ${a.name} · Rs. ${a.amount}`);
        save(db); return a;
      }

      case 'pinStatus': return { allowed: me.username === 'saneed', isSet: me.username === 'saneed' && !!db.meta.pin };
      case 'setPin': {
        if (me.username !== 'saneed') throw new Error('Only Saneed can set this PIN');
        if (db.meta.pin) pinOk(db, me, req.oldPin);
        if (!/^\d{4,6}$/.test(String(req.pin || ''))) throw new Error('PIN must be 4 to 6 digits');
        db.meta.pin = String(req.pin); save(db); return { ok: true };
      }
      case 'pinCheck': pinOk(db, me, req.pin); save(db); return { ok: true };
      case 'backup': {
        pinOk(db, me, req.pin);
        const sheets = {};
        Object.entries(SHEET_MAP).forEach(([name, key]) => {
          const list = db[key] || []; const cols = [...new Set(list.flatMap(o => Object.keys(o)))];
          sheets[name] = { cols, rows: list.map(o => cols.map(c => o[c] == null ? '' : typeof o[c] === 'object' ? JSON.stringify(o[c]) : String(o[c]))) };
        });
        db.meta.lastBackup = now() + ' by ' + me.name; save(db);
        return { app: 'Best India CRM', version: 7, createdAt: now(), by: me.name, sheets };
      }
      case 'restore': {
        pinOk(db, me, req.pin);
        const d = req.data;
        if (!d || d.app !== 'Best India CRM' || !d.sheets) throw new Error('This is not a Best India backup file');
        if (!d.sheets.Users || !(d.sheets.Users.rows || []).length) throw new Error('This backup has no staff list. Nothing was changed.');
        db.meta.beforeRestore = JSON.parse(JSON.stringify(Object.fromEntries(Object.values(SHEET_MAP).map(k => [k, db[k]]))));
        const counts = {};
        Object.entries(SHEET_MAP).forEach(([name, key]) => {
          const part = d.sheets[name]; if (!part) return;
          db[key] = part.rows.filter(r => r && r[0]).map(r => { const o = {}; part.cols.forEach((c, i) => { let v = r[i]; if (c === 'perms') { try { v = JSON.parse(v); } catch (e) {} } if (c === 'active') v = v !== 'false' && v !== false; o[c] = v; }); return o; });
          counts[name] = db[key].length;
        });
        save(db); return { counts, keptAs: 'a copy kept in this browser' };
      }
      case 'adminInfo': pinOk(db, me, req.pin); save(db); return { sheetUrl: '', scriptUrl: '', keyOn: !!db.meta.key, key: db.meta.key || '', lastBackup: db.meta.lastBackup || '' };
      case 'setBackendKey': {
        pinOk(db, me, req.pin);
        const k = String(req.key || '').trim(); if (k && k.length < 16) throw new Error('Use at least 16 characters for the key');
        db.meta.key = k; save(db); return { keyOn: !!k };
      }

      case 'setEmail': {
        const un = String(req.username || me.username).toLowerCase();
        if (un !== me.username) need(me, 'manageStaff');
        const e = String(req.email || '').trim().toLowerCase();
        if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('That email address does not look right');
        const u = db.users.find(x => x.username === un); if (!u) throw new Error('Staff not found');
        u.email = e; save(db); return { username: un, email: e };
      }

      case 'listUsers':
        need(me, 'manageStaff'); return db.users.map(pub);

      case 'saveUser': {
        need(me, 'manageStaff');
        const u = req.user || {};
        const username = String(u.username || '').trim().toLowerCase().replace(/\s+/g, '');
        if (!/^[a-z0-9._-]{2,30}$/.test(username)) throw new Error('Login ID must be 2–30 letters/numbers, no spaces');
        const role = u.role === 'admin' ? 'admin' : 'staff';
        if (role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can make someone admin');
        const perms = {}; PERM_KEYS.forEach(k => perms[k] = !!(u.perms && u.perms[k]));
        const title = String(u.title || '').trim().slice(0, 40);
        const ex = db.users.find(x => x.username === username);
        if (ex) {
          if (ex.role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can change an admin');
          if (username === me.username && role !== 'admin' && db.users.filter(x => x.role === 'admin').length <= 1) throw new Error('You are the only admin — make someone else admin first');
          Object.assign(ex, { name: u.name || ex.name, role, perms, title, email: String(u.email || '').trim().toLowerCase(), active: u.active !== false });
          if (u.password) ex.pass = String(u.password);
          save(db); return pub(ex);
        }
        if (!u.password) throw new Error('Set a passcode for the new staff member');
        const nu = { username, name: u.name || username, pass: String(u.password), role, title, email: String(u.email || '').trim().toLowerCase(), perms: role === 'admin' ? { ...ADMIN } : perms, active: true, createdAt: now(), lastLogin: '' };
        db.users.push(nu); save(db); return pub(nu);
      }

      case 'deleteUser': {
        need(me, 'manageStaff');
        if (req.username === me.username) throw new Error('You cannot delete yourself');
        const i = db.users.findIndex(x => x.username === req.username); if (i < 0) throw new Error('Staff not found');
        if (db.users[i].role === 'admin' && me.role !== 'admin') throw new Error('Only an admin can delete an admin');
        db.users.splice(i, 1); save(db); return { username: req.username };
      }

      case 'resetPassword': {
        need(me, 'manageStaff');
        if (!req.password || String(req.password).length < 4) throw new Error('Passcode must be at least 4 characters');
        const u = db.users.find(x => x.username === req.username); if (!u) throw new Error('Staff not found');
        u.pass = String(req.password); save(db); return { username: u.username };
      }

      case 'changePassword': {
        if (meRaw.pass !== String(req.oldPassword || '')) throw new Error('Current passcode is wrong');
        if (!req.newPassword || String(req.newPassword).length < 4) throw new Error('New passcode must be at least 4 characters');
        meRaw.pass = String(req.newPassword); save(db); return { ok: true };
      }
      case 'setPhoto': {
        const un = String(req.username || me.username).toLowerCase();
        if (un !== me.username) need(me, 'manageStaff');
        const p = String(req.photo || '');
        if (p && !/^data:image\/(jpeg|png|webp);base64,/.test(p)) throw new Error('Invalid image');
        if (p.length > 45000) throw new Error('Photo is too large');
        const u = db.users.find(x => x.username === un); if (!u) throw new Error('Staff not found');
        u.photo = p; save(db); return { username: un, photo: p };
      }
      default: throw new Error('Unknown action: ' + a);
    }
  }

  window.MockServer = {
    call(req) {
      return new Promise((res, rej) => setTimeout(() => {
        try { res(JSON.parse(JSON.stringify(handle(req)))); } catch (e) { rej(e); }
      }, 180));
    },
    reset() { localStorage.removeItem(KEY); }
  };
})();
