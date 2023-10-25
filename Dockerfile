FROM node:16 as builder

RUN mkdir /app

ADD . /app

ARG SENTRY_AUTH_TOKEN

RUN \
  cd /app \
  && sed -i~ '/^SENTRY_AUTH_TOKEN=/s/=.*/="${SENTRY_AUTH_TOKEN}"/' .env.sentry \
  && npm install \
  && make \
  && make source-package

FROM nginx:stable-alpine

RUN apk add --no-cache bash gettext

COPY --from=builder /app/jitsi-meet.tar.bz2 /

COPY docker-configs /config
COPY start-nginx.sh /
RUN \
  mkdir /config/nginx/sites \
  && tar xjf /jitsi-meet.tar.bz2 -C /config/nginx/sites \
  && mkdir /config/nginx/sites/jitsi-meet/.well-known \
  && cp /config/apple-app-site-association /config/nginx/sites/jitsi-meet/.well-known/ \
  && ln -s /config/nginx/sites/jitsi-meet/.well-known/apple-app-site-association /config/nginx/sites/jitsi-meet/apple-app-site-association \
  && chmod 0755 /start-nginx.sh

EXPOSE 80

CMD ["/start-nginx.sh"]
