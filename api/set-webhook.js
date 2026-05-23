function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  try {
    const token = process.env.BOT_TOKEN;
    const setupSecret = process.env.SETUP_SECRET;
    const secret = req.query && req.query.secret;

    if (!token) {
      return json(res, 500, { ok: false, error: 'BOT_TOKEN is not configured' });
    }

    if (setupSecret && secret !== setupSecret) {
      return json(res, 403, { ok: false, error: 'Wrong setup secret' });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${proto}://${host}/api/telegram`;

    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });

    const result = await response.json();
    return json(res, response.ok ? 200 : 500, {
      ...result,
      webhookUrl
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: error.message });
  }
};
