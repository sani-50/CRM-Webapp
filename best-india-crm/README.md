# Best India Shop Manager (CRM · Sales · Service) — Setup Guide

A CRM web app for Best India Computer Shoppe that works on laptops and phones.
- **Frontend** (`frontend/`): deployed on Vercel
- **Backend** (`apps-script/Code.gs`): Google Apps Script that saves everything to a Google Sheet

---

## 1. Try it first (no setup needed)
Open `frontend/index.html` in a browser, or deploy it to Vercel as it is.
If `API_URL` in `config.js` is empty, the app runs in **Demo mode** with sample data that stays only in that browser.

Logins and what each person can use:
| ID | Starting passcode | Title | Access |
|---|---|---|---|
| saneed | 8321 | Operations Manager | Everything (admin) |
| shaneer | 1234 | Chairman | Everything (admin), shown in the **simple view** (see below) |
| midhila | 1234 | Senior Accountant | Everything (incl. Debtors & Creditors) except adding or editing staff |
| deepak | 1234 | Store Manager | Everything (incl. Debtors & Creditors) except adding or editing staff |
| shylesh | 1234 | Sales | Customers (CRM), Sales, Service. No reports, dashboard or performance |
| sona | 1234 | Call Centre | Customers (CRM), Sales, Service, **Happy calls**. No reports, dashboard or performance |
| nikhil | 1234 | Outdoor Engineer | Only their own service jobs and their own service revenue |
| safwan | 1234 | Indoor Engineer | Only their own service jobs and their own service revenue |

Admins can change any of this later in **Admin → Staff**. Type a job title from the list and its usual access is filled in, then each switch can still be changed.

**Sign-in lasts 2 hours.** While the app stays open and in use, nobody is thrown out mid-work. If someone closes the app and opens it again more than 2 hours after signing in, they must enter their ID and passcode again. The profile menu shows when the current sign-in started and when it runs out.

---

## 2. Create the Google Sheet + backend (about 5 minutes)
1. Go to **sheets.google.com** and create a blank sheet named **Best India CRM**.
2. Open **Extensions → Apps Script**.
3. Delete everything in `Code.gs`, then paste in the full contents of `apps-script/Code.gs`.
4. (Recommended) Click ⚙️ **Project Settings**, tick **Show "appsscript.json"**, and replace that file with `apps-script/appsscript.json`. This sets the time zone to India.
5. At the top, choose the function **`setup`** and click **Run**. Approve the permissions (Advanced → Go to project → Allow).
   This creates the tabs **Users, Customers, Sales, Service, Activity** and adds all 8 staff logins.
6. Click **Deploy → New deployment → ⚙️ Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then copy the **Web app URL** (it ends in `/exec`).

> If you change `Code.gs` later, use **Deploy → Manage deployments → ✏️ Edit → Version: New version** so the URL stays the same.

## 3. Connect the frontend
Open `frontend/config.js` and paste the URL:
```js
API_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
```

## 4. Logo
The Best IND logo is already included (`logo.png`, plus the app icons). To change it, replace `frontend/logo.png` and `frontend/logo-sm.png`. The small one is used in the reports.

## 5. Deploy to Vercel
**Option A, drag & drop:** go to vercel.com → Add New → Project, then upload the `frontend` folder.
**Option B, GitHub:** push the `frontend` folder to a repo and import it in Vercel. Framework preset: **Other**. No build command is needed.

On phones, open the site and tap **Share → Add to Home Screen**. It then opens like an app.

---

## Your data is safe when the app is updated
All the shop's data lives in the **Google Sheet**: customers, sales, jobs, staff, history. The app files on Vercel and the script in Apps Script are only the program that reads and writes that sheet. Updating them **never deletes or changes your data**:
- New features that need new information (for example, monthly **targets** for staff) are added as **new tabs or new columns** at the right-hand side of the sheet. `setup` adds them and leaves every existing row as it is. Old rows simply have that new column empty until someone fills it in.
- Columns are never removed or reordered by an update, so older rows keep lining up.
- Staff logins, passcodes and sessions carry on. At most, people are asked to sign in again once.

**Safe update checklist** (5 minutes, best done after shop hours):
1. **Take a backup:** Admin → Data → *Backup & settings* → *Download backup*. Google Sheets also keeps its own history (*File → Version history*).
2. Try the new version in demo mode first if you like: open `index.html` with an empty `API_URL`.
3. Paste the new `Code.gs` into Apps Script and run **`setup`** once (it adds any new tabs/columns).
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** The link stays the same, so `config.js` doesn't change.
5. Upload the new `frontend` folder to Vercel. Phones pick it up the next time the app is opened.
6. If anything looks wrong, restore the backup from step 1, or use Google Sheets' version history.

## Backup & settings (Saneed only, locked with a PIN)
Admin → **Data** → **Backup & settings 🔒**. Only Saneed can open it (`BACKUP_ADMINS` in `Code.gs`).
- **PIN:** set the first time it's opened (4–6 digits). 5 wrong tries lock it for 15 minutes. If the PIN is forgotten, run **`resetAdminPin`** in the Apps Script editor and set a new one.
- **Download backup:** one `.json` file with every tab, from the first entry up to now: customers, sales, service, suppliers, advances, tasks, staff logins and the full history. Keep it on Google Drive or a pen drive. One a week is a good habit, and always one before an update.
- **Restore:** choose a backup file. It shows the date and how many rows each tab has. Type `RESTORE` to confirm.
  - Before anything is replaced, today's data is copied to hidden tabs in the same Google Sheet named *"Before restore …"*, so a restore can be undone.
  - Columns are matched by name, so an older backup also restores into a newer version of the app.
- **Connection:**
  - a link to open the Google Sheet, and the Apps Script link in use
  - an option to point **this device only** at a different Apps Script link, for testing a new deployment, plus a *Test connection* button
- **Backend key (optional):** an extra lock so that only your copy of the app can talk to the sheet, even if someone finds the Apps Script link.
  - To turn it on: first put the key in `config.js` as `API_KEY` and upload to Vercel. Then press *Turn on* in the panel. If you turn it on before uploading, staff phones stop working until you do.
  - If it ever locks everyone out, run **`turnOffBackendKey`** in the Apps Script editor.

## Updating from an earlier version
If the app is already set up:
1. Paste the new `Code.gs` over the old one.
2. Run **`setup`** once more. This:
   - adds the **Sales**, **Service**, **Creditors**, **Advances** and **Tasks** tabs, plus new columns (staff email; conversion date and happy-call result on Customers)
   - Google asks once to allow the script to **send email** (for salary advance requests). Click Allow. and new columns, without touching existing data
   - adds **Shaneer** (passcode 1234)
   - applies the job titles and access levels in the table above to the 8 listed staff (once only; later changes made in Admin are kept)
3. Go to **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. The URL stays the same.
4. Upload the new `frontend` folder to Vercel.
5. Everyone will be asked to sign in again once, because of the new 2-hour sessions. **Shaneer should change the 1234 passcode straight away** (profile menu → Change passcode).

---

## How it works
- **Visit date & time are recorded automatically** when a customer is saved. "Log visit" adds a repeat visit and increases the visit count.
- **Follow-ups:** when the status is *Follow-up* or *Pending*, the app asks for a date. On that date, a **reminder pops up** when staff open the app. Overdue follow-ups stay in the reminder until they're handled. Staff can **Call**, **Snooze** (move to tomorrow), or tick **✓ Done**.
- **🔔 Notification bell:** shows overdue follow-ups, today's follow-ups, tomorrow's, and customers that someone else assigned to or updated for you.
- **Duplicate check:** typing a phone number that's already saved shows the existing customer, so staff can log a repeat visit instead.
- **Admin (Saneed):** add, edit, disable or delete staff, reset passcodes, make someone admin, and switch on or off each permission per person:
  Add · Edit · See all customers · Delete · Export · Reports & activity · Manage staff.
- **Insights** (for anyone with Reports permission): visitors over the last 14 days, the pipeline, a team leaderboard, and lead sources.
- Everyone can change their own passcode from the profile menu.
- **Profile photos:** tap your avatar → *Add profile photo* (you can use the phone camera). Admins can also set or remove photos for any staff member from **Admin → Staff**. Photos are resized to about 8 KB and saved in the Users tab.
- **Sync button (top bar):**
  🟢 **Synced 3:29 PM**: connected, and data is saving to Google Sheets
  🟠 **Syncing…**: a save or refresh is in progress
  🔴 **Sync failed / Offline / Not connected**: the app can't reach the sheet (no internet, wrong URL, or demo mode). Tap it to retry.
  The login screen shows the same green or red status before anyone signs in.
- **Reports:** there is no separate Reports page. Every section (Sales, Service, Staff performance, Customers, Debtors, Creditors) has a **Report** button at the top. Pick This week, Last week, This month, Last month, This FY or **Custom dates**, then download as:
  - **PDF**: a branded A4 report with the logo, key figures and tables
  - **Excel (.xlsx)**: a Summary sheet plus one sheet per table
  - **CSV**
  The button only appears for staff with the *Reports* or *Export* permission, so Sales, Call Centre and engineers don't see it.

### Simple view (Chairman)
Shaneer's app opens on a **Home** screen with six big tiles, each showing one number:

| Tile | Shows |
|---|---|
| Sales | This month's sales, and today's |
| Service | This month's service revenue, open jobs, late jobs |
| Staff performance | How many staff are 🟢 on track, 🟠 need attention, 🔴 poor |
| Customers | New customers this month, follow-ups due |
| Debtors | Total money customers owe |
| Creditors | Total money the shop owes suppliers, and how many bills are overdue |

The menu shows only these sections. Anyone can switch between **simple view** and **full view** from the profile menu.

### Customers: returning customers and date view
- **Returning customers:** in *New customer*, *New sale* or *New service job*, type 2–3 letters of the name, or 3+ digits of the phone. Matching past customers pop up with phone, area and visit count. Pick one and all their details fill in.
  - In *New customer*, the button changes to **Log repeat visit**, so the visit goes into their history instead of creating a duplicate.
  - Matching works on the start of any word ("arj men" finds Arjun Menon), any part of the name, or letters in order ("amn" finds Ameen).
- **Customers on a date:** in Customers, choose **On a date…** in the first drop-down, then pick a date or use the ‹ › arrows. It shows how many customers came that day (new and repeat) and lists them.

### Debtors (money customers owe)
- Built automatically from unpaid sales bills and unpaid delivered service jobs. Nothing extra to enter.
- Colour by how old the bill is: 🟢 up to 15 days · 🟡 16–25 days · 🟠 26–30 days · 🔴 over 30 days.
- Grouped by customer, biggest first, with how many days old the oldest bill is (orange after 30 days, red after 60).
- Tap a customer to **Call**, send a WhatsApp **Remind**, or **Receive** a payment (amount + Cash/UPI/Card/Bank transfer). The balance updates everywhere.

### Creditors (money the shop owes suppliers)
- Add a **Supplier bill**: supplier, bill no., what was bought, amount, already paid, and due date (quick 7/15/30/45 days).
- Colour by the pay-by date: 🟢 not due yet · 🟡 due within 5 days · 🔴 overdue.
- Tabs: To pay · Overdue · Paid · All. Tap a bill to edit it or **Pay** part or all of it.
- Saved in a new **Creditors** tab in the Google Sheet.
- Visible to anyone with the *Debtors & creditors* permission (admins, Accountant, Store Manager).

### Sales
- **New sale:** phone, customer, items, category, amount, amount received and payment mode (Cash, UPI, Card, Bank transfer or Credit).
- If the phone number belongs to a CRM customer, the sale is linked to them and they can be marked **Converted** in the same step.
- Anything not fully paid shows under **Pending dues**, and on the dashboard under "To collect".
- Staff with "See everyone's records" see all sales. Others see only their own.

### Service
- **Service jobs** get automatic job numbers (SRV-1001…). A job is **Indoor** (in the shop: accessories, serial number) or **Outdoor** (site visit: address and map link).
- Status flow: Received → Diagnosing → Waiting for parts → In progress → **Ready** → **Delivered** (or Cancelled).
- A promised date sets the reminder: engineers get a notification on the day and when it is overdue.
- A job can't be marked Delivered without a final charge (or a confirmation that it's free). The charge counts as **that engineer's revenue** on the day it is delivered.
- Engineers see **My jobs**: their own jobs, their revenue for this month, last month and the financial year, and a 6-month chart.
- Every status change and note goes into the job's history, along with who made it.

### Tasks
- **Who can assign:**
  - **Saneed:** to everyone except Shaneer
  - **Deepak:** to everyone except Saneed and Shaneer
  - **Shaneer:** to anyone
  The rules are in `Code.gs` (`TASK_ASSIGNERS`).
- **Assign task:** who, what, details, priority (Low · Normal · High · Urgent), and a finish-by date.
- **Everyone has a Tasks page.** The badge shows how many are open, and each new task appears on the 🔔 bell.
- **To update a task:** open it, set *Open / In progress / Done*, and write what was done. The person who assigned it gets the update on their bell.
- **The person who assigned the task can:**
  - change its priority
  - edit or delete it
  - **Resend reminder**, which makes it pop up as unread on the other person's bell again
- Every change is kept in the task's history.

### Happy calls (Sona)
- Every **new customer** gets a feedback call within **7 days** of their first visit. Left out: **AMC** customers, *Existing customer* entries, and regular/daily customers (3+ visits).
- The *Happy calls* page shows **To call** (sorted by deadline, e.g. "Last day today"), **Missed** and **Done**.
- Tap **Record**, choose 😊 Happy / 😐 Okay / 😞 Unhappy / 📵 No answer, and note what they said. "No answer" keeps the customer on the list to try again.
- **Unhappy** feedback appears on the bell of the managers (anyone with the dashboard). The result also shows on the customer's profile.

### Enquiry → sale (conversion)
- When a customer becomes **Converted**, the app saves the **conversion date**, **who converted them**, and the **bill that converted them**:
  - through *Mark as Converted* when recording a sale for their phone number
  - or by changing their status
- The customer's profile shows "Converted 24 Nov · 2 days after first visit · by Sona · bill B6001 ₹84,500", plus a **Purchases** list of every bill linked to them.
- Reports and the dashboard count conversions by this real date, and use the **actual bill value**. The Customers report adds *Average days to convert* and a *Converted to sale* table.

### Sorting
- **Debtors:** amount highest/lowest, oldest/newest bill, or name.
- **Creditors:** soonest due date, amount highest/lowest, newest/oldest bill, or supplier name.

### Salary advance
- **Everyone except Shaneer** has a *Salary advance* page. Tap **Request advance**, choose the month, enter the amount and an optional reason, and send.
- An email is sent **automatically from the app** to Saneed and Midhila, with Shaneer in CC. The message is pre-written: amount, month, reason, name and role.
  - The email goes out from the Google account that owns the Apps Script. Replies go to the staff member's own email. (An app can't send from each person's own Gmail without them signing in to Google.)
  - If it can't be sent (an email is missing, or in demo mode), the app shows the message ready to go, with **Open in Gmail** and **Mail app** buttons.
- **Saneed, Midhila and Shaneer** see every request. Only **Saneed and Shaneer** can **Approve / Reject**, and only **Midhila** can **Mark paid** once the money is given (set in `Code.gs`: `ADVANCE_APPROVERS`, `ADVANCE_PAYERS`). They also see totals per person for the year, and a report download. Pending requests show in the 🔔 bell, and staff get a notification when theirs is decided.
- **Emails:** each person adds their own under profile menu → *Add my email*, or an admin sets it in **Admin → Staff**. Saneed, Midhila and Shaneer must have theirs set for the automatic email to work.

### Service staff list
Service jobs can be given to **Nikhil and Safwan** (engineers), plus **Shylesh, Sona and Deepak** to help when there's a lot of work. To change the list, edit `SERVICE_STAFF` in `config.js`.

### Dashboard (Chairman, Operations Manager, Accountant, Store Manager)
- Total revenue, split into sales and service, compared with the previous period.
- Amount still to collect, new customers, conversion rate, open and overdue service jobs, overdue follow-ups.
- Charts:
  - 14-day revenue trend
  - revenue by staff
  - service jobs by status
  - sales by category
- Lists: **Needs attention** and **Biggest dues**.
- A **team performance** list, with each person's colour score.

### Staff performance (evaluation)
Each employee gets a score out of 100 for the chosen period (last 7 days, this month, last 30 days or last month):

| Rating | Score |
|---|---|
| 🟢 On track | 75 and above |
| 🟠 Needs attention | 50–74 |
| 🔴 Poor | below 50 |
| ⚪ No data | not enough activity to rate |

The score is made up of:
| Part | Weight | What it measures |
|---|---|---|
| **Punctuality** | 35% | Follow-ups and service jobs handled on or before their due date (anything overdue right now counts as late), plus first sign-in of the day before the shop opening time. Set the opening time and grace minutes in `config.js` (`openTime`, `lateGraceMin`). |
| **Work rate** | 25% | Updates logged per working day (calls, notes, visits, sales, job updates), compared with the most active person. |
| **Results** | 25% | Sales value, service revenue and enquiries converted, compared with the team's best. |
| **Up to date** | 15% | Share of their open customers and jobs updated in the last 3 days. |

Sort by any column. Tap a person to see:
- the exact numbers behind each score
- their first sign-in time each day
- what's overdue right now
- what to look at

Nobody sees their own row.

## Security notes
- Passcodes are stored **hashed** in the Users tab, not as plain text.
- Logins use a signed token valid for 2 hours. It is renewed only while the app is open and in use.
- Access is checked on the server as well. For example, an engineer's app never receives customers, sales or other engineers' jobs.
- **Ask every staff member to change the default 1234 passcode** after their first login.
- Don't share the Google Sheet itself with staff. They only need the website.
