## install

npm install

## start

npm start

## setup proxy

export WEBPACK_DEV_SERVER_PROXY_TARGET=https://localhost:8443

## build docker

docker build -t docker-jitsi-meet_web .
docker tag 4b2bdf3daec8 igor55555/docker-jitsi-meet_web:with223
docker push igor55555/docker-jitsi-meet_web:with223


## replace image to new one
https://github.com/jitsi/docker-jitsi-meet/blob/master/docker-compose.yml

replace
  `image: jitsi/web`
to

  `image: igor55555/docker-jitsi-meet_web:with223`