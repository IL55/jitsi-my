FROM jitsi/web

COPY index223.html index223.js /usr/share/jitsi-meet/
COPY libs/jquery-2.1.1.min.js libs/jquery-2.1.1.min.map /usr/share/jitsi-meet/libs/
