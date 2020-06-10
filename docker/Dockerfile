ARG JITSI_REPO=jitsi
ARG JITSI_GIT_REPO=https://github.com/jitsi/jitsi-meet.git
ARG JITSI_GIT_REF=HEAD

FROM node:12 as builder

ARG JITSI_GIT_REPO
ARG JITSI_GIT_REF

WORKDIR /src

RUN \
    git clone $JITSI_GIT_REPO && \ 
    cd jitsi-meet && \
    git reset --hard $JITSI_GIT_REF && \
    npm install && \
    make

FROM ${JITSI_REPO}/base

RUN \
	apt-dpkg-wrap apt-get update && \
	apt-dpkg-wrap apt-get install -y nginx-extras && \
	apt-cleanup && \
	rm -f /etc/nginx/conf.d/default.conf

COPY rootfs/ /
COPY --from=builder /src/jitsi-meet/libs /usr/share/jitsi-meet/libs
COPY --from=builder /src/jitsi-meet/static /usr/share/jitsi-meet/static
COPY --from=builder /src/jitsi-meet/sounds /usr/share/jitsi-meet/sounds
COPY --from=builder /src/jitsi-meet/fonts /usr/share/jitsi-meet/fonts
COPY --from=builder /src/jitsi-meet/images /usr/share/jitsi-meet/images
COPY --from=builder /src/jitsi-meet/lang /usr/share/jitsi-meet/lang
COPY --from=builder /src/jitsi-meet/connection_optimization /usr/share/jitsi-meet/connection_optimization
COPY --from=builder /src/jitsi-meet/css/all.css /usr/share/jitsi-meet/css/
COPY --from=builder /src/jitsi-meet/resources/*.sh /usr/share/jitsi-meet/scripts/
COPY --from=builder /src/jitsi-meet/*.html /usr/share/jitsi-meet/
COPY --from=builder /src/jitsi-meet/*.ico /usr/share/jitsi-meet/
COPY --from=builder /src/jitsi-meet/resources/robots.txt /usr/share/jitsi-meet/

ENV XMPP_BOSH_URL_BASE=https://meet.jit.si
ENV XMPP_DOMAIN=meet.jit.si

EXPOSE 8000

VOLUME ["/config"]
