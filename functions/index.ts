// Deployment entry point. The platform injects ./_qoder/storage.mjs at publish time,
// so this file only runs in the deployed runtime; local checks exercise handler.mjs
// against a credential-free fake from dev/.
import { storage } from './_qoder/storage.mjs';
import { createAppHandler } from './handler.mjs';

Deno.serve(createAppHandler({ storage }));
