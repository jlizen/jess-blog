[blog.jessizen.com](https://blog.jessizen.com)

Built with Zola 0.23.6 and the vendored Apollo theme. Site-specific templates
live in `templates/`, assets in `static/`, and posts in `content/posts/`.

Preview with `zola serve`. Before handing off changes, run:

```sh
zola check --skip-external-links
node --test tests/*.test.cjs
zola build
python3 scripts/check-previews.py public
```

## Comments

Comments use [giscus](https://giscus.app/) and GitHub Discussions in
the General category of `jlizen/jess-blog`. Visitors need a GitHub account to
comment. Settings live in `[extra.giscus]` in `zola.toml`; set `enabled = false`
to disable comments site-wide. If the repository or category changes, copy
its new ID from [giscus.app](https://giscus.app/).

New posts have comments by default. Existing posts opt out with this front
matter; remove it or set it to `true` to enable comments on a post:

```toml
[extra]
comments = false
```

Drafts and non-post pages do not load comments. The widget follows the site's
light/dark toggle and loads lazily. Discussions are matched by pathname, so
keep a post's URL stable after it receives comments.

To check the live integration, preview a non-draft post with comments enabled
and switch between light, dark, and automatic themes. Loading the widget does
not create a discussion; the first comment or reaction does. Local previews
use the same discussions as production.
