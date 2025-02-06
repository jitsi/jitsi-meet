/* eslint-disable */
const { config } = require("@internxt/css-config");

module.exports = {
    ...config,
    important: true,
    content: [...config.content, "./node_modules/@internxt/ui/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
    corePlugins: {
        preflight: false,
    },
};
