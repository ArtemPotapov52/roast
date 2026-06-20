/* Cloudflare Pages Function — server-side roast proxy.
   The OpenRouter key lives in the OPENROUTER_KEY environment variable
   (Cloudflare Pages -> Settings -> Environment variables), never in the client.

   POST /api/roast  { "url": "https://example.com" }  ->  { "content": "...", "error": null } */

const ROAST_SYSTEM =
  'You are a brutally honest landing page critic. Given the visible text of a landing page, return a strict verdict in this exact shape:\n' +
  'Grade: <a single letter A to F, plus or minus allowed>\n' +
  'Then exactly 5 numbered issues. Each issue is one sharp sentence, ranked by conversion impact. ' +
  'Be concrete, specific and a little funny. No intro, no closing, no fluff.';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.OPENROUTER_KEY) {
    return json({ content: '', error: { message: 'Server is missing OPENROUTER_KEY. Set it in Cloudflare Pages environment variables.' } }, 500);
  }

  let url = '';
  try { url = (await request.json()).url || ''; } catch (e) { /* ignore */ }
  url = String(url).trim();
  if (!url) return json({ content: '', error: { message: 'No URL provided.' } }, 400);

  const target = /^https?:\/\//i.test(url) ? url : 'https://' + url;

  // 1) Read the page text (server-side, no CORS issues)
  let pageText = '';
  try {
    const r = await fetch('https://r.jina.ai/' + target, { headers: { 'Accept': 'text/plain' } });
    if (r.ok) pageText = (await r.text()).slice(0, 6000);
  } catch (e) { /* fall through with empty text */ }

  const userMsg =
    'URL: ' + target + '\n\nVisible page text:\n' +
    (pageText ? pageText : '(could not fetch the page, critique it based on the URL and what such pages usually get wrong)');

  // 2) Roast it
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.OPENROUTER_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: ROAST_SYSTEM },
          { role: 'user', content: userMsg },
        ],
      }),
    });
    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (content) return json({ content: content.trim(), error: null });
    return json({ content: '', error: data && data.error ? data.error : { message: 'No verdict came back.' } }, 502);
  } catch (e) {
    return json({ content: '', error: { message: 'Upstream error: ' + e.message } }, 502);
  }
}
