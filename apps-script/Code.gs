/** JAPA DIARY backend. Paste into Extensions > Apps Script of the spreadsheet (container-bound). */
const SHEET = 'JapaEntries';

/** Run ONCE manually from the editor: creates the worksheet, headers, formats, hides column F. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  ['A:A', 'B:B', 'C:C', 'E:E', 'F:F'].forEach(function (a) { sh.getRange(a).setNumberFormat('@'); }); // plain text: no date/formula auto-conversion
  sh.getRange('D:D').setNumberFormat('#,##0');
  sh.getRange(1, 1, 1, 6).setValues([['Date', 'Time', 'Naam Jaap', 'Number of Naam Jaap', 'Remark', 'Unique ID']]).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.hideColumns(6);
}

function doGet() { return out({ ok: false, error: 'Not found' }); }
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!secret || req.secret !== secret) return out({ ok: false, error: 'Unauthorized' });
    if (req.op === 'add') return out(addEntry(req.entry));
    if (req.op === 'dashboard') return out(dashboard(req.ids || []));
    return out({ ok: false, error: 'Unknown operation' });
  } catch (err) { return out({ ok: false, error: 'Bad request' }); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sheet() { const s = SpreadsheetApp.getActive().getSheetByName(SHEET); if (!s) throw new Error('Run setup() first'); return s; }

function addEntry(e) {
  if (!e || !/^[A-Za-z0-9-]{8,64}$/.test(e.id || '') || !/^\d{2}-\d{2}-\d{4}$/.test(e.date || '') || !/^\d{2}:\d{2} (AM|PM)$/.test(e.time || '') ||
      typeof e.naam !== 'string' || !e.naam.trim() || e.naam.length > 100 || typeof e.remark !== 'string' || e.remark.length > 1000 ||
      typeof e.total !== 'number' || e.total % 1 !== 0 || e.total < 1 || e.total > 1e9) return { ok: false, error: 'Invalid entry' };
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const sh = sheet(), last = sh.getLastRow();
    if (last > 1) {
      const ids = sh.getRange(2, 6, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (ids[i][0] === e.id) return { ok: true, duplicate: true };
    }
    sh.getRange(last + 1, 1, 1, 6).setValues([[e.date, e.time, e.naam, e.total, e.remark, e.id]]); // always appends; never overwrites
    SpreadsheetApp.flush();
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function iso(d, t) { // 'DD-MM-YYYY','hh:mm AM' -> 'YYYY-MM-DDTHH:MM:00+05:30'
  var p = d.split('-'), m = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(t) || [0, '00', '00', 'AM'], h = Number(m[1]) % 12 + (m[3] === 'PM' ? 12 : 0);
  return p[2] + '-' + p[1] + '-' + p[0] + 'T' + ('0' + h).slice(-2) + ':' + m[2] + ':00+05:30';
}
function dashboard(ids) {
  const sh = sheet(), last = sh.getLastRow(), perDay = {}, names = {}, known = {};
  if (last > 1) sh.getRange(2, 1, last - 1, 6).getValues().forEach(function (r) {
    var d = r[0] instanceof Date ? Utilities.formatDate(r[0], 'Asia/Kolkata', 'dd-MM-yyyy') : String(r[0]);
    var t = r[1] instanceof Date ? Utilities.formatDate(r[1], 'Asia/Kolkata', 'hh:mm a').toUpperCase() : String(r[1]);
    var n = Number(r[3]); if (!/^\d{2}-\d{2}-\d{4}$/.test(d) || !(n > 0)) return;
    var key = d.slice(6) + '-' + d.slice(3, 5) + '-' + d.slice(0, 2), when = iso(d, t), nk = String(r[2]).trim().toLowerCase();
    perDay[key] = (perDay[key] || 0) + n;
    if (!names[nk]) names[nk] = { naam: String(r[2]).trim(), total: 0, last: when };
    names[nk].total += n; if (when > names[nk].last) names[nk].last = when;
    known[String(r[5])] = true;
  });
  return { ok: true, perDay: perDay, perNaam: Object.keys(names).map(function (k) { return names[k]; }), found: ids.filter(function (i) { return known[i]; }) };
}
