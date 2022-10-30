import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const pJson = require('../../package.json');

export const { version }: { version: string } = pJson;
