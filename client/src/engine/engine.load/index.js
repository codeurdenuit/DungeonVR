
import loadGLTF from './loadGLTF';
import loadTexture from './loadTexture';
import loadAudio from './loadAudio';

function load(filename) {
  if ((/\.(jpeg|png)$/i).test(filename)) {
    return loadTexture(filename);
  } else if ((/\.(glb|gltf)$/i).test(filename)) {
    return loadGLTF(filename);
  } else if ((/\.(mp3)$/i).test(filename)) {
    return loadAudio(filename);
  }
}

export default load;
