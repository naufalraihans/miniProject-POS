function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPriceText(value) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function twoCol(left, right, width = 32) {
  const gap = width - left.length - right.length;
  if (gap >= 1) return left + " ".repeat(gap) + right;
  if (right.length >= width) return right.slice(0, width);
  return `${left.slice(0, Math.max(0, width - right.length - 1))} ${right}`;
}

function wrapText(text, width = 32) {
  const chunks = [];
  for (let index = 0; index < text.length; index += width) {
    chunks.push(text.slice(index, index + width));
  }
  return chunks.length > 0 ? chunks : [""];
}

export function buildReceiptHtml(transaction) {
  const itemsHtml = transaction.items
    .map((item) => {
      const itemName = item.variant ? `${item.name} (${item.variant})` : item.name;
      return `
        <div class="item-row">
          <div class="item-name">${escapeHtml(itemName)}</div>
          <div class="item-meta">${item.qty} x ${formatCurrency(item.price)}</div>
          <div class="item-subtotal">${formatCurrency(item.subtotal)}</div>
        </div>
      `;
    })
    .join("");

  const cashInfo =
    transaction.paymentMethod === "cash"
      ? `
        <div class="row"><span>Dibayar</span><span>${formatCurrency(transaction.cashPaid)}</span></div>
        <div class="row"><span>Kembalian</span><span>${formatCurrency(transaction.change)}</span></div>
      `
      : "";

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <title>Struk - DCelup</title>
    <style>
      @page {
        size: 58mm auto;
        margin: 3mm;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        width: 52mm;
        font-family: "Courier New", Courier, monospace;
        font-size: 11px;
        line-height: 1.35;
        color: #000;
      }
      .center { text-align: center; }
      .store { font-weight: 700; font-size: 12px; }
      .divider {
        margin: 6px 0;
        border-top: 1px dashed #000;
      }
      .item-row { margin-bottom: 6px; }
      .item-name { font-weight: 700; }
      .item-meta { font-size: 10px; }
      .item-subtotal {
        text-align: right;
        font-weight: 700;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .total {
        font-size: 12px;
        font-weight: 700;
      }
      .footer { margin-top: 8px; font-size: 10px; }
      .footer-spacer { height: 2.7em; }
    </style>
  </head>
  <body>
    <div class="center store">DCelup Crispy Chicken</div>
    <div class="center">${escapeHtml(transaction.date)} ${escapeHtml(transaction.time)}</div>
    <div class="divider"></div>
    ${itemsHtml}
    <div class="divider"></div>
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(transaction.total)}</span></div>
    <div class="row"><span>Metode</span><span>${escapeHtml(transaction.paymentMethod.toUpperCase())}</span></div>
    ${cashInfo}
    <div class="divider"></div>
    <div class="center footer">Terima kasih</div>
    <div class="footer-spacer"></div>
  </body>
</html>`;
}

export function buildEscPosReceiptText(transaction) {
  const ESC = "\x1B";
  const GS = "\x1D";
  const NL = "\x0A";
  const width = 32;
  const line = "-".repeat(width);
  const rows = [];

  rows.push(ESC + "@");
  rows.push(ESC + "a" + "\x01");
  rows.push("DCelup Crispy Chicken" + NL);
  rows.push(`${transaction.date} ${transaction.time}` + NL);
  rows.push(line + NL);
  rows.push(ESC + "a" + "\x00");

  transaction.items.forEach((item) => {
    const itemName = item.variant ? `${item.name} (${item.variant})` : item.name;
    wrapText(itemName, width).forEach((chunk) => rows.push(chunk + NL));
    rows.push(
      twoCol(
        `${item.qty} x ${formatPriceText(item.price)}`,
        formatPriceText(item.subtotal),
        width,
      ) + NL,
    );
  });

  rows.push(line + NL);
  rows.push(twoCol("TOTAL", formatPriceText(transaction.total), width) + NL);
  rows.push(
    twoCol("Metode", String(transaction.paymentMethod || "").toUpperCase(), width) + NL,
  );
  if (transaction.paymentMethod === "cash") {
    rows.push(twoCol("Dibayar", formatPriceText(transaction.cashPaid || 0), width) + NL);
    rows.push(twoCol("Kembalian", formatPriceText(transaction.change || 0), width) + NL);
  }
  rows.push(line + NL);
  rows.push(ESC + "a" + "\x01");
  rows.push("Terima kasih" + NL + NL + NL + NL);
  rows.push(GS + "V" + "\x00");

  return rows.join("");
}

export function buildTestPrintPayload() {
  const now = new Date();
  return buildEscPosReceiptText({
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: [
      {
        name: "Test Printer",
        variant: null,
        qty: 1,
        price: 0,
        subtotal: 0,
      },
    ],
    total: 0,
    paymentMethod: "test",
    cashPaid: 0,
    change: 0,
  });
}
