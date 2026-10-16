/**
 * Verification for the Plugin Market browser half.
 *
 * The client module is loaded through `window.__ModuleLoader__.load`, so the
 * test installs a recording stub for that global, evaluates the real file, and
 * then drives the captured factory with a fake `require` plus a fake slots
 * context. This catches the failures that would otherwise only appear in the
 * browser as `slot entry crashed in '<slot>'`.
 *
 * Usage:
 *   node --import ../../dev/register.mjs tests/client.test.mjs
 */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLIENT = join(HERE, '..', 'lib', 'client.js')

/** Minimal React stand-in: enough for createElement and the hooks used. */
function makeFakeReact() {
  const states = []
  const react = {
    createElement(type, props, ...children) {
      return { type, props: props ?? {}, children: children.flat().filter((c) => c != null) }
    },
    useState(initial) {
      const index = states.length
      states[index] = initial
      const set = (value) => {
        states[index] = typeof value === 'function' ? value(states[index]) : value
      }
      return [states[index], set]
    },
    useMemo(factory) { return factory() },
    useCallback(fn) { return fn },
    useEffect() { /* effects are exercised separately, not on render */ },
  }
  return react
}

/** Load the client file and capture the factory it registers. */
async function loadFactory() {
  const source = await readFile(CLIENT, 'utf8')
  let captured = null
  const previous = globalThis.window
  globalThis.window = {
    __ModuleLoader__: {
      load(entry) { captured = entry },
    },
  }
  try {
    // eslint-disable-next-line no-new-func
    new Function('window', source)(globalThis.window)
  } finally {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  }
  assert.ok(captured, 'client.js did not call window.__ModuleLoader__.load')
  assert.equal(captured.id, 'chongk-plugin-market', 'module id must equal the package name')
  assert.equal(typeof captured.factory, 'function')
  return captured.factory
}

let failures = 0
async function check(label, fn) {
  try {
    await fn()
    console.log(`  ok   ${label}`)
  } catch (error) {
    failures += 1
    console.log(`  FAIL ${label}\n       ${error.message}`)
  }
}

console.log('plugin market — browser half\n')

const factory = await loadFactory()

await check('factory requires only react — the CSS is inlined, not a sibling module', () => {
  const requested = []
  const react = makeFakeReact()
  factory((name) => {
    requested.push(name)
    if (name === 'react') return react
    // A relative require is what broke the real load: DSH's client module loader answered
    // "missed the module table" and the whole client half failed to activate.
    throw new Error(`unexpected require: ${name}`)
  })
  assert.deepEqual(requested, ['react'])
})

await check('the stylesheet ships inside client.js, so no relative require is needed', async () => {
  const source = await readFile(CLIENT, 'utf8')
  assert.ok(source.includes('const PANEL_CSS = `'), 'inlined CSS constant is missing')
  // Strip comments first: the explanation of this very bug names the call it removed, and
  // matching that made the check fail on its own documentation.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  assert.ok(!/require\(['"]\.\//.test(code),
    'client.js still asks the loader for a relative module')
})

await check('exports apply and inject = [slots]', () => {
  const react = makeFakeReact()
  const api = factory((name) => (name === 'react' ? react : { PANEL_CSS: '.pm-page{}' }))
  assert.equal(typeof api.apply, 'function')
  assert.deepEqual([...api.inject], ['slots'])
})

/** Fake slots context that records inject/register pairs. */
function makeSlotsContext() {
  const injected = []
  const registered = []
  const effects = []
  return {
    injected,
    registered,
    effects,
    ctx: {
      effect(factory_) { const dispose = factory_(); effects.push(dispose); return dispose },
      slots: {
        inject(owner, callback) { injected.push(owner); return callback() },
        register(options, component) {
          registered.push({ options, component })
          return () => {}
        },
      },
    },
  }
}

await check('registers a sidebar entry and a main page under one panel id', () => {
  const react = makeFakeReact()
  const api = factory((name) => (name === 'react' ? react : { PANEL_CSS: '.pm-page{}' }))
  const fake = makeSlotsContext()
  api.apply(fake.ctx)

  assert.deepEqual([...new Set(fake.injected)].sort(), ['main', 'sidebar.panellist'])

  const sidebar = fake.registered.find((r) => r.options.name === 'sidebar.panellist')
  const main = fake.registered.find((r) => r.options.name === 'main')
  assert.ok(sidebar, 'no sidebar.panellist registration')
  assert.ok(main, 'no main registration')
  assert.equal(sidebar.options.id, 'plugin-market')
  assert.equal(main.options.key, 'plugin-market', 'main page key must equal the sidebar id')
  assert.equal(typeof sidebar.options.label, 'function')
  assert.equal(sidebar.options.label(), '插件市场')
  assert.equal(typeof sidebar.component, 'function', 'sidebar entry needs an icon component')
  assert.equal(typeof main.component, 'function', 'main needs a page component')
})

await check('sidebar icon renders without throwing', () => {
  const react = makeFakeReact()
  const api = factory((name) => (name === 'react' ? react : { PANEL_CSS: '.pm-page{}' }))
  const fake = makeSlotsContext()
  api.apply(fake.ctx)
  const sidebar = fake.registered.find((r) => r.options.name === 'sidebar.panellist')
  const tree = sidebar.component({})
  assert.ok(tree && typeof tree === 'object', 'icon must return an element')
})

await check('page component renders its initial (loading) state without throwing', () => {
  const react = makeFakeReact()
  const api = factory((name) => (name === 'react' ? react : { PANEL_CSS: '.pm-page{}' }))
  const fake = makeSlotsContext()
  api.apply(fake.ctx)
  const main = fake.registered.find((r) => r.options.name === 'main')
  const tree = main.component({})
  assert.ok(tree && typeof tree === 'object', 'page must return an element')
  assert.equal(tree.props.className, 'pm-page')
})

await check('api paths are document-relative, not root-absolute', async () => {
  const source = await readFile(CLIENT, 'utf8')
  const paths = [...source.matchAll(/'(api\/plugin-market\/[a-z]+)'/g)].map((m) => m[1])
  assert.ok(paths.length >= 3, `expected the three api paths, found ${paths.length}`)
  for (const path of paths) {
    assert.ok(!path.startsWith('/'), `${path} must not start with "/" (base href is "./")`)
  }
})

await check('a slots failure is contained instead of escaping apply', () => {
  const react = makeFakeReact()
  const api = factory((name) => (name === 'react' ? react : { PANEL_CSS: '.pm-page{}' }))
  const warnings = []
  const original = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    api.apply({
      effect(factory_) { return factory_() },
      slots: { inject() { throw new Error('slot missing') } },
    })
  } finally {
    console.warn = original
  }
  assert.equal(warnings.length, 1, 'the failure should be logged, not thrown')
  assert.match(warnings[0], /panel registration failed/)
})

console.log(failures === 0 ? '\nall browser-half checks passed' : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
