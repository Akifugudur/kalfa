import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface InvoiceData {
  shopName: string;
  ownerName: string;
  city?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: string;
  invoiceNo: string;
}

function formatTL(amount: number): string {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function generateHTML(data: InvoiceData): string {
  const kdvOrani = 20;
  const kdvHaric = data.total / (1 + kdvOrani / 100);
  const kdvTutar = data.total - kdvHaric;

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      background: #fff;
      color: #1a1a1a;
      padding: 40px;
      font-size: 14px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid #1D9E75;
    }
    .brand h1 {
      font-size: 32px;
      font-weight: 800;
      color: #1D9E75;
      letter-spacing: -1px;
    }
    .brand p {
      font-size: 12px;
      color: #888;
      margin-top: 2px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta .badge {
      background: #1D9E75;
      color: white;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 8px;
    }
    .invoice-meta p {
      color: #555;
      font-size: 13px;
      line-height: 1.6;
    }
    .invoice-meta strong {
      color: #1a1a1a;
    }

    /* Shop info */
    .shop-box {
      background: #f5f4f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 32px;
    }
    .shop-box h3 {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }
    .shop-box p {
      font-size: 13px;
      color: #666;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead tr {
      background: #1a1a1a;
      color: white;
    }
    thead th {
      padding: 12px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    thead th:last-child { text-align: right; }
    tbody tr {
      border-bottom: 1px solid #eee;
    }
    tbody td {
      padding: 14px;
      font-size: 14px;
      color: #333;
    }
    tbody td:last-child {
      text-align: right;
      font-weight: 600;
    }

    /* Totals */
    .totals {
      margin-left: auto;
      width: 260px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #666;
    }
    .total-row.grand {
      border-top: 2px solid #1D9E75;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 17px;
      font-weight: 800;
      color: #1a1a1a;
    }
    .total-row.grand span:last-child {
      color: #1D9E75;
    }

    /* Footer */
    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 11px;
      color: #aaa;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">
      <h1>Kalfa</h1>
      <p>Esnafın akıllı yardımcısı</p>
    </div>
    <div class="invoice-meta">
      <span class="badge">SATIŞ FATURASI</span>
      <p><strong>Fatura No:</strong> ${data.invoiceNo}</p>
      <p><strong>Tarih:</strong> ${data.date}</p>
    </div>
  </div>

  <div class="shop-box">
    <h3>${data.shopName}</h3>
    <p>${data.ownerName}${data.city ? ' · ' + data.city : ''}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ürün / Hizmet</th>
        <th style="text-align:center">Adet</th>
        <th style="text-align:right">Birim Fiyat</th>
        <th>Toplam</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${data.productName}</td>
        <td style="text-align:center">${data.quantity}</td>
        <td style="text-align:right">${formatTL(data.unitPrice)}</td>
        <td>${formatTL(data.total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>KDV Hariç</span>
      <span>${formatTL(kdvHaric)}</span>
    </div>
    <div class="total-row">
      <span>KDV (%${kdvOrani})</span>
      <span>${formatTL(kdvTutar)}</span>
    </div>
    <div class="total-row grand">
      <span>TOPLAM</span>
      <span>${formatTL(data.total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Bu belge Kalfa uygulaması ile oluşturulmuştur. • kalfa.app</p>
  </div>

</body>
</html>
  `;
}

export async function createAndShareInvoice(data: InvoiceData): Promise<void> {
  const html = generateHTML(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Faturayı Paylaş',
      UTI: 'com.adobe.pdf',
    });
  }
}
