/**
 * Verification for the Plugin Market host half.
 *
 * Mounts the real plugin against a stub context that records route
 * registrations, then invokes each handler with fake request/response objects —
 * the same shape the shipped web server passes. Nothing here needs a live
 * harness, so it runs anywhere Node runs.
 *
 * Usage:
 *   node --import ../../dev/register.mjs tests/host.test.mjs
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const plugin = await import('../lib/index.js')

/** Recording fake response matching what the host half writes. */
function makeResponse() {
  const out = { statusCode: undefined, headers: undefined, body: '' }
  return {
    writeHead(status, headers) {
      out.statusCode = status
      out.headers = headers
    },
    end(body) {
      out.body = body ?? ''
    },
    get result() {
      return out
    },
  }
}

/** Minimal fake request, enough for `new URL(request.url, base)`. */
function makeRequest(method, url) {
  return { method, url, headers: { host: '127.0.0.1:19387' } }
}

/** Mount the plugin the way the loader does and capture its routes. */
function startHost(config = {}) {
  const routes = new Map()
  const effects = []
  const warnings = []
  const ctx = {
    logger: { warn: (error) => warnings.push(String(error)) },
    effect(factory) {
      const dispose = factory()
      effects.push(dispose)
      return dispose
    },
    webServer: {
      register(route) {
        if (routes.has(route.path)) throw new Error(`duplicate route ${route.path}`)
        routes.set(route.path, route)
        return () => routes.delete(route.path)
      },
    },
  }
  const resolved = new plugin.Config(config)
  plugin.apply(ctx, resolved)
  return { routes, effects, warnings, config: resolved }
}

/** Invoke one registered route and return the parsed response. */
async function call(routes, path, method = 'GET', query = '') {
  const route = routes.get(path)
  assert.ok(route, `route not registered: ${path}`)
  const response = makeResponse()
  await route.handler(makeRequest(method, path + query), response)
  const { statusCode, headers, body } = response.result
  return { status: statusCode, headers, text: body, json: body ? JSON.parse(body) : null }
}

let failures = 0
function check(label, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`  ok   ${label}`))
    .catch((error) => {
      failures += 1
      console.log(`  FAIL ${label}\n       ${error.message}`)
    })
}

console.log('plugin market — host half\n')

await check('exports the loader contract', () => {
  assert.equal(plugin.name, 'plugin-market')
  assert.deepEqual([...plugin.inject], ['webServer'])
  assert.equal(typeof plugin.apply, 'function')
  assert.equal(typeof plugin.Config, 'function')
})

await check('resolves config defaults', () => {
  const { config } = startHost()
  assert.equal(config.catalog, '')
  assert.ok(config.pageSize > 0)
})

await check('registers exactly the four documented routes', () => {
  const { routes } = startHost()
  assert.deepEqual(
    [...routes.keys()].sort(),
    [
      '/api/plugin-market/catalog',
      '/api/plugin-market/item',
      '/api/plugin-market/list',
      '/api/plugin-market/meta',
    ],
  )
  for (const route of routes.values()) {
    assert.equal(route.kind, 'exact', `${route.path} must be an exact route`)
    assert.equal(typeof route.handler, 'function')
  }
})

await check('meta reports the catalogue totals', async () => {
  const { routes } = startHost()
  const { status, json } = await call(routes, '/api/plugin-market/meta')
  assert.equal(status, 200)
  assert.ok(json.total > 0, 'catalogue should not be empty')
  assert.ok(json.installable > 0)
  assert.equal(typeof json.generatedAt, 'string')
  assert.ok(Object.keys(json.categories).length > 0)
})

await check('list returns a page and honours limit', async () => {
  const { routes } = startHost({ pageSize: 5 })
  const { status, json } = await call(routes, '/api/plugin-market/list')
  assert.equal(status, 200)
  assert.equal(json.items.length, 5)
  assert.ok(json.matched >= 5)
  assert.ok(json.items.every((item) => typeof item.id === 'string' && item.id.length > 0))
})

await check('list honours the search filter', async () => {
  const { routes } = startHost()
  const { json } = await call(routes, '/api/plugin-market/list', 'GET', '?q=theme')
  assert.ok(json.matched > 0, 'expected at least one theme plugin')
  const haystack = json.items.map((item) => `${item.name} ${item.title} ${item.description}`.toLowerCase())
  assert.ok(haystack.some((text) => text.includes('theme')))
})

await check('list honours the installable filter', async () => {
  const { routes } = startHost()
  const { json } = await call(routes, '/api/plugin-market/list', 'GET', '?only=installable')
  assert.ok(json.items.length > 0)
  assert.ok(json.items.every((item) => item.installable === true))
})

await check('list caps a caller-supplied limit at the configured page size', async () => {
  const { routes } = startHost({ pageSize: 3 })
  const { json } = await call(routes, '/api/plugin-market/list', 'GET', '?limit=999')
  assert.equal(json.items.length, 3)
})

await check('item returns one entry with its capabilities', async () => {
  const { routes } = startHost()
  const list = await call(routes, '/api/plugin-market/list')
  const first = list.json.items[0]
  const { status, json } = await call(routes, '/api/plugin-market/item', 'GET', `?id=${encodeURIComponent(first.id)}`)
  assert.equal(status, 200)
  assert.equal(json.item.name, first.name)
  assert.ok(Array.isArray(json.item.capabilities))
  assert.ok(typeof json.item.install === 'string')
})

await check('item accepts a full package name as the id', async () => {
  const { routes } = startHost()
  const list = await call(routes, '/api/plugin-market/list')
  const first = list.json.items[0]
  const { status, json } = await call(routes, '/api/plugin-market/item', 'GET', `?id=${encodeURIComponent(first.name)}`)
  assert.equal(status, 200)
  assert.equal(json.item.id, first.id)
})

await check('item rejects a missing id with 400', async () => {
  const { routes } = startHost()
  const { status, json } = await call(routes, '/api/plugin-market/item')
  assert.equal(status, 400)
  assert.match(json.error, /missing id/)
})

await check('item reports an unknown id with 404', async () => {
  const { routes } = startHost()
  const { status, json } = await call(routes, '/api/plugin-market/item', 'GET', '?id=definitely-not-here')
  assert.equal(status, 404)
  assert.match(json.error, /not found/)
})

await check('non-GET methods are refused with 405', async () => {
  const { routes } = startHost()
  for (const path of ['/api/plugin-market/list', '/api/plugin-market/meta', '/api/plugin-market/item']) {
    const { status } = await call(routes, path, 'POST')
    assert.equal(status, 405, `${path} should refuse POST`)
  }
})

await check('responses declare JSON and are not cached', async () => {
  const { routes } = startHost()
  const { headers } = await call(routes, '/api/plugin-market/meta')
  assert.match(headers['content-type'], /application\/json/)
  assert.equal(headers['cache-control'], 'no-store')
})

await check('catalog serves the raw payload', async () => {
  const { routes } = startHost()
  const { status, json } = await call(routes, '/api/plugin-market/catalog')
  assert.equal(status, 200)
  assert.ok(Array.isArray(json.items))
  assert.equal(json.items.length, json.total)
})

await check('unloading disposes every route', () => {
  const { routes, effects } = startHost()
  assert.equal(routes.size, 4)
  for (const dispose of effects) dispose()
  assert.equal(routes.size, 0)
})

await check('a duplicate registration throws rather than shadowing', () => {
  const routes = new Map()
  routes.set('/api/plugin-market/list', {})
  const ctx = {
    logger: { warn() {} },
    effect: (factory) => factory(),
    webServer: {
      register(route) {
        if (routes.has(route.path)) throw new Error('duplicate')
        routes.set(route.path, route)
        return () => {}
      },
    },
  }
  assert.throws(() => plugin.apply(ctx, new plugin.Config({})), /duplicate/)
})

console.log(failures === 0 ? '\nall host-half checks passed' : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
