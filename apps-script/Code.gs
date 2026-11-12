/**
 * Ember&Bean — order receiver.
 * Paste this into Extensions → Apps Script of your orders Google Sheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 */

// Prices are checked here so a changed price in the browser cannot lower the total.
// Keep these in sync with shop.js.
const PRICES = {
  'sweet-flame-lava': { name: 'Sweet Flame Lava', price: 77800 },
  'dark-surge-chocolate': { name: 'Dark Surge Chocolate', price: 85800 },
  'black-gold-flame': { name: 'Black Gold Flame', price: 71800 }
};

const SHEET_NAME = 'Захиалга';
const HEADERS = ['Огноо', 'Захиалгын №', 'Нэр', 'Утас', 'Нэмэлт утас', 'Хүлээн авах', 'Дүүрэг', 'Хороо',
  'Хаяг', 'Бараа', 'Нийт (₮)', 'Төлбөр', 'Тайлбар', 'Төлөв'];

// Optional: an email address that gets a short notice for each new order. Leave empty to turn off.
const NOTIFY_EMAIL = '';

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const order = JSON.parse(e.postData.contents);

    const phone = String(order.phone || '').replace(/\D/g, '');
    if (!order.name || phone.length !== 8) return reply({ ok: false, error: 'invalid contact' });
    if (!Array.isArray(order.items) || !order.items.length) return reply({ ok: false, error: 'empty cart' });

    let total = 0;
    const items = [];
    for (const item of order.items) {
      const product = PRICES[item.id];
      const quantity = Math.floor(Number(item.quantity));
      if (!product || !(quantity >= 1 && quantity <= 99)) return reply({ ok: false, error: 'invalid item' });
      total += product.price * quantity;
      items.push(product.name + ' × ' + quantity);
    }

    const sheet = getSheet();
    sheet.appendRow([
      new Date(), clean(order.orderId, 20), clean(order.name, 80), "'" + phone,
      order.phone2 ? "'" + String(order.phone2).replace(/\D/g, '') : '',
      clean(order.delivery, 20), clean(order.district, 30), clean(order.khoroo, 20), clean(order.address, 300),
      items.join('\n'), total, clean(order.payment, 30), clean(order.note, 300), 'Шинэ'
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'Шинэ захиалга ' + clean(order.orderId, 20),
        clean(order.name, 80) + ' · ' + phone + '\n' + items.join('\n') + '\nНийт: ' + total + ' ₮\n' + clean(order.payment, 30));
    }
    return reply({ ok: true, orderId: order.orderId, total: total });
  } catch (err) {
    return reply({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Strip leading = + - @ so customer text can never run as a spreadsheet formula.
function clean(value, max) {
  return String(value == null ? '' : value).slice(0, max).replace(/^[=+\-@]+/, '');
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
