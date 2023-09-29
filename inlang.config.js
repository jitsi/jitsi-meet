/**
 * @type { import("@inlang/core/config").DefineConfig }
 */
export async function defineConfig(env) {
    const { default: i18nextPlugin } = await env.$import(
        'https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@2/dist/index.js'
    );

    const { default: standardLintRules } = await env.$import(
        'https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js'
    );

    return {
        referenceLanguage: 'main',
        plugins: [
            i18nextPlugin({
                pathPattern: 'lang/{language}.json',
                ignore: [ 'languages.json', 'translation-languages.json' ]
            }),
            standardLintRules()
        ]
    };
}
