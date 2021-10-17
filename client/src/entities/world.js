import * as THREE from 'three';

export default class World {

  constructor(asset, materials) {

    this.root = new THREE.Object3D(); //Object 3D racine de cette instance

    this.world01 = new THREE.Mesh(asset.collider_test.geometry, materials.materialRigid.material);  //mesh de test
    //this.world01 = new THREE.Mesh(asset.world1.geometry, materials.materialRigid.material);  //mesh de la première zone du décor
    //this.world02 = new THREE.Mesh(asset.world2.geometry, materials.materialRigid.material);  //mesh de la deuxième zone du décor
    //this.world03 = new THREE.Mesh(asset.world3.geometry, materials.materialRigid.material); //mesh de la troisième zone du décor
    //this.world04 = new THREE.Mesh(asset.world4.geometry, materials.materialRigid.material); //mesh de la quatrième zone du décor

    //this.collider = new THREE.Mesh(asset.collider.geometry, materials.materialInvisible.material); //création du collider
    this.collider = new THREE.Mesh(asset.collider_test.geometry, materials.materialInvisible.material); //création du collider de test
    this.colliders = [this.collider]; //liste des collider du niveau, future optimisations possibles

    this.root.add(new THREE.AmbientLight(0x999999 /*0x000000*/)); //lumière minimum
    this.root.add(this.world01);
    //this.root.add(this.world02);
    //this.root.add(this.world03);
    //this.root.add(this.world04);

  }

  add(list) {//ajouter un élément enfant au niveau
    if (Array.isArray(list)) { //si liste d'éléments
      for (let i = 0; i < list.length; i++) {
        this.root.add(list[i]);
      }
      return;
    }
    for (let i = 0; i < arguments.length; i++) {
      this.root.add(arguments[i]);
    }
  }

  setPos(position) {//positionnement relatif du niveau par rapport au joueur
    this.root.position.set(-position.x, -position.y, -position.z);//on déplace les meshs et les éléments enfants
    this.collider.position.set(-position.x, -position.y, -position.z);//on déplace le collider du sol
    this.root.updateWorldMatrix();
    this.collider.updateWorldMatrix();  //mise à jour de la matrice world pour les détecteurs de collision susceptible de l'utiliser
  }

};
