# Contributing to PDF Studio

Thanks for helping. PDF Studio is a free, private PDF editor that runs entirely in the browser, and contributions of any size are welcome: bug reports, ideas, docs, translations and code.

## Ground rules

- **Privacy is the product.** A user's PDF must never leave their device. No uploads, no analytics, no trackers, no third-party calls that carry document data. PRs that add any of these will not be merged.
- **No build step.** The site is plain HTML, CSS and JavaScript in `site/`. Keep it that way unless there is a very good reason.
- **Keep it fast and mobile-friendly.** Test on a phone-width screen (390px) as well as desktop.
- Be kind. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Project layout

```
site/            the whole website, deployed as-is to GitHub Pages
  index.html     the editor + landing page
  app.js         editor logic (pdf.js for rendering, pdf-lib for saving)
  styles.css     all styles
  fonts/         bundled fonts
  */index.html   guide pages (how to edit text, sign, add images, ...)
  robots.txt, sitemap.xml, llms.txt, llms-full.txt
test/            Node tests (node --test), no dependencies
.github/         Pages deploy workflow, test workflow, issue and PR templates
```

## Run it locally

You need any static file server. Opening `index.html` straight from disk (`file://`) will not work because the editor uses ES modules.

```bash
git clone https://github.com/mrxdevs/pdf-studio.git
cd pdf-studio

# pick one
python3 -m http.server 8080 -d site
npx serve site -l 8080
```

Then open http://localhost:8080. Use **"Try a sample document"** to get a PDF instantly.

## Run the tests

Node 18 or newer, no install needed:

```bash
npm test        # same as: node --test
```

The tests check the page structure, that every referenced local file exists, that core editor features are wired, that no upload code sneaks in, and that the SEO files (sitemap, robots, llms.txt, guide pages) are valid. CI runs them on every pull request.

Before opening a PR, also check by hand:

1. Load the sample, add text, add an image, use **Edit text** on an existing line.
2. Download, then re-open the downloaded PDF and confirm your edits are where you put them.
3. Repeat at phone width (browser dev tools, 390px) with touch emulation.

## Pull request flow

1. **Find or open an issue first** for anything bigger than a typo, so we can agree on the approach. Issues labelled [`good first issue`](https://github.com/mrxdevs/pdf-studio/labels/good%20first%20issue) are a good place to start.
2. **Fork** the repo and create a branch: `git checkout -b fix/short-description`.
3. **Make focused changes.** One fix or feature per PR. Match the existing code style: 2-space indent, plain modern JavaScript, no framework.
4. **Run `npm test`** and the manual check above.
5. **Open a PR** against `main` and fill in the template. Add a screenshot or short clip for any UI change.
6. A maintainer will review. Once it is merged, GitHub Pages deploys it to https://pdfstudio.mrxamjad.com automatically.

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/mrxdevs/pdf-studio/issues/new/choose). For a bug, include the browser and device, steps to reproduce, and if you can, a PDF that shows the problem (remove anything private first). Security problems: please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
