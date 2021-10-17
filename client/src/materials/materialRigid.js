import * as THREE from 'three';

export default class materialRigid {
  constructor(assets) {
    this.material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 0 });
    this.material.map = assets.texture;
    this.material.lightMap = assets.textureLight;
  }
}