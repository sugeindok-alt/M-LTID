import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
try {
  for (const name of await readdir('.local/mail'))
    if (name.endsWith('.html')) console.log(resolve('.local/mail', name));
} catch {
  console.log('Ingen lokale e-postar. EMAIL_TRANSPORT=file er berre for lokal utvikling.');
}
