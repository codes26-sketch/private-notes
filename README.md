# Private Notes Vault (`private-notes`)

A local-first study notes vault. The access screen supports three server-side password roles: a redirect key, a study key, and an owner key. Notes and settings are stored in SQLite; uploaded files stay in a private data directory and are not served as static files. Ollama embeddings and answer generation are optional local services. Keyword/full-text search continues to work when Ollama is offline.

## Prerequisites

- Node.js 20.6 or newer (Node 22 LTS recommended), plus npm.
- Windows, macOS, or Linux. Keep this service bound to localhost unless you understand and configure network security.
- Optional: [Ollama](https://ollama.com/download) for local semantic retrieval and grounded answer generation.

## Install and run

```sh
npm install
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Edit `.env` and replace `SESSION_SECRET` with a long random secret (for example, `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`). Do not commit `.env` or copy it into a public directory.

Start Ollama if you want local AI, then download the default models:

```sh
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
```

The first model answers questions; the second creates local vector embeddings. Both run on the computer hosting the vault. Adjust `OLLAMA_URL`, `OLLAMA_CHAT_MODEL`, and `OLLAMA_EMBED_MODEL` in `.env` to change them. Without Ollama, documents remain searchable with SQLite full-text and lexical search; AI answers report that the local service is unavailable.

Run the app in development:

```sh
npm run dev
```

Open the Vite address printed by the client (usually `http://localhost:5173`). The API runs on `http://127.0.0.1:4173`. On first launch, create an owner password of at least 12 characters. This is the only setup password; then use the Owner Studio's Security page to set the separate study and redirect keys. Those keys are independently salted and hashed. The initial redirect destination is `https://example.com`; change it under Owner Studio → Settings before using that access key.

## Production build

```sh
npm run build
```

Set `NODE_ENV=production`, set the environment variables above, and run `npm start`. Keep the service behind a local reverse proxy with HTTPS if you deliberately expose it. The backend binds to `127.0.0.1` by default. Configure a trusted proxy only when one is actually in front of the service.

## Database and files

The schema is initialized automatically from `server/schema.sql` at server start; SQLite creates the database under `data/vault.sqlite` by default. The database uses WAL mode and foreign keys. Set `DATABASE_PATH` and `UPLOAD_DIR` to private, backed-up locations as needed. Do not put either directory inside a public static directory. Upload size is limited by `MAX_UPLOAD_MB` (default 25 MB), with at most 10 files per request.

Supported extraction formats: PDF, TXT, Markdown, DOCX, and common source/text formats (C/C++, Java, Python, JavaScript/TypeScript, HTML, CSS, SQL, JSON, XML, YAML, and shell). Images and OCR are not currently supported. PDF processing extracts embedded text; scanned/image-only PDFs need OCR performed before upload. Uploads are named internally with random IDs. Original text/code is stored as extracted; chunk boundaries may overlap for retrieval, while source text is retained for reading.

The Owner Studio's Backup action downloads a JSON file containing settings, sections, document metadata, and original files. Treat this file as sensitive. Restore is not implemented in the UI; preserve a copy of the private `data` directory to recover the complete live database, session store, and uploads.

## Search behavior

Search combines SQLite FTS5 and lexical scoring, with cosine similarity over Ollama embeddings when embeddings exist. Answers use a low-temperature Ollama request with retrieved passages and an explicit instruction to stay within those passages. Source notes are displayed with an answer. This reduces unsupported answers but cannot guarantee perfect factuality; check the cited notes. The current model call is not streamed. Large collections can be re-indexed through per-note controls; Ollama embedding requests are skipped after the first unavailable-model/network error so uploads can still finish with keyword search.

## Security and limitations

- Passwords use Node's built-in scrypt with random per-password salts. Session IDs are regenerated on successful authentication and stored in a SQLite session store; the app also tracks revocation and expiry in its database.
- Cookies are HTTP-only and SameSite Strict, and become Secure in production. Mutating authenticated API requests require a session-bound CSRF token. Login/setup endpoints are rate-limited; Helmet sets security headers.
- The app defaults to loopback. No website offers absolute protection, particularly if the host is compromised, the vault is exposed to an untrusted network, or someone can use an unlocked computer. Protect the operating system, `.env`, database, uploads, and backups.
- Emergency Exit immediately locks the in-app view and can invalidate the visitor session. Browsers normally prevent JavaScript from closing tabs opened directly by the user, so forced tab closing cannot be guaranteed.
- The owner panel currently provides local file backup/export, but no in-app restore workflow. Do not treat the JSON backup as encrypted.

## Tests

```sh
npm test
```

The included tests cover one-word/abbreviation retrieval, token normalization, code text preservation through chunking, and chunk overlap. For an end-to-end check: create the owner key; set the study and redirect keys; create a section; upload a text/PDF/DOCX/code note; confirm its status; search a one-word term; ask a question and inspect sources; copy an answer; delete the note; test an incorrect key, session revocation, and the configured emergency key. Then stop Ollama and confirm keyword search remains available.

## Current scope

The implementation includes the access roles, secure session checks, first-run owner setup, owner key/redirect/session settings, sections, multi-file ingestion, PDF/DOCX/text extraction, chunking, SQLite full-text and hybrid local vector retrieval, Ollama grounded answers with source references, code/text copy, per-note re-index/delete, audit events, active session revocation, emergency lock, responsive owner and study interfaces, and private JSON export. Restore/import, OCR, streaming answers, advanced nested-section editing/reordering, and production-grade background job queues are not included.
