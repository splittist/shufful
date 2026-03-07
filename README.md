# Shufful

A browser-based PDF assembly tool. Upload source PDFs, pick pages, and download a new PDF — entirely in your browser. Nothing is uploaded to a server.

## Features

- **Manual mode** — drag pages from uploaded documents into an assembly list, reorder them, and download the result.
- **Recipe mode** — paste a JSON recipe (e.g. written by an LLM) to generate multiple output PDFs at once and download them as a ZIP.
- All PDF processing runs locally via [pdf-lib](https://pdf-lib.js.org/) and [PDF.js](https://mozilla.github.io/pdf.js/).

---

## For Users

### Manual mode

1. Click **Add files** to upload one or more PDFs.
2. Click a page thumbnail to add it to the assembly list on the right.
3. Drag to reorder pages in the assembly list.
4. Click **Download PDF** to save the result.

### Recipe mode

Recipe mode lets you describe multiple output files declaratively — useful when you have a lot of pages or outputs to organise, or when you want an LLM to do the selecting for you.

1. Switch to **Recipe** using the toggle in the header.
2. Click **Copy schema** to copy the JSON schema, then paste it into an LLM prompt along with a description of what you want.
3. Paste the recipe JSON returned by the LLM into the editor.
4. Upload the source PDFs that the recipe references.
5. Click **Download all** to get a ZIP, or download individual outputs.

#### Recipe format

```json
{
  "outputs": [
    {
      "filename": "summary",
      "pages": [
        { "source": "report.pdf", "pages": [1, 2] },
        { "source": "appendix.pdf", "from": 1, "to": 5 }
      ]
    },
    {
      "filename": "full-report",
      "pages": [
        { "source": "report.pdf" }
      ]
    }
  ]
}
```

Each page selection must include a `source` (the uploaded filename) and one of:

| Field | Meaning |
|---|---|
| `page: N` | Single page (1-based) |
| `pages: [1, 3, 5]` | Specific pages |
| `from: M, to: N` | Inclusive range |
| *(omitted)* | All pages |

---

## For Developers

### Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (dev server + build)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [pdf-lib](https://pdf-lib.js.org/) — PDF generation
- [PDF.js](https://mozilla.github.io/pdf.js/) — page thumbnail rendering
- [JSZip](https://stuk.github.io/jszip/) — ZIP assembly for recipe downloads
- [@dnd-kit](https://dndkit.com/) — drag-and-drop reordering
- [Vitest](https://vitest.dev/) — unit tests

### Getting started

```sh
npm install
npm run dev
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Type-check only (`tsc --noEmit`) |

### Project structure

```
src/
  components/       # UI components (FileUploader, DocumentPanel, AssemblyPanel, RecipePanel)
  hooks/            # usePdfDocuments, useAssembly, useRecipe
  types/            # Shared TypeScript types (recipe.ts, etc.)
  utils/            # pdfAssembler, zipAssembler, recipeValidator
  test/             # Unit tests
```

### Key files

| File | Purpose |
|---|---|
| `src/App.tsx` | Root layout and mode switching |
| `src/utils/recipeValidator.ts` | Recipe JSON schema + validation logic |
| `src/utils/zipAssembler.ts` | Assembles recipe outputs into a ZIP |
| `src/utils/pdfAssembler.ts` | Builds a single PDF from page selections |
| `src/hooks/useRecipe.ts` | Recipe state, validation, and download orchestration |

---

## Deploying to SharePoint ⚠️ *draft*

> **This section is a draft.** The steps below have not been fully tested in a SharePoint environment and should be treated as a starting point. Validate each approach against your organisation's SharePoint and IT policies before proceeding.

Because Shufful is a purely client-side static app (no server required), there are two practical ways to surface it in SharePoint Online. Choose based on how deeply integrated you need it to be.

---

### Option A — Embed web part (simplest)

Host the built app on any static hosting service (e.g. [Azure Static Web Apps](https://azure.microsoft.com/en-us/products/app-service/static), GitHub Pages, or a CDN), then embed it in a SharePoint page using the built-in **Embed** web part. The app runs in an iframe.

**1. Build the app**

No special configuration is needed — the default Vite build produces a self-contained `dist/` folder:

```sh
npm run build
```

**2. Deploy `dist/` to a static host**

For Azure Static Web Apps you can use the [Azure Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/) or the VS Code extension. Once deployed, note the public URL (e.g. `https://my-app.azurestaticapps.net`).

**3. Embed in a SharePoint page**

1. Edit a SharePoint page.
2. Add a web part → search for **Embed**.
3. Paste the public URL into the **Website address** field.
4. Save and publish the page.

> **Limitation:** The app runs in an iframe and does not have access to the SharePoint user context or Graph API. File downloads (PDF/ZIP) work as normal because they are handled entirely within the iframe.

---

### Option B — SharePoint Framework (SPFx) web part (full integration)

SPFx is Microsoft's recommended extensibility model for SharePoint Online. Wrapping Shufful in an SPFx web part embeds it directly in the page DOM (no iframe), gives it automatic SSO, and lets it be distributed via the tenant app catalog.

This approach requires migrating the build toolchain from Vite to the SPFx toolchain (Gulp + webpack). The React components and business logic can be reused with minimal changes.

**Prerequisites**

- Node.js LTS (check the [SPFx compatibility matrix](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/compatibility) for the exact version required)
- SharePoint tenant admin access (to deploy to the app catalog)

**1. Scaffold an SPFx project**

```sh
npm install -g @microsoft/generator-sharepoint
yo @microsoft/sharepoint
```

Select: **WebPart** → framework **React** → give it a name (e.g. `Shufful`).

**2. Copy source files**

Copy `src/components/`, `src/hooks/`, `src/types/`, and `src/utils/` into the generated SPFx project's `src/webparts/<name>/` folder. Update import paths as needed.

**3. Wire up the React component**

Replace the scaffolded `render()` method in the web part class with a call to `ReactDOM.render(<App />, this.domElement)`.

**4. Install additional dependencies**

```sh
npm install pdf-lib pdfjs-dist jszip @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
```

> **Note:** `pdfjs-dist` ships a web worker. In SPFx you will need to configure the worker source URL relative to the SPFx CDN path; see the [PDF.js SPFx guidance](https://github.com/mozilla/pdf.js/wiki/Setup-PDF.js-in-a-website) for details.

**5. Build and package**

```sh
gulp bundle --ship
gulp package-solution --ship
```

This produces a `.sppkg` file in `sharepoint/solution/`.

**6. Deploy to the tenant app catalog**

1. Go to the SharePoint admin centre → **More features** → **Apps** → **Open**.
2. Select **Upload** and upload the `.sppkg` file.
3. In the **Enable app** panel, choose whether to deploy to all sites or specific sites.
4. Select **Enable app**.

**7. Add the web part to a page**

1. Edit any modern SharePoint page.
2. Click **+** to add a web part → find **Shufful** under your organisation's web parts.
3. Save and publish.

**Further reading**

- [Set up your SPFx development environment](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment)
- [SharePoint Framework overview](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [Manage apps in the SharePoint admin centre](https://learn.microsoft.com/en-us/sharepoint/use-app-catalog)
