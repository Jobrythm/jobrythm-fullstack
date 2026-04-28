# Jobrythm Wiki Source

This folder contains the source markdown for the Jobrythm GitHub Wiki.

GitHub Wikis are stored in a **separate Git repository** (`<repo>.wiki.git`),
not in the main repo. To publish these pages to the wiki, copy them into the
wiki repository and push.

## Publishing the wiki

```bash
# 1. Make sure the wiki has at least one page (visit the repo's "Wiki" tab on
#    GitHub and click "Create the first page" → save anything → delete it later
#    if you want). This initialises the .wiki.git remote.

# 2. Clone the wiki repo
git clone https://github.com/Jobrythm/jobrythm-fullstack.wiki.git
cd jobrythm-fullstack.wiki

# 3. Copy the wiki source into it (overwriting existing pages)
cp ../jobrythm-fullstack/wiki/*.md .

# 4. Commit and push
git add .
git commit -m "Publish wiki"
git push origin master
```

The pages will appear on the repo's **Wiki** tab within a few seconds.

## Page conventions

- `Home.md` — landing page (the wiki's index)
- `_Sidebar.md` — sidebar navigation (shown on every page)
- `_Footer.md` — footer (shown on every page)
- All other `*.md` files become wiki pages. The filename (with hyphens) becomes
  the page's URL slug; underscores in titles are rendered as spaces.

When linking between pages, use `[[Page Title]]` or `[[Display text|Page-Title]]`
syntax (GitHub Wiki convention).
