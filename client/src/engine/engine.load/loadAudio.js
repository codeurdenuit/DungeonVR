import * as THREE from 'three';
const audioLoader = new THREE.AudioLoader();

function loadAudio(path) {
  return new Promise((resolve, reject) => {
    audioLoader.load(path,
      function (buffer) {
        resolve(buffer);
      }, undefined, function (e) {
        console.error(e);
      });
  });
}

export default loadAudio;
