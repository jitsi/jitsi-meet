export * from './constants';
export * from './functions';

// TODO Eventually (e.g. when the non-React Web app is rewritten into React), it
// should not be necessary to export i18next.
export { default as i18next } from './i18next';

import './middleware';
