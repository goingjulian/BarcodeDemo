feather.replace();
const controls = document.querySelector('.controls');
const cameraOptions = document.querySelector('.video-options>select');
const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const screenshotImage = document.querySelector('img');
const barcodes = document.querySelector('ul.barcodes');
const buttons = [...controls.querySelectorAll('button')];

const beep = new Audio('beep.mp3');

const constraints = {
  video: {
    width: {
      min: 1280,
      ideal: 1920,
      max: 2560,
    },
    height: {
      min: 720,
      ideal: 1080,
      max: 1440
    },
    facingMode: 'environment'
  }
};

let streamStarted = false;
let interval;

const [play, pause] = buttons;

// pause.onclick = () => clearInterval(interval);

function start() {
  if (streamStarted) {
    video.play();
    play.classList.add('d-none');
    pause.classList.remove('d-none');
    return;
  }
  if (featuresSupportedByBrowser()) {
    const updatedConstraints = {
      ...constraints,
      deviceId: {
        exact: cameraOptions.value
      }
    };
    startStream(updatedConstraints);
  }
};

async function startStream() {
  if (featuresSupportedByBrowser()) {
    await getCameraSelection();
    const mediaStream = await openStream();
    const mediaStreamTrack = mediaStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(mediaStreamTrack);
    scanForBarcodes(imageCapture);
  }
}

function scanForBarcodes(imageCapture) {
  const barcodeDetector = new BarcodeDetector({ formats: ['code_39', 'codabar', 'ean_13', 'qr_code', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'data_matrix', 'ean_13', 'ean_8', 'itf', 'pdf417'] });
  interval = setInterval(async () => {
    // console.log('SCAN')
    const photo = await imageCapture.grabFrame();
    // canvas.width = photo.width;
    // canvas.height = photo.height;
    // canvas.getContext('2d').drawImage(photo, 0, 0);

    const result = await barcodeDetector.detect(photo);
    console.log("length = " + result.length)
    if (result.length > 0) {
      beep.play();
      result.forEach(barcode => barcodes.innerHTML = `<li>${barcode}`);
    }
  }, 500);
}

function featuresSupportedByBrowser() {
  return 'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices &&
    'BarcodeDetector' in window
}

async function getCameraSelection() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === 'videoinput');
  const options = videoDevices.map(videoDevice => {
    return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
  });
  cameraOptions.innerHTML = options.join('');
};

async function openStream() {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  handleStream(stream);
  return stream;
}

function handleStream(stream) {
  video.srcObject = stream;
  play.classList.add('d-none');
  // pause.classList.remove('d-none');
  streamStarted = true;
};

start();