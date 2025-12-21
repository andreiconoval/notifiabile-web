// apps/teammate-web/scripts/fetch-openapi.mjs
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const OPENAPI_URL =
  process.env.OPENAPI_URL || 'https://localhost:7119/swagger/notifiable-api/swagger.json';

// allow overriding output path (default: ./openapi.json)
const outPath = process.argv[2] || 'openapi.json';
const dest = path.resolve(process.cwd(), outPath);

function fetchOpenApi(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false }); // self-signed OK (dev only!)
    https
      .get(url, { agent }, (res) => {
        const { statusCode, headers } = res;

        // handle redirects
        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          res.resume();
          return resolve(fetchOpenApi(new URL(headers.location, url).toString()));
        }

        if (statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${statusCode} while fetching ${url}`));
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

(async () => {
  try {
    const json = await fetchOpenApi(OPENAPI_URL);
    fs.writeFileSync(dest, json, 'utf8');
    console.log(`✔ Saved OpenAPI to ${dest}`);
  } catch (err) {
    console.error('✖ Failed to fetch OpenAPI:', err?.message || err);
    process.exit(1);
  }
})();
