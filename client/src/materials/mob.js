import * as THREE from 'three';
export default class materialMob {
  constructor(assets) {
    this.material = new THREE.MeshPhongMaterial({ shininess: 0, color: 0xffffff, skinning: true, morphTargets: true });
    this.material.map = assets.texture;
    this.material.lightMap = assets.textureLight;
  }
}