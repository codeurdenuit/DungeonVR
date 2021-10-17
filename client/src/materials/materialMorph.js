import * as THREE from 'three';
export default class materialBlood {
  constructor(assets) {
    this.material = new THREE.MeshPhongMaterial({ shininess: 30, morphTargets: true });
    this.material.map = assets.texture;
    this.material.lightMap = assets.textureLight;
  }
}