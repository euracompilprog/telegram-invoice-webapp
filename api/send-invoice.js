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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 200, { ok: true, message: 'Send invoice endpoint is running' });
  }

  try {
    const body = req.body || {};
    const userId = body.userId;
    const payload = body.payload || {};

    if (!userId) {
      return json(res, 400, { ok: false, error: 'Telegram user ID is missing' });
    }

    const text = payload.text || JSON.stringify(payload, null, 2);
    await sendTelegramMessage(userId, `<b>Invoice</b>\n\n${escapeHtml(text)}`);
    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: error.message });
  }
};
