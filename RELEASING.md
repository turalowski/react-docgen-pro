# Releasing

Manual semver, no changesets/lerna. `react-docgen-pro` is a single
published package — the core parser plus its Vite loader (`react-docgen-pro/vite`)
and webpack loader (`react-docgen-pro/webpack`) subpaths all version and
publish together.

## Bumping the version

```bash
npm version patch      # or minor / major
```

This bumps `version` in `package.json`, and (because it's run inside a
git repo) commits and tags that change. Push the tag along with the
commit:

```bash
git push && git push --tags
```

## Publishing to npm

This is a public, unscoped package meant to be installed the same way
as any other npm dependency (`npm install react-docgen-pro`) — no
scope, no private registry, no token config needed for consumers.

One-time setup (per machine that publishes):

```bash
npm login          # needs an npmjs.com account; 2FA is required for publishing
```

Then, for each release:

```bash
npm publish
```

`prepublishOnly` rebuilds `dist/` automatically (the compiled core
parser), so no separate build step is required — `npm run build` is a
convenience for local testing. The Vite and webpack loaders ship their
source as-is (`src/vite`, `src/webpack`), same as `dist`.

The very first publish of a brand-new package name needs interactive
2FA (an OTP from your authenticator app) unless you've set up an
automation token — `npm publish` will prompt for it.

## Why not a private registry

An earlier version of this doc set the package up as
`@turalowski`-scoped, restricted-access on GitHub Packages. That's the
right call for internal-only tooling, but this package is meant for
public, no-signup installs (e.g. after being shared publicly) — which
the public npm registry does directly, with none of GitHub Packages'
scope/token requirements for people installing it. If a
private/internal-only need comes up again later, the same
`publishConfig`/`.npmrc` approach works with GitHub Packages, a
self-hosted [Verdaccio](https://verdaccio.org/) instance, or a managed
registry like AWS CodeArtifact — swap the `registry` URL and add a
token, nothing else changes.
