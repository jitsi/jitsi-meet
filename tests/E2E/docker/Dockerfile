ARG JITSI_IMAGE_REPO=ghcr.io/jitsi
ARG JITSI_IMAGE_VERSION=stable-11248-3

FROM node:24-bookworm AS build
WORKDIR /src
COPY . .
RUN npm ci --no-audit --no-fund
RUN make

# Match the web package's asset layout while retaining Docker's generated config.
RUN mkdir -p /assets/css /assets/scripts \
    && cp -a *.html libs static sounds fonts images lang pwa-worker.js manifest.json /assets/ \
    && cp css/all.css /assets/css/ \
    && cp resources/robots.txt /assets/ \
    && cp resources/*.sh /assets/scripts/ \
    && node -e 'const fs = require("fs"); \
        for (const lang of Object.keys(require("./lang/languages.json"))) { \
            const dir = "node_modules/i18n-iso-countries/langs/"; \
            const file = [lang, lang.slice(0, 2)].map(x => dir + x + ".json").find(x => fs.existsSync(x)); \
            if (file) fs.copyFileSync(file, "/assets/lang/countries-" + lang + ".json"); \
        }' \
    && chmod -R a+rX /assets

FROM ${JITSI_IMAGE_REPO}/web:${JITSI_IMAGE_VERSION}
ARG SOURCE_COMMIT
LABEL org.opencontainers.image.revision=${SOURCE_COMMIT}
LABEL org.opencontainers.image.source="https://github.com/jitsi/jitsi-meet"
USER root
COPY --from=build /assets/ /usr/share/jitsi-meet/
COPY --from=build --chmod=644 /src/interface_config.js /defaults/interface_config.js
RUN printf '%s\n' "${SOURCE_COMMIT}" > /usr/share/jitsi-meet/source-revision.txt
USER s6
