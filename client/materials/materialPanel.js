import * as THREE from 'three';

export default class materialRigid {
  constructor(assets) {
    this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.material.map = assets.texture;
  }
}
