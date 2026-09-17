// .next/standalone/server.js never loads .env* files itself (and chdir's into
// .next/standalone on startup), so without this, NEXTAUTH_SECRET/DATABASE_URL/etc
// are all undefined at runtime. Load them from the project root first, the same
// way `next start` does internally, before handing off to the standalone server.
const { loadEnvConfig } = require('@next/env')

loadEnvConfig(process.cwd())

require('../.next/standalone/server.js')
