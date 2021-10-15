
import loadGLTF from './loadGLTF';
import loadTexture from './loadTexture';

function load(filename) {
  if ((/\.(jpeg|png)$/i).test(filename)) {
    return loadTexture(filename);
  } else if ((/\.(glb|gltf)$/i).test(filename)) {
    return loadGLTF(filename);
  }
}

export default load;
