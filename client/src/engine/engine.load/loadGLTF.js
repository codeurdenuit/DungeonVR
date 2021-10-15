import * as THREE from 'three';
import { GLTFLoader } from '../engine.plugin/plugin.gltf-loader';
const loaderGlb = new GLTFLoader();

function loadGLTF(path) {
  return new Promise((resolve, reject) => {
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
                break;
              case 'Mesh':
                assets[child.name] = {};
                assets[child.name].geometry = child.geometry;
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

export default loadGLTF;
