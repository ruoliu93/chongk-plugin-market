/**
 * Plugin Market — browser half.
 *
 * Registers the sidebar entry (`sidebar.panellist`) and the full-width page
 * (`main`) that share one panel id, then renders the catalogue the host half
 * serves. Both seats are declared by the shell plugin, so each registration is
 * wrapped in `ctx.slots.inject`.
 *
 * Layout follows the catalogue sites this panel was modelled on: a hero with
 * counts, a search box, filter chips, then a card grid whose cards carry an
 * initial block, the source repository, type badges and a copy button.
 *
 * @module chongk-plugin-market/client
 */
window.__ModuleLoader__.load({
	id: 'chongk-plugin-market',
	factory: (require) => {
		const module = { exports: {} }
		const exports = module.exports
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

		const react = require('react')
		const { useCallback, useEffect, useMemo, useState } = react
		const h = react.createElement

		/* DSH's client module loader resolves platform words (`react`) and registered package
		   factories — not relative paths. `require('./panel-css.js')` threw
		   "missed the module table" and the whole client half failed to load, so the CSS is
		   inlined here instead. Edit lib/panel.css and run: python build_panel_css.py */
		/* GENERATED_CSS_START */
		const PANEL_CSS = `/*
 * Plugin Market — panel styles.
 *
 * Every colour comes from a DSH theme token (\`--dsw-alias-*\`) so the panel
 * follows the host's light/dark switching instead of carrying its own palette.
 * A renamed token degrades the look but never breaks rendering, which is why
 * fallbacks are inline rather than duplicated.
 *
 * Class names are prefixed \`pm-\` so nothing here can collide with host styles.
 */

.pm-page {
  padding: 24px 28px 56px;
  max-width: 1320px;
  margin: 0 auto;
  font-family: var(--dsw-font-family, inherit);
  color: var(--dsw-alias-label-primary, #1a1d21);
}

/* ---------- hero ---------- */
.pm-hero {
  text-align: center;
  padding: 18px 0 26px;
}

.pm-hero h1 {
  margin: 0 0 8px;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--dsw-alias-label-primary, #1a1d21);
}

.pm-lead {
  margin: 0 auto 22px;
  max-width: 660px;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--dsw-alias-label-tertiary, #8b939b);
}

.pm-stats {
  display: flex;
  gap: 34px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 0 24px;
}

.pm-stats div {
  text-align: center;
}

.pm-stats b {
  display: block;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--dsw-alias-label-primary, #1a1d21);
}

.pm-stats span {
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #8b939b);
}

.pm-search {
  width: 100%;
  max-width: 620px;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  color: var(--dsw-alias-label-primary, #1a1d21);
  background: var(--dsw-alias-bg-layer-1, #fff);
  border: 1px solid var(--dsw-alias-border-l2, #e6e9ec);
  border-radius: var(--dsw-radius-lg, 10px);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.pm-search:focus {
  outline: none;
  border-color: var(--dsw-alias-brand-primary, #10a37f);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary, #10a37f) 14%, transparent);
}

/* ---------- notes and filters ---------- */
.pm-note {
  margin: 0 0 20px;
  padding: 11px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--dsw-alias-label-secondary, #4a5158);
  background: var(--dsw-alias-state-warn-tertiary, #fdf6ec);
  border: 1px solid var(--dsw-alias-border-l2, #e6e9ec);
  border-radius: var(--dsw-radius-md, 8px);
}

.pm-filters {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin: 0 0 20px;
}

.pm-chip {
  padding: 5.5px 13px;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary, #4a5158);
  background: var(--dsw-alias-bg-layer-1, #fff);
  border: 1px solid var(--dsw-alias-border-l2, #e6e9ec);
  border-radius: 99px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.pm-chip:hover {
  border-color: var(--dsw-alias-brand-primary, #10a37f);
  color: var(--dsw-alias-brand-primary, #10a37f);
}

.pm-chip.on {
  color: var(--dsw-alias-label-primary-inverted, #fff);
  background: var(--dsw-alias-brand-primary, #10a37f);
  border-color: var(--dsw-alias-brand-primary, #10a37f);
}

/* ---------- grid and cards ----------
   Density matches the web catalogue's wide setting: landscape cards, a hidden
   badge row and one inline flag in the footer. A panel sits beside the
   conversation, so its usable width is smaller than a full page. */
.pm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.pm-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--dsw-alias-bg-layer-1, #fff);
  border: 1px solid var(--dsw-alias-border-l2, #e6e9ec);
  border-radius: var(--dsw-radius-md, 9px);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.pm-card:hover {
  border-color: var(--dsw-alias-brand-primary, #10a37f);
  box-shadow: var(--dsw-elevation-prominent, 0 4px 12px rgba(26, 29, 33, 0.06));
  transform: translateY(-1px);
}

.pm-chead {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.pm-avatar {
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: var(--dsw-alias-label-primary-inverted, #fff);
  border-radius: 8px;
}

.pm-ctitle {
  flex: 1;
  min-width: 0;
}

.pm-ctitle h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-primary, #1a1d21);
}

.pm-src {
  margin-top: 2px;
  font-size: 11.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--dsw-alias-label-tertiary, #8b939b);
}

.pm-version {
  flex: 0 0 auto;
  font-family: var(--dsw-font-markdown-code-block, ui-monospace, Menlo, Consolas, monospace);
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8b939b);
}

.pm-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary, #4a5158);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* the author's original wording, subordinate to the translation */
.pm-orig {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--dsw-alias-label-caption, #b3bac1);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* The wide card hides the standalone badge row; the install flag moves into the
   action row, so "can this be installed" stays visible. */
.pm-tags,
.pm-caps {
  display: none;
}

.pm-page .tag {
  padding: 2.5px 9px;
  font-size: 11.5px;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #8b939b);
  background: var(--dsw-alias-bg-layer-3, #f4f6f8);
  border: 1px solid var(--dsw-alias-border-l1, #f0f2f4);
  border-radius: 99px;
}

.pm-page .tag.acc {
  color: var(--dsw-alias-brand-primary, #0d8467);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #10a37f) 12%, transparent);
  border-color: transparent;
}

.pm-page .tag.ok {
  color: var(--dsw-alias-state-success-primary, #0b7a5e);
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #0b7a5e) 12%, transparent);
  border-color: transparent;
}

.pm-page .tag.warn {
  color: var(--dsw-alias-state-warn-label, #a8641a);
  background: var(--dsw-alias-state-warn-tertiary, #fdf6ec);
  border-color: transparent;
}

.pm-page .tag.bad {
  color: var(--dsw-alias-state-error-primary, #b3261e);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #b3261e) 12%, transparent);
  border-color: transparent;
}

/* ---------- actions ---------- */
.pm-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 2px;
}

.pm-btn {
  padding: 6.5px 13px;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary, #4a5158);
  text-decoration: none;
  background: var(--dsw-alias-bg-layer-1, #fff);
  border: 1px solid var(--dsw-alias-border-l2, #e6e9ec);
  border-radius: var(--dsw-radius-md, 8px);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.pm-btn:hover {
  border-color: var(--dsw-alias-brand-primary, #10a37f);
  color: var(--dsw-alias-brand-primary, #10a37f);
}

.pm-btn.primary {
  color: var(--dsw-alias-brand-primary, #0d8467);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary, #10a37f) 10%, transparent);
  border-color: transparent;
}

.pm-btn.primary:hover {
  color: var(--dsw-alias-label-primary-inverted, #fff);
  background: var(--dsw-alias-brand-primary, #10a37f);
}

.pm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- status ---------- */
.pm-empty,
.pm-more {
  padding: 44px 0;
  text-align: center;
  font-size: 14px;
  color: var(--dsw-alias-label-tertiary, #8b939b);
}

.pm-more {
  padding: 22px 0 0;
  font-size: 13px;
}

.pm-error {
  margin: 0 0 18px;
  padding: 12px 15px;
  font-size: 13.5px;
  color: var(--dsw-alias-state-error-primary, #b3261e);
  background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #b3261e) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary, #b3261e) 22%, transparent);
  border-radius: var(--dsw-radius-md, 8px);
}

/* Narrow viewports drop to a single column, matching the host's own lists. */
@media (max-width: 720px) {
  .pm-page {
    padding: 18px 16px 40px;
  }

  .pm-grid {
    grid-template-columns: 1fr;
  }

  .pm-hero h1 {
    font-size: 24px;
  }

  .pm-stats {
    gap: 22px;
  }
}
`
		/* GENERATED_CSS_END */

		/** id of the injected <style> element, so a remount reuses it. */
		const STYLE_ID = 'chongk-plugin-market-style'

		/**
		 * Inject the panel stylesheet once and remove it on unmount.
		 *
		 * The browser half ships as a single module with no stylesheet channel,
		 * so the CSS travels with it and is owned by a React element: unmounting
		 * the panel takes the styles with it.
		 */
		function PanelStyles() {
			useEffect(() => {
				if (document.getElementById(STYLE_ID) === null) {
					const element = document.createElement('style')
					element.id = STYLE_ID
					element.textContent = PANEL_CSS
					document.head.appendChild(element)
				}
				return () => {
					document.getElementById(STYLE_ID)?.remove()
				}
			}, [])
			return null
		}
		/** Panel id; the sidebar entry and the page must agree on it. */
		const PANEL_ID = 'plugin-market'
		/** Sidebar ordering hint. */
		const PANEL_ORDER = 43
		/** Sidebar row and page title. */
		const LABEL = '插件市场'

		/**
		 * Route paths, kept **document-relative** (no leading slash): the GUI is
		 * served with `<base href="./">`, so a root-absolute path would escape a
		 * sub-path deployment prefix.
		 */
		const API = {
			list: 'api/plugin-market/list',
			item: 'api/plugin-market/item',
			meta: 'api/plugin-market/meta',
		}

		/** Capability level → badge tone. */
		const LEVEL_TONE = { elevated: 'bad', notable: 'warn', info: '' }

		/**
		 * Fetch JSON, surfacing the server's error message when it fails.
		 * @param url - document-relative URL.
		 * @param signal - abort signal from the owning effect.
		 * @returns the parsed body.
		 */
		async function getJson(url, signal) {
			const response = await fetch(url, { signal, headers: { accept: 'application/json' } })
			const body = await response.json().catch(() => ({}))
			if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`)
			return body
		}

		/**
		 * Copy text, reporting whether it worked.
		 * @param text - the text to place on the clipboard.
		 * @returns true when the clipboard write succeeded.
		 */
		async function copyText(text) {
			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text)
					return true
				}
			} catch {
				// fall through to the legacy path
			}
			try {
				const area = document.createElement('textarea')
				area.value = text
				area.style.position = 'fixed'
				area.style.opacity = '0'
				document.body.appendChild(area)
				area.select()
				const ok = document.execCommand('copy')
				document.body.removeChild(area)
				return ok
			} catch {
				return false
			}
		}

		/** Sidebar icon: a small grid of marketplace tiles. */
		function MarketIcon() {
			return h('svg', {
				viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none',
				stroke: 'currentColor', strokeWidth: 1.8,
				strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
			},
				h('path', { d: 'M3 9.5 5 4h14l2 5.5' }),
				h('path', { d: 'M4 9.5h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z' }),
				h('path', { d: 'M9 20v-5h6v5' }),
			)
		}

		/**
		 * A rotating palette for the initial block, matching the web catalogue so
		 * a plugin keeps one colour wherever it is shown.
		 */
		const ICON_COLORS = [
			'#e0552e', '#8b5cf6', '#4a7cf7', '#d9a017', '#0ea5b7',
			'#10a37f', '#5b8c3e', '#7a6a5f', '#3d6b9c', '#e0497f',
		]

		/**
		 * Pick a stable palette entry for a package name.
		 * @param name - the package name.
		 * @returns a hex colour.
		 */
		function iconColor(name) {
			let total = 0
			for (let index = 0; index < name.length; index += 1) total += name.charCodeAt(index) * (index + 1)
			return ICON_COLORS[total % ICON_COLORS.length]
		}

		/**
		 * One catalogue card.
		 *
		 * Matches the web catalogue's dense card: initial block, name, source,
		 * description, then the install action. The badge and capability rows are
		 * rendered but hidden by the stylesheet, so the markup stays complete for
		 * a future density switch.
		 *
		 * @param props - the entry plus the copy handler.
		 */
		function Card({ item, onCopy, copied }) {
			const tone = item.capabilitySummary === 'strong' || item.capabilitySummary === 'elevated'
				? 'bad'
				: item.capabilitySummary === 'notable' ? 'warn' : 'ok'

			// The install badge has three states, not two. A package can declare a
			// bundle and still be refused by the plugin manager because its
			// `@deepseek-ai/dsh*` peer requirements do not match this runtime —
			// pnpm installs it, then the mount is refused. Calling that
			// "可安装" would send a reader into a failure the catalogue could
			// have told them about, so the declared-but-refused case says so.
			const installBadge = !item.installable
				? h('span', { className: 'tag warn', key: 'inst' }, '库 · 无 bundle')
				: item.runtimeCompatible === false
					? h('span', {
						className: 'tag bad',
						key: 'inst',
						title: item.runtimeBlockedBy?.length
							? `要求其它 DSH 版本：${item.runtimeBlockedBy.join('、')}`
							: '要求其它 DSH 版本',
					}, '需别的 DSH 版本')
					: h('span', { className: 'tag acc', key: 'inst' }, '可安装')

			const badges = [
				installBadge,
				h('span', { className: 'tag acc', key: 'kind' }, 'Plugin'),
				item.client ? h('span', { className: 'tag', key: 'ui' }, '含界面') : null,
				item.capabilityLabel
					? h('span', { className: `tag ${tone}`, key: 'cap' }, item.capabilityLabel)
					: h('span', { className: 'tag', key: 'cap' }, '未扫描'),
				// The repository link on the card would 404. The package still
				// installs — npm keeps the tarball — so this is a note about the
				// link, not about whether the plugin works.
				item.upstreamGone
					? h('span', {
						className: 'tag warn',
						key: 'gone',
						title: '上游仓库已不可访问（下载地址仍可用）',
					}, '仓库已失效')
					: null,
			].filter(Boolean)

			return h('article', { className: 'pm-card' },
				h('div', { className: 'pm-chead' },
					h('div', {
						className: 'pm-avatar',
						style: { background: iconColor(item.name || item.id || '?') },
					}, (item.title || item.name).slice(0, 1).toUpperCase()),
					h('div', { className: 'pm-ctitle' },
						h('h3', { title: item.name }, item.title || item.name),
						item.source ? h('div', { className: 'pm-src' }, item.source) : null,
					),
					h('span', { className: 'pm-version' }, item.version ? `v${item.version}` : ''),
				),
				h('div', { className: 'pm-body' },
					h('p', { className: 'pm-desc' }, item.zh || item.description || '（该包未提供 description）'),
					item.zh && item.description
						? h('p', { className: 'pm-orig', title: '作者原文' }, item.description)
						: null,
				),
				h('div', { className: 'pm-tags' }, badges),
				item.capabilities?.length
					? h('div', { className: 'pm-caps' },
						item.capabilities.slice(0, 6).map((cap) => h('span', {
							key: cap.key,
							className: `tag ${LEVEL_TONE[cap.level] ?? ''}`,
							title: `${cap.key}（命中 ${cap.hits} 次）`,
						}, cap.label)))
					: null,
				h('div', { className: 'pm-actions' },
					h('button', {
						type: 'button',
						className: 'pm-btn primary',
						disabled: !item.spec,
						onClick: () => onCopy(item),
					}, copied === item.id ? '已复制' : '复制安装命令'),
					item.repo
						? h('a', {
							className: 'pm-btn',
							href: item.repo,
							target: '_blank',
							rel: 'noreferrer noopener',
						}, '仓库')
						: null,
				),
			)
		}

		/** The full-width market page. */
		function MarketPage() {
			const [meta, setMeta] = useState(null)
			const [items, setItems] = useState([])
			const [matched, setMatched] = useState(0)
			const [query, setQuery] = useState('')
			const [category, setCategory] = useState('')
			const [only, setOnly] = useState('')
			const [status, setStatus] = useState('loading')
			const [error, setError] = useState('')
			const [copied, setCopied] = useState('')

			// The catalogue is static within a page load, so one meta fetch is enough.
			useEffect(() => {
				const controller = new AbortController()
				getJson(API.meta, controller.signal)
					.then((body) => { setMeta(body); setError('') })
					.catch((cause) => { if (cause.name !== 'AbortError') setError(String(cause.message ?? cause)) })
				return () => controller.abort()
			}, [])

			// Refetch on every filter change; the host does the filtering so the
			// browser never holds the whole catalogue.
			useEffect(() => {
				const controller = new AbortController()
				const timer = setTimeout(() => {
					setStatus('loading')
					const params = new URLSearchParams()
					if (query.trim()) params.set('q', query.trim())
					if (category) params.set('category', category)
					if (only) params.set('only', only)
					params.set('limit', '120')
					getJson(`${API.list}?${params}`, controller.signal)
						.then((body) => {
							setItems(body.items ?? [])
							setMatched(body.matched ?? 0)
							setStatus('ready')
							setError('')
						})
						.catch((cause) => {
							if (cause.name === 'AbortError') return
							setStatus('error')
							setError(String(cause.message ?? cause))
						})
				}, 180) // debounce so typing does not spam the host
				return () => { clearTimeout(timer); controller.abort() }
			}, [query, category, only])

			const onCopy = useCallback(async (item) => {
				const ok = await copyText(item.install)
				if (!ok) return
				setCopied(item.id)
				setTimeout(() => setCopied((current) => (current === item.id ? '' : current)), 1600)
			}, [])

			const chips = useMemo(() => {
				if (!meta) return []
				const entries = Object.entries(meta.categories ?? {})
				entries.sort((a, b) => b[1] - a[1])
				return entries
			}, [meta])

			const filterChip = (key, label, value, active) => h('button', {
				key,
				type: 'button',
				className: `pm-chip${active ? ' on' : ''}`,
				onClick: () => (key === 'only' ? setOnly(active ? '' : value) : setCategory(active ? '' : value)),
			}, label)

			return h('div', { className: 'pm-page' },
				h(PanelStyles, { key: 'styles' }),
				h('header', { className: 'pm-hero' },
					h('h1', null, '插件市场'),
					h('p', { className: 'pm-lead' },
						'收录从 npm 公开元数据收集的 DeepSeek Harness 插件，标注来源、许可、能否安装与静态能力扫描结果。'),
					meta
						? h('div', { className: 'pm-stats' },
							h('div', null, h('b', null, String(meta.total)), h('span', null, '收录')),
							h('div', null, h('b', null, String(meta.installable)), h('span', null, '声明可安装')),
							meta.runtimeIncompatible
								? h('div', { title: `相对 DSH ${meta.runtimeVersion || '当前版本'}` },
									h('b', { className: 'warn' }, String(meta.runtimeIncompatible)),
									h('span', null, '需别的 DSH 版本'))
								: null,
							meta.upstreamGone
								? h('div', { title: '上游仓库已 404；包本身仍可从 npm 安装' },
									h('b', { className: 'warn' }, String(meta.upstreamGone)),
									h('span', null, '仓库已失效'))
								: null,
							h('div', null, h('b', null, String(meta.client)), h('span', null, '含界面')),
							h('div', null, h('b', null, String(meta.scanned)), h('span', null, '已扫描')),
						)
						: null,
					h('input', {
						className: 'pm-search',
						type: 'search',
						placeholder: '搜索插件名、描述、关键词…',
						value: query,
						onChange: (event) => setQuery(event.target.value),
						'aria-label': '搜索插件',
					}),
				),

				meta?.generatedAt
					? h('p', { className: 'pm-note' },
						`目录数据生成于 ${meta.generatedAt}。来源为 npm registry 公开字段，仅经自动校验，未经人工复核，未做真实安装验证。`)
					: null,

				h('div', { className: 'pm-filters' },
					filterChip('only', '可安装', 'installable', only === 'installable'),
					filterChip('only', '含界面', 'client', only === 'client'),
					filterChip('only', '低敏感能力', 'clean', only === 'clean'),
					chips.map(([id, count]) => filterChip(id, `${id} ${count}`, id, category === id)),
				),

				status === 'error'
					? h('div', { className: 'pm-error' }, `读取目录失败：${error}`)
					: null,

				status === 'loading' && items.length === 0
					? h('div', { className: 'pm-empty' }, '正在读取目录…')
					: null,

				status === 'ready' && items.length === 0
					? h('div', { className: 'pm-empty' }, '没有匹配的插件')
					: null,

				h('div', { className: 'pm-grid' },
					items.map((item) => h(Card, { key: item.id, item, onCopy, copied }))),

				status === 'ready' && matched > items.length
					? h('p', { className: 'pm-more' }, `匹配 ${matched} 个，已显示前 ${items.length} 个 —— 缩小搜索范围可以看到更多。`)
					: null,
			)
		}

		/**
		 * Register both seats. Each `inject` callback's registrations are disposed
		 * when the owning declaration collapses and reinstalled when it returns.
		 * @param ctx - the client root context.
		 * @returns a disposer that releases every registration.
		 */
		function registerPanel(ctx) {
			const slots = ctx.slots
			const disposers = []
			disposers.push(slots.inject('sidebar.panellist', () => slots.register(
				{ name: 'sidebar.panellist', id: PANEL_ID, order: PANEL_ORDER, label: () => LABEL },
				MarketIcon,
			)))
			disposers.push(slots.inject('main', () => slots.register(
				{ name: 'main', key: PANEL_ID },
				MarketPage,
			)))
			return () => {
				for (const dispose of disposers.splice(0)) dispose()
			}
		}

		/**
		 * Mount the panel.
		 * @param ctx - the client root context.
		 */
		function apply(ctx) {
			let release = () => {}
			try {
				release = registerPanel(ctx)
			} catch (error) {
				console.warn('[plugin-market] panel registration failed:', error)
			}
			ctx.effect(() => () => release(), 'plugin-market: ui mounts')
		}

		const inject = ['slots']

		exports.apply = apply
		exports.inject = inject
		return module.exports
	},
})
