import * as THREE from 'three';

export default class Camera {

  constructor(x, y, z, target) {
    this.root = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 30); //création de l'objet camera
    this.root.position.set(x, y, z); //initialisation de la position de la camera

  }

  getPositionX() {
    return this.root.matrixWorld.elements[12]; //la camera est déplacée par le casque VR, on peut récupèrer la position absolue de l'axe X
  }

  getPositionZ() {
    return this.root.matrixWorld.elements[14]; //la camera est déplacée par le casque VR, on récupère la position absolue de l'axe Z
  }
};
