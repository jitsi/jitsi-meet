import config from '@internxt/css-config';

export default {
    ...config,
    important: true,
    content: [
        './node_modules/@internxt/ui/dist/**/*.{js,ts,jsx,tsx}',
        './react/**/*.{js,ts,jsx,tsx}'
    ],
    corePlugins: {
        preflight: true,
    },
};
