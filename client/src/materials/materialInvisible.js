import * as THREE from 'three';
export default class materialInvisible {
  constructor() {
    this.material = new THREE.MeshLambertMaterial({ color: 0xffffff, visible: false });
  }
}