function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 200, { ok: true, message: 'Send PDF endpoint is running' });
  }

  try {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN is not configured');
    }

    const body = req.body || {};
    if (!body.userId || !body.pdfBase64) {
      return json(res, 400, { ok: false, error: 'userId or pdfBase64 is missing' });
    }

    const pdfBuffer = Buffer.from(body.pdfBase64, 'base64');
    const fileName = body.fileName || 'invoice.pdf';
    const formData = new FormData();
    formData.append('chat_id', String(body.userId));
    formData.append('caption', escapeHtml(body.caption || 'Invoice PDF').slice(0, 1024));
    formData.append('parse_mode', 'HTML');
    formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), fileName);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Telegram sendDocument failed');
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: error.message });
  }
};
