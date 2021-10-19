import * as THREE from 'three';
const loaderMap = new THREE.TextureLoader();

function loadTexture(path) {
  return new Promise((resolve, reject) => {
    loaderMap.load(path,
      function (texture) {
        texture.flipY = false;

        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapNearestFilter;
        texture.generateMipmaps = true;

        ///texture.magFilter = THREE.NearestFilter;
        //texture.minFilter = THREE.NearestFilter
        //texture.generateMipmaps = false;

        ///texture.sRGBEncoding = THREE.LinearEncoding;
        //texture.sRGBEncoding = THREE.RGBDEncoding;
        //texture.sRGBEncoding = THREE.sRGBEncoding;

        resolve(texture);
      },
      undefined, function (err) {
        console.error(err);
      });
  });
}

export default loadTexture;