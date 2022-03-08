import * as THREE from 'three';
export default class materialMorphSkin {
  constructor(assets) {
    this.material = new THREE.MeshPhongMaterial({ shininess: 0, color: 0xffffff});
    this.material.map = assets.texture;
    this.material.lightMap = assets.textureLight;
  }
}