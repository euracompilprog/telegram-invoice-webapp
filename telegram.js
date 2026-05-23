function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function sendTelegramMessage(chatId, text) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error('BOT_TOKEN is not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.description || 'Telegram sendMessage failed');
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatInvoice(payload) {
  if (payload && payload.text) {
    return `<b>Invoice</b>\n\n${escapeHtml(payload.text)}`;
  }

  return `<b>Invoice</b>\n\n${escapeHtml(JSON.stringify(payload, null, 2))}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 200, { ok: true, message: 'Telegram webhook is running' });
  }

  try {
    const update = req.body || {};
    const message = update.message || update.edited_message;
    const chatId = message && message.chat && message.chat.id;
    const data = message && message.web_app_data && message.web_app_data.data;

    if (!chatId || !data) {
      return json(res, 200, { ok: true, ignored: true });
    }

    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      payload = { text: data };
    }

    await sendTelegramMessage(chatId, formatInvoice(payload));
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: error.message });
  }
};
