# Jess Izen's blog

Zola 0.23.6 or newer, using [Apollo](https://github.com/not-matthias/apollo).

```sh
zola serve
zola build
zola check --skip-external-links
```

Production URL: `https://blog.jessizen.com`. Build output: `public/`.

## Content

- About page: `content/about/index.md`. The longer biography outline is in TOML comments, so it is excluded from both HTML and search.
- Posts: add Markdown files under `content/posts/` with a title and date. The homepage shows the five newest posts; `/posts/` paginates by ten.
- Footer profiles and navigation: `zola.toml`.
- Contact reveal: `static/js/contact.js` and `templates/partials/contact.html`. Keep the encoded address and the no-JavaScript fallback in sync.
- Photo: the original Rust Foundation image, referenced by `extra.portrait` in the About front matter. To host it locally, save it in `static/images/` and use that path instead.

Post front matter:

```toml
+++
title = "Post title"
date = 2026-10-22
draft = true

[taxonomies]
tags = ["rust"]
+++
```

Preview drafts with `zola serve --drafts`. Remove `draft = true` when ready to publish.

The LinkedIn backports preserve the original wording and time references, with a linked italic archive note. Their dates are the UTC dates encoded in the original LinkedIn activity IDs (`activity_id >> 22` gives Unix milliseconds), rather than the import date.

Two imports are awaiting original post dates: `better-security-reports.md` and `rust-project-funding-advisors.md`. They are undated drafts, so Zola omits them even from draft previews in this date-sorted section. Add the original date, enable their commented tags, and remove `draft = true` when ready. The RCN post retains the original office-hours short link with an italic note that those office hours are no longer running.

## Theme

Apollo's runtime files are vendored under `themes/apollo/` because this workspace was not a Git repository. `themes/apollo/UPSTREAM.toml` records the exact source commit, and the upstream MIT license is included. The vendored files are unchanged.

Site overrides live in `templates/` and `static/custom.css`: a footer, navigation with a visible search control, the homepage, and the About page. Keep customizations here when updating Apollo. Review the base and navigation overrides against the new upstream versions, update the recorded commit, then rebuild.

Search uses Apollo's bundled Elasticlunr client and Zola's generated JSON index. Fonts and scripts are local. The profile photo remains hosted by the Rust Foundation.

The contact button uses character codes to keep a plain address and `mailto:` link out of initial HTML and the search index. It supports keyboard activation, exposes its expanded state, and has a native disclosure fallback with a spelled-out address when JavaScript is disabled. This only discourages simple scrapers. It does not prevent a bot from reading a public address. No CAPTCHA or contact service is required.

## Validation

- `zola build`
- `zola check --skip-external-links`
- Search: matching and unmatched queries against the generated index.
- Contact: reveal, collapse, repeated activation, and no plain address in generated HTML or JSON.
- Temporary post fixtures: newest-post ordering, pagination, tags, and search under a URL prefix.
- Browser layout and screen-reader checks remain manual; browser control was unavailable during setup.
