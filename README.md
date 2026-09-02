# SoulAuth Documentation

The documentation site for [SoulAuth](https://github.com/TrantorLabs/SoulAuth),
built with [VitePress](https://vitepress.dev/).

English is the primary version and lives at the site root. Simplified Chinese
lives under `/zh/`.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # output in docs/.vitepress/dist
npm run preview
```

Set `DOCS_BASE` to change the deployment base path (defaults to
`/SoulAuth-docs/` for GitHub Pages project sites):

```bash
DOCS_BASE=/ npm run build
```

## Verification

```bash
npm run verify   # build + all nine checks below
```

Each check exists because VitePress does not cover it, and because every one of
these failures is **invisible**: the build stays green and the page still
renders.

| Script | What it catches |
| --- | --- |
| `check:anchors` | Links whose `#anchor` does not exist on the target page. VitePress validates that a page exists, but not the fragment — a wrong anchor produces no build error, just a click that does nothing. Chinese headings are especially easy to get wrong because punctuation is transliterated into `-`. |
| `check:endpoints` | Endpoint and route **counts** written into the prose. That fact belongs to `contracts/openapi.yaml` and is guarded by `tests/conformance.rs::j4`; a number copied back here is a second source of truth that will drift. During review the endpoint count was quoted as 66, 68 and 70 — none correct. |
| `check:figures` | The three canonical figures: a `<Figure2 locale="en" />` on a Chinese page renders perfectly and shows the reader the wrong language. Also asserts the two locales' figure data are structurally identical, down to array lengths. |
| `check:status` | Every `<Status>` badge: a real claim (`tested` / `conformant`) must name the assertion backing it, a vocabulary demo must be marked `glossary`, and the two locales must agree. A badge without a guard is an adjective wearing evidence's clothes. |
| `check:contracts` | The contract snapshot: all four registries present, non-empty, taken from a clean working tree, and the conformance readout pinned to the same commit. Also that no Chinese leaks into an English-facing contract field, and that every page rendering contract data declares its source commit. |
| `check:citations` | Endpoints, config keys and permission names mentioned in **prose**. The reference tables are rendered from the contract and cannot drift; the sentences around them can. |
| `check:coverage` | The other direction: every path in the contract must either appear in prose, or be registered on its reference page as table-only *with a reason*. Nothing else checks this, and 48 of 71 paths were reachable only through a rendered table — including four multi-step flows whose call order a table cannot express. Checked per locale, because a flow explained only in English is unexplained for a Chinese reader. |
| `check:zh-style` | The machine-checkable part of `STYLE.zh.md`: em-dash density, mixed quote styles, and one concept going by four names. The Chinese site was once a sentence-by-sentence translation, which kept the English information structure intact and read like machine output. |
| `check:locale` | Chinese leaking onto English pages — scanned in the **built output**, not the source, because both times it happened the offending string was not in any page file: once it came from a contract `description`, once from a hard-coded fallback inside a render component. |

None of them needs the SoulAuth source — the contract snapshot under
`docs/.vitepress/data/contracts/` is committed, so the site builds and verifies
standalone. Refreshing that snapshot does need the source:

```bash
npm run sync:contracts               # looks for ../SoulAuth
python3 scripts/sync-contracts.py /path/to/SoulAuth
```

## Structure

```
docs/
├── index.md                 English home
├── start/                   positioning, quickstart, choosing a path
├── concepts/                identity model, architecture
├── integrate/               OIDC integration paths
├── operate/                 deployment, production, recovery
├── security/                security and threat model, standards
├── reference/               HTTP API, rendered from the contract
├── spec/                    architecture and ontology
├── project/                 conformance readout
├── zh/                      the same tree in Simplified Chinese
└── .vitepress/
    ├── config.mts           site config, both locales
    ├── data/contracts/      derived snapshot of SoulAuth's contracts/*.yaml
    └── theme/
        ├── contracts/       tables rendered from that snapshot
        ├── figures/         the three canonical figures, as components
        └── status/          status badges and the conformance readout
scripts/                     the nine checks above, plus sync-contracts.py
```

## Editing

Both locales carry the same 31 pages. When you change one, change the other —
the checks above catch badge, figure and citation drift, but nothing catches a
translation that has silently fallen behind in prose.

## Licence

The documentation — everything under `docs/` — is **CC BY 4.0**; see
[LICENSE](LICENSE). SoulAuth itself is licensed separately under Apache-2.0.

The build tooling in this repository (`scripts/`, `.github/`) is Apache-2.0,
matching SoulAuth.
