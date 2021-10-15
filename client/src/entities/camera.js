import * as THREE from 'three';

export default class Camera {

  constructor(x, y, z, target) {
    this.root = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); //creation de l'object camera
    this.root.position.set(x, y, z); //initialisation de la position

  }

  getPositionX() {
    return this.root.matrixWorld.elements[12]; //La camera est déplacée par le casque VR, on récupère la position absolue
  }

  getPositionZ() {
    return this.root.matrixWorld.elements[14]; //La camera est déplacée par le casque VR, on récupère la position absolue
  }


};
