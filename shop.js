/* Shared shop data and cart helpers for index.html and order.html. */
(function () {
  const CONFIG = {
    // Google Apps Script web app URL that writes orders into the Google Sheet.
    // Leave empty until it is set up (see apps-script/README.md); the order form stays disabled while it is empty.
    ORDER_ENDPOINT: '',
    // Bank transfer details shown after an order paid by transfer. Leave fields empty to hide the block.
    BANK: { bank: '', account: '', holder: '' },
    // Contact phone shown on the order page.
    PHONE: ''
  };

  const coffees = [
    {
      id: 'sweet-flame-lava', name: 'Sweet Flame Lava', kind: 'medium-dark', roast: 'Дунд бараан хууралт',
      description: 'Какаоны өтгөн амт, чихэрлэг карамель хосолсон үнэрлэг эспрессо.',
      notes: 'Карамель, хуурсан самар, какао, зөгийн бал', price: 38900
    },
    {
      id: 'dark-surge-chocolate', name: 'Dark Surge Chocolate', kind: 'dark', roast: 'Бараан хууралт',
      description: 'Самрын өтгөн амт, зөөлөн торгомсог крематай, хүчиллэг багатай эспрессо.',
      notes: 'Хар шоколад, карамель, хуурсан самар, цөцгий', price: 42900
    },
    {
      id: 'black-gold-flame', name: 'Black Gold Flame', kind: 'dark', roast: 'Бараан хууралт',
      description: 'Хүчтэй, өтгөн биетэй бөгөөд исгэлэн амт мэдрэгдэхгүй эспрессо.',
      notes: 'Сүүн шоколад, цөцгийн тостой жигнэмэг, соёолжны сахар, галд шарсан кешью', price: 35900
    }
  ];

  const CART_KEY = 'khur-cart';
  const money = amount => new Intl.NumberFormat('mn-MN').format(amount) + ' ₮';
  const photo = coffee => `img/${coffee.id}.jpg`;

  function loadCart() {
    const quantities = new Map();
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
      for (const coffee of coffees) {
        const quantity = saved?.[coffee.id];
        if (Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 99) quantities.set(coffee.id, quantity);
      }
    } catch {}
    return quantities;
  }

  function saveCart(quantities) {
    try {
      if (quantities.size) localStorage.setItem(CART_KEY, JSON.stringify(Object.fromEntries(quantities)));
      else localStorage.removeItem(CART_KEY);
    } catch {}
  }

  function cartLines(quantities) {
    const lines = [];
    let total = 0, count = 0;
    for (const coffee of coffees) {
      const quantity = quantities.get(coffee.id) || 0;
      if (!quantity) continue;
      lines.push({ coffee, quantity, subtotal: quantity * coffee.price });
      total += quantity * coffee.price;
      count += quantity;
    }
    return { lines, total, count };
  }

  window.EB = { CONFIG, coffees, money, photo, loadCart, saveCart, cartLines };
})();
