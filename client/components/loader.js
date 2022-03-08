import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function loadTexture(path) {
  const loaderMap = new THREE.TextureLoader();
  return new Promise((resolve) => {
    loaderMap.load(path,
      function (texture) {
        texture.flipY = false;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapNearestFilter;
        texture.generateMipmaps = true;
        resolve(texture);
      },
      undefined, function (err) {
        console.error(err);
      });
  });
}

function loadAudio(path) {
  const audioLoader = new THREE.AudioLoader();
  return new Promise((resolve) => {
    audioLoader.load(path,
      function (buffer) {
        resolve(buffer);
      }, undefined, function (e) {
        console.error(e);
      });
  });
}

function loadGLTF(path) {
  const loaderGlb = new GLTFLoader();
  return new Promise((resolve) => {
    loaderGlb.load(path,
      function (gltf) {
        const assets = {};
        function populateAsset(node) {
          const children = node.children;
          for (let i = 0; i < children.length; i++) {
            let child = children[i];
            switch (child.type) {
            case 'SkinnedMesh':
              assets[child.name] = {};
              assets[child.name].geometry = child.geometry;
              assets[child.name].skeleton = child.skeleton;
              assets[child.name].animations = gltf.animations;
              assets[child.name].geometry.setAttribute('uv2', new THREE.BufferAttribute(assets[child.name].geometry.getAttribute('uv').array, 2));//for LightMap
              break;
            case 'Mesh':
              assets[child.name] = {};
              assets[child.name].geometry = child.geometry;
              assets[child.name].geometry.name = child.name;
              if (assets[child.name].geometry.getAttribute('uv'))
                assets[child.name].geometry.setAttribute('uv2', new THREE.BufferAttribute(assets[child.name].geometry.getAttribute('uv').array, 2));//for LightMap
              if (!assets[child.name].geometry.attributes.normals) //optilisation de la taille des fichiers, les normals ne sont pas chargées mais calculées
                assets[child.name].geometry.computeVertexNormals();
              break;
            }
            if (child.type === 'Object3D') {
              populateAsset(child);
            }
          }
        }
        populateAsset(gltf.scene);
        resolve(assets);
      }, undefined, function (e) {
        console.error(e);
      });
  });
}

function load(filename) {
  if ((/\.(jpg|png)$/i).test(filename)) {
    return loadTexture(filename);
  } else if ((/\.(glb|gltf)$/i).test(filename)) {
    return loadGLTF(filename);
  } else if ((/\.(mp3)$/i).test(filename)) {
    return loadAudio(filename);
  }
}

export { load, loadTexture, loadGLTF, loadAudio };
