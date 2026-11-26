/*
 * BEST INDIA CRM — CONFIG
 * Paste your Google Apps Script Web App URL below (ends with /exec).
 * Leave it empty to run in DEMO mode (data saved only in this browser).
 */
window.CRM_CONFIG = {
  API_URL: '',
  // Optional backend key. Only needed after Saneed turns it on in Admin → Data → Backup & settings.
  API_KEY: '',

  // Who can be given service jobs (login IDs): the engineers first, then helpers for busy days.
  SERVICE_STAFF: ['nikhil', 'safwan', 'shylesh', 'sona', 'deepak'],

  SHOP: {
    name: 'Best India Computer Shoppe',
    short: 'Best India',
    tagline: 'Customer Relationship Manager',
    address: 'Fairmount Tower, Mavoor Road, Calicut',
    gst: '32AALFB5384K1Z7',
    // Staff performance: first sign-in after this time (plus the grace minutes) counts as late.
    openTime: '09:30',
    lateGraceMin: 15
  }
};
