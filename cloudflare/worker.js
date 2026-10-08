import { Container, ContainerProxy, getContainer } from '@cloudflare/containers';

const encoder = new TextEncoder();
const ADMIN_COOKIE = 'timber_admin';
const SESSION_LIFETIME_SECONDS = 12 * 60 * 60;
const MAX_FORM_BODY_BYTES = 16 * 1024;

export { ContainerProxy };

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

function withSecurityHeaders(response, request) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (new URL(request.url).protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function constantTimeEqual(leftValue, rightValue) {
  const left = encoder.encode(leftValue);
  const right = encoder.encode(rightValue);
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] || 0) ^ (right[index] || 0);
  }
  return difference === 0;
}

async function getSessionKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  for (const entry of cookies.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0) continue;
    if (entry.slice(0, separator).trim() === name) {
      return entry.slice(separator + 1).trim();
    }
  }
  return '';
}

async function createSessionToken(secret) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  const nonce = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(18)));
  const payload = `${expiresAt}.${nonce}`;
  const signature = await crypto.subtle.sign('HMAC', await getSessionKey(secret), encoder.encode(payload));
  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function hasValidSession(request, secret) {
  const token = getCookie(request, ADMIN_COOKIE);
  const [expiresAt, nonce, encodedSignature, extra] = token.split('.');
  if (!expiresAt || !nonce || !encodedSignature || extra !== undefined) return false;
  if (!/^\d{10}$/.test(expiresAt) || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  try {
    return await crypto.subtle.verify(
      'HMAC',
      await getSessionKey(secret),
      base64UrlToBytes(encodedSignature),
      encoder.encode(`${expiresAt}.${nonce}`)
    );
  } catch {
    return false;
  }
}

function sessionCookie(token, request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_LIFETIME_SECONDS}${secure}`;
}

function expiredSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function isSameOriginPost(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

async function handleAdminAuth(request, env) {
  const password = env.TIMBER_ADMIN_PASSWORD;
  const sessionSecret = env.TIMBER_ADMIN_SESSION_KEY;
  const configured = typeof password === 'string' && password.length >= 16
    && typeof sessionSecret === 'string' && sessionSecret.length >= 32;

  if (request.method === 'GET' && new URL(request.url).searchParams.get('action') === 'status') {
    return jsonResponse({
      status: 'success',
      authenticated: configured ? await hasValidSession(request, sessionSecret) : false,
      setupRequired: !configured
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ status: 'error', message: 'Metodă nepermisă.' }, 405, { Allow: 'GET, POST' });
  }
  if (!isSameOriginPost(request)) {
    return jsonResponse({ status: 'error', message: 'Cerere nepermisă.' }, 403);
  }

  let input;
  try {
    const length = Number(request.headers.get('Content-Length') || 0);
    if (length > 4096) return jsonResponse({ status: 'error', message: 'Cerere prea mare.' }, 413);
    input = await request.json();
  } catch {
    return jsonResponse({ status: 'error', message: 'Datele trimise nu sunt valide.' }, 400);
  }

  if (input?.action === 'logout') {
    return jsonResponse(
      { status: 'success', authenticated: false },
      200,
      { 'Set-Cookie': expiredSessionCookie(request) }
    );
  }

  if (input?.action !== 'login') {
    return jsonResponse({ status: 'error', message: 'Acțiune necunoscută.' }, 400);
  }
  if (!configured) {
    return jsonResponse({
      status: 'error',
      message: 'Autentificarea panoului nu este configurată în Cloudflare.'
    }, 503);
  }

  const suppliedPassword = typeof input.password === 'string' ? input.password : '';
  if (!constantTimeEqual(suppliedPassword, password)) {
    return jsonResponse({ status: 'error', message: 'Parola introdusă nu este corectă.' }, 401);
  }

  return jsonResponse(
    { status: 'success', authenticated: true },
    200,
    { 'Set-Cookie': sessionCookie(await createSessionToken(sessionSecret), request) }
  );
}

function normalizeOrders(input) {
  const unique = new Map();
  for (const order of input) {
    if (!order || typeof order !== 'object' || Array.isArray(order)) continue;
    if (typeof order.id !== 'string' || !order.id.trim() || order.id.length > 100) continue;
    unique.set(order.id, order);
  }
  return Array.from(unique.values());
}

async function handleBindings(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/orders' && request.method === 'GET') {
    const result = await env.ORDERS_DB.prepare(
      'SELECT payload FROM orders ORDER BY created_at DESC, id DESC'
    ).all();
    const orders = (result.results || []).flatMap(row => {
      try {
        const order = JSON.parse(row.payload);
        return order && typeof order === 'object' ? [order] : [];
      } catch {
        return [];
      }
    });
    return jsonResponse({ status: 'success', orders });
  }

  if (url.pathname === '/orders' && request.method === 'POST') {
    let input;
    try {
      input = await request.json();
    } catch {
      return jsonResponse({ status: 'error', message: 'Datele comenzii nu sunt valide.' }, 400);
    }

    if (input?.action === 'create' && input.order && typeof input.order.id === 'string') {
      const order = input.order;
      const serialized = JSON.stringify(order);
      if (serialized.length > 64 * 1024) {
        return jsonResponse({ status: 'error', message: 'Comanda depășește limita permisă.' }, 413);
      }
      await env.ORDERS_DB.prepare(
        'INSERT INTO orders (id, created_at, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET created_at = excluded.created_at, payload = excluded.payload'
      ).bind(order.id, String(order.createdAt || new Date().toISOString()), serialized).run();
      return jsonResponse({ status: 'success', order });
    }

    if (input?.action === 'sync_all' && Array.isArray(input.orders)) {
      const orders = normalizeOrders(input.orders);
      const serialized = JSON.stringify(orders);
      if (serialized.length > 512 * 1024) {
        return jsonResponse({ status: 'error', message: 'Lista de comenzi depășește limita permisă.' }, 413);
      }
      await env.ORDERS_DB.batch([
        env.ORDERS_DB.prepare('DELETE FROM orders'),
        env.ORDERS_DB.prepare(
          "INSERT INTO orders (id, created_at, payload) SELECT json_extract(value, '$.id'), COALESCE(json_extract(value, '$.createdAt'), ''), value FROM json_each(?)"
        ).bind(serialized)
      ]);
      return jsonResponse({ status: 'success', orders });
    }

    return jsonResponse({ status: 'error', message: 'Acțiune necunoscută.' }, 400);
  }

  if (url.pathname === '/email' && request.method === 'POST') {
    let input;
    try {
      input = await request.json();
    } catch {
      return jsonResponse({ status: 'error', message: 'Mesajul nu este valid.' }, 400);
    }
    const subject = typeof input.subject === 'string' ? input.subject.trim().replace(/[\r\n]+/g, ' ').slice(0, 180) : '';
    const text = typeof input.text === 'string' ? input.text.slice(0, 24000) : '';
    const replyTo = typeof input.replyTo === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.replyTo)
      ? input.replyTo
      : undefined;
    if (!subject || !text) {
      return jsonResponse({ status: 'error', message: 'Subiectul și conținutul sunt obligatorii.' }, 400);
    }
    if (!env.EMAIL) {
      return jsonResponse({ status: 'error', message: 'Serviciul de email nu este configurat.' }, 503);
    }
    const result = await env.EMAIL.send({
      to: env.MAIL_TO,
      from: env.MAIL_FROM,
      subject,
      text,
      ...(replyTo ? { replyTo } : {})
    });
    return jsonResponse({ status: 'success', messageId: result.messageId });
  }

  return jsonResponse({ status: 'error', message: 'Rută internă necunoscută.' }, 404);
}

export class TimberPhpContainer extends Container {
  defaultPort = 80;
  requiredPorts = [80];
  sleepAfter = '10m';
  enableInternet = false;
  pingEndpoint = '/health.php';

  static outboundByHost = {
    'timber-bindings.internal': (request, env) => handleBindings(request, env)
  };
}

async function proxyPhpRequest(request, env, authenticated) {
  const headers = new Headers(request.headers);
  headers.delete('X-Timber-Worker-Authenticated');
  if (authenticated) headers.set('X-Timber-Worker-Authenticated', '1');
  const backendRequest = new Request(request, { headers });
  const response = await getContainer(env.PHP_BACKEND, 'timber-php').fetch(backendRequest);
  const securedResponse = withSecurityHeaders(response, request);
  const responseHeaders = new Headers(securedResponse.headers);
  responseHeaders.set('X-Timber-Backend', 'cloudflare');
  return new Response(securedResponse.body, {
    status: securedResponse.status,
    statusText: securedResponse.statusText,
    headers: responseHeaders
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === '/admin-auth.php') {
      return withSecurityHeaders(await handleAdminAuth(request, env), request);
    }

    if (pathname === '/orders_api.php') {
      if (!['GET', 'POST'].includes(request.method)) {
        return jsonResponse({ status: 'error', message: 'Metodă nepermisă.' }, 405, { Allow: 'GET, POST' });
      }
      const configured = typeof env.TIMBER_ADMIN_SESSION_KEY === 'string' && env.TIMBER_ADMIN_SESSION_KEY.length >= 32;
      if (!configured || !(await hasValidSession(request, env.TIMBER_ADMIN_SESSION_KEY))) {
        return jsonResponse({ status: 'error', message: 'Autentificarea este necesară pentru această acțiune.' }, configured ? 401 : 503);
      }
      if (request.method === 'POST' && !isSameOriginPost(request)) {
        return jsonResponse({ status: 'error', message: 'Cerere nepermisă.' }, 403);
      }
      try {
        return await proxyPhpRequest(request, env, true);
      } catch {
        return jsonResponse({ status: 'error', message: 'Serviciul comenzilor este temporar indisponibil.' }, 503);
      }
    }

    if (pathname === '/sendmail.php') {
      if (request.method !== 'POST') {
        return jsonResponse({ status: 'error', message: 'Metodă nepermisă.' }, 405, { Allow: 'POST' });
      }
      if (!isSameOriginPost(request)) {
        return jsonResponse({ status: 'error', message: 'Cerere nepermisă.' }, 403);
      }
      const length = Number(request.headers.get('Content-Length') || 0);
      if (length > MAX_FORM_BODY_BYTES) {
        return jsonResponse({ status: 'error', message: 'Cererea este prea mare.' }, 413);
      }
      try {
        return await proxyPhpRequest(request, env, false);
      } catch {
        return jsonResponse({ status: 'error', message: 'Formularul este temporar indisponibil. Încercați din nou sau contactați-ne telefonic.' }, 503);
      }
    }

    if (pathname.toLowerCase().endsWith('.php')) {
      return jsonResponse({ status: 'error', message: 'Resursa solicitată nu există.' }, 404);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ status: 'error', message: 'Metodă nepermisă.' }, 405, { Allow: 'GET, HEAD' });
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request), request);
  }
};
