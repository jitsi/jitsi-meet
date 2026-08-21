import {defineConfig} from '@eloqnt/cli';

export default defineConfig({
  messages: {
    path: {
      source: './lang/main',
      targets: './lang/main-{locale}'
    },
    locales: 'infer',
    sourceLocale: 'en',
    format: {
      codec: '@eloqnt/format-i18next-json',
      extension: '.json'
    }
  },
  lint: {
    overrides: [
      {
        // Occitan has no CLDR data in Node's Intl runtime, so its locale
        // code can't be validated
        locales: ['oc'],
        rules: {'invalid-locale': 'off'}
      }
    ]
  }
});
