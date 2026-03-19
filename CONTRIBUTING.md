# Contributing to txt-to-handwriting

Thanks for taking the time to contribute! Here's everything you need to know.

## Getting Started

No build tools or dependencies required. Just:

1. Fork the repository
2. Clone your fork
```bash
   git clone https://github.com/<your-username>/txt-to-handwriting.git
```
3. Open `index.html` in your browser — that's it.

## Project Structure
```
├── index.html        # App structure and UI
├── assets/
│   ├── css/
│   │   └── style.css # Custom styles
│   └── js/
│       └── script.js # Canvas rendering, drag-and-drop, state logic
```

## How to Contribute

### Reporting a Bug
- Open an [Issue](https://github.com/vision39/txt-to-handwriting/issues)
- Describe what happened, what you expected, and steps to reproduce
- Mention your browser and OS

### Suggesting a Feature
- Open an Issue with the `enhancement` label
- Explain the use case clearly

### Submitting a PR
1. Create a branch from `main`
```bash
   git checkout -b feature/your-feature-name
```
2. Make your changes
3. Test in at least one modern browser (Chrome/Firefox/Edge)
4. Open a PR against `main` with a clear description of what you changed and why
5. Enable **"Allow edits from maintainers"** on your PR

## Code Style

- Pure HTML, CSS, and Vanilla JavaScript only — no frameworks or build tools
- Keep changes scoped and focused — one feature or fix per PR
- Avoid adding new external CDN dependencies without discussion first
- Use clear, descriptive variable and function names

## Commit Messages

Follow this simple format:
```
feat: add new handwriting font
fix: correct canvas scaling on mobile
chore: update README
```

Prefixes: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`

## Need Help?

Open an issue and tag it `question` — happy to help!
