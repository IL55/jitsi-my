FROM jitsi/web

COPY index223.html index223.js /usr/share/jitsi-meet/
COPY libs/jquery-2.1.1.min.js libs/jquery-2.1.1.min.map /usr/share/jitsi-meet/libs/
RUN mkdir -p /usr/share/jitsi-meet/libs/strophe
COPY libs/strophe/strophe.disco.min.js libs/strophe/strophe.js libs/strophe/strophe.min.js /usr/share/jitsi-meet/libs/strophe/
