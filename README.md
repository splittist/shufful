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
