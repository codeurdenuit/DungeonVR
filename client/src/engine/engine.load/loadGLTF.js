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
                assets[child.name].geometry.setAttribute('uv2', new THREE.BufferAttribute(assets[child.name].geometry.getAttribute("uv").array, 2));//for LightMap
                break;
              case 'Mesh':
                assets[child.name] = {};
                assets[child.name].geometry = child.geometry;
                assets[child.name].geometry.name = child.name;
                if (assets[child.name].geometry.getAttribute("uv"))
                  assets[child.name].geometry.setAttribute('uv2', new THREE.BufferAttribute(assets[child.name].geometry.getAttribute("uv").array, 2));//for LightMap
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

export default loadGLTF;
