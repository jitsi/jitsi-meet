FROM jitsi/web:stable

USER root

RUN apt-get update && apt-get -y install --reinstall build-essential && apt-get -y install curl gnupg git && curl -sL https://deb.nodesource.com/setup_lts.x | bash - && apt-get -y install nodejs

COPY . /usr/share/jitsi-meet

RUN cd /usr/share/jitsi-meet && npm install && make compile

EXPOSE 80 443

VOLUME ["/config", "/etc/letsencrypt", "/usr/share/jitsi-meet/transcripts"]
