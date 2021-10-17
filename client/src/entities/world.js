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

    this.position = new THREE.Vector3();//position du niveau

    this.hammerTempo = 0;//progression de l'animation de choc
    this.hammerDuration = 0.2;//durée d'animation de choc
    this.deadTempo = 0;//progression de l'animation de fin de partie
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

  update(dt) {
    this.root.position.copy(this.position);//on replace le niveau à la bonne position, les animtions peuvent l'avoir déplacé

    if(this.hammerTempo>0) { //si animation de choc en cours
      this.hammerTempo -= dt;
      this.root.translateY(-0.1*Math.cos(this.hammerTempo/this.hammerDuration*Math.PI/2)); //animation sur l'axe z, 0.1 à 0
    }

    if(this.deadTempo>0) { //si animation de fin de partie
      this.deadTempo -= dt;
      this.position.y = 1.3*(1-this.deadTempo/this.hammerDuration); //animation sur l'axe z, 0 à -1.3
    }
  }

  setPos(position) {//positionnement relatif du niveau par rapport au joueur
    this.position.set(-position.x, -position.y, -position.z);//mise à jour de la position du niveau
    this.root.position.set(-position.x, -position.y, -position.z);//on déplace les meshs et les éléments enfants
    this.collider.position.set(-position.x, -position.y, -position.z);//on déplace le collider du sol
    this.root.updateWorldMatrix();
    this.collider.updateWorldMatrix();  //mise à jour de la matrice world pour les détecteurs de collision susceptible de l'utiliser
  }

  startHammer() { //déclenchement de l'animation de choc
    this.hammerTempo = this.hammerDuration;
  }

  gameover() {  //déclenchement de l'animation de fin de partie
    this.deadTempo = this.hammerDuration;
  }
};
