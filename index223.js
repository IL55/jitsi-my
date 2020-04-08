let role = 'user';


const wait = (seconds) =>
  new Promise(res => setTimeout(res, seconds * 1000));

const options = {
  hosts: {
    // XMPP domain.
    domain: 'meet.jitsi',
    muc: 'muc.meet.jitsi',
  },

  // BOSH URL. FIXME: use XEP-0156 to discover it.
  bosh: 'http-bind',

  // The name of client node advertised in XEP-0115 'c' stanza
  clientNode: 'http://jitsi.org/jitsimeet'
};

const confOptions = {
  openBridgeChannel: true
};

// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
const initOptions = {
  disableAudioLevels: true,

  // The ID of the jidesha extension for Chrome.
  // desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',
  desktopSharingChromeExtId: null,

  // Whether desktop sharing should be disabled on Chrome.
  desktopSharingChromeDisabled: false,

  // The media sources to use when using screen sharing with the Chrome
  // extension.
  desktopSharingChromeSources: ['screen', 'window', 'tab'],

  // Required version of Chrome extension
  desktopSharingChromeMinExtVersion: '0.1',

  // Whether desktop sharing should be disabled on Firefox.
  // desktopSharingFirefoxDisabled: true
};

JitsiMeetJS.init(initOptions);
JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
let remoteTracks = {};

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks) {
  localTracks = tracks;
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
      audioLevel => console.log(`Audio Level local: ${audioLevel}`));
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
      () => console.log('local track muted'));
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
      () => console.log('local track stoped'));
    localTracks[i].addEventListener(
      JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
      deviceId =>
        console.log(
          `track audio output device was changed to ${deviceId}`));
    if (localTracks[i].getType() === 'video') {
      $('body').append(`
        <div>
          <div>
            local video ${role}
          </div>
          <video style="width: 100px;" autoplay='1' id='localVideo${i}' />
        </div>
      `);
      localTracks[i].attach($(`#localVideo${i}`)[0]);
    } else {
      $('body').append(
        `<audio autoplay='1' muted='true' id='localAudio${i}' />`);
      localTracks[i].attach($(`#localAudio${i}`)[0]);
    }
    if (isJoined) {
      room.addTrack(localTracks[i]);
    }
  }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
  if (track.isLocal()) {
    return;
  }
  const participant = track.getParticipantId();
  const displayName = room.getParticipantById(participant).getDisplayName();
  if (displayName !== 'presenter') {
    return;
  }

  if (!remoteTracks[participant]) {
    remoteTracks[participant] = [];
  }
  const idx = remoteTracks[participant].push(track);

  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
    audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
  track.addEventListener(
    JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
    () => console.log('remote track muted'));
  track.addEventListener(
    JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
    () => console.log('remote track stoped'));
  track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
    deviceId =>
      console.log(
        `track audio output device was changed to ${deviceId}`));

  const divId = participant + track.getType() + idx;



  if (track.getType() === 'video') {
    const width = displayName === 'presenter' ? 300 : 100;
    const videoDiv = `
      <div class='${participant}'>
        <div>
          Remote video from ${displayName}
        </div>
        <video style="width: ${width}px;" autoplay='1' id='${divId}' />
      </div>
    `;
    if (displayName === 'presenter') {
      $('body').append(videoDiv);
    } else {
      $('body').append(videoDiv);
    }
  } else {
    $('body').append(
      `<audio autoplay='1' id='${divId}' />`);
  }

  track.attach($(`#${divId}`)[0]);
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined() {
  console.log('conference joined!');
  isJoined = true;
  for (let i = 0; i < localTracks.length; i++) {
    room.addTrack(localTracks[i]);
  }
}

/**
 *
 * @param id
 */
function onUserLeft(id) {
  console.log('user left');
  if (!remoteTracks[id]) {
    return;
  }
  const tracks = remoteTracks[id];

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].detach($(`#${id}${tracks[i].getType()}`));
  }
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess() {
  room = connection.initJitsiConference('conference', confOptions);
  room.setDisplayName(role);
  room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
  room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
    const participant = track.getParticipantId();
    $(`.${participant}`).remove();
    console.log(`track removed!!!${track}`);
  });
  room.on(
    JitsiMeetJS.events.conference.CONFERENCE_JOINED,
    onConferenceJoined);
  room.on(JitsiMeetJS.events.conference.USER_JOINED, (id, user) => {
    console.log('user join', id, user.getDisplayName());
    remoteTracks[id] = [];
  });
  room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
  room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
    console.log(`${track.getType()} - ${track.isMuted()}`);
  });
  room.on(
    JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
    (userID, displayName) => console.log(`${userID} - ${displayName}`));
  room.on(
    JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
    (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
  room.on(
    JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
    () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));
  room.join();
}

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed() {
  console.error('Connection Failed!');
}

/**
 * This function is called when the connection fail.
 */
function onDeviceListChanged(devices) {
  console.info('current devices', devices);
}

/**
 * This function is called when we disconnect.
 */
function disconnect() {
  console.log('disconnect!');
  if (!connection) {
    return;
  }
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
  connection.removeEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);
}

/**
 *
 */
function unload() {
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].dispose();
  }
  localTracks = [];
  if (room) {
    room.leave();
    room = null;
  }

  if (connection) {
    connection.disconnect();
    connection = null;
  }
  remoteTracks = {};
  isJoined = false;
}

let isVideo = true;

/**
 *
 */
function switchVideo() { // eslint-disable-line no-unused-vars
  isVideo = !isVideo;
  if (localTracks[1]) {
    localTracks[1].dispose();
    localTracks.pop();
  }
  JitsiMeetJS.createLocalTracks({
    devices: [isVideo ? 'video' : 'desktop']
  })
    .then(tracks => {
      localTracks.push(tracks[0]);
      localTracks[1].addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('local track muted'));
      localTracks[1].addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('local track stoped'));
      localTracks[1].attach($('#localVideo1')[0]);
      room.addTrack(localTracks[1]);
    })
    .catch(error => {
      console.log(error);
    });
}

/**
 *
 * @param selected
 */
function changeAudioOutput(selected) { // eslint-disable-line no-unused-vars
  JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

const startAsPresenter = async () => {
  console.log('Start as presenter');
  role = 'presenter';
  unload();
  await wait(1);
  main();
}

const startAsUser = async () => {
  console.log('Start as user');
  role = 'user';
  unload();
  await wait(1);
  main();
}


const main = async () => {
  $(window).bind('beforeunload', unload);
  $(window).bind('unload', unload);

  connection = new JitsiMeetJS.JitsiConnection(null, null, options);

  connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
    onConnectionSuccess);
  connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_FAILED,
    onConnectionFailed);
  connection.addEventListener(
    JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
    disconnect);

  JitsiMeetJS.mediaDevices.addEventListener(
    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
    onDeviceListChanged);

  connection.connect();

  if (role !== 'presenter') {
    return;
  }

  const tracks = await JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] });
  onLocalTracks(tracks);

  if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
      const audioOutputDevices
        = devices.filter(d => d.kind === 'audiooutput');

      if (audioOutputDevices.length > 1) {
        $('#audioOutputSelect').html(
          audioOutputDevices
            .map(
              d =>
                `<option value="${d.deviceId}">${d.label}</option>`)
            .join('\n'));

        $('#audioOutputSelectWrapper').show();
      }
    });
  }
}