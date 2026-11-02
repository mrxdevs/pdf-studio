# Security Policy

PDF Studio runs entirely in the browser and never uploads files, so the most important security property is that **a user's document never leaves their device**. Anything that could break that promise is treated as a security issue.

## What counts

- Any way a PDF's contents, or anything typed into the editor, could be sent off the device
- Cross-site scripting (XSS) or script injection, including through a crafted PDF
- A malicious PDF that can run code or read data beyond what the page should have
- Compromise of the third-party libraries or fonts the page loads (pdf.js, pdf-lib)
- Problems in the GitHub Actions deploy workflow

## Supported versions

Only the live site (https://pdfstudio.mrxamjad.com) and the `main` branch are supported. There are no older releases.

## Reporting a vulnerability

**Please don't open a public issue for a security problem.**

1. Preferred: use GitHub's private reporting, **[Report a vulnerability](https://github.com/mrxdevs/pdf-studio/security/advisories/new)** (Security tab → Advisories).
2. Or email **mrxamjad@gmail.com** with the subject `PDF Studio security`.

Please include what you found, steps or a sample file to reproduce it, and the impact as you understand it. You can expect an acknowledgement within 3 days and a status update within 7 days. Once a fix is live we'll credit you in the advisory, unless you would rather stay anonymous.
