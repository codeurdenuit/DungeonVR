import * as THREE from 'three';

export default class World {

  constructor(asset, materials) {

    this.root = new THREE.Object3D(); //objet 3D racine de cette instance, c'est lui qui est ajouté à la scene

    for (let name in asset) {
      if (name.includes('world')) {
        const worldPart = new THREE.Mesh(asset[name].geometry, materials.materialRigid.material); //mesh d'une zone de décor
        this.root.add(worldPart); //ajout de chaque zone à l'objet racine du décor
      }
    }

    this.colliderMaster = new THREE.Mesh(asset.colliderMaster.geometry, materials.materialInvisible.material); //création du collider principal
    this.mobilesColliders = []; //liste des colliders déplaçables

    for (let name in asset) {
      if (name.includes('collider_')) { //ajout des colliders dynamiques
        const collider = new THREE.Mesh(asset[name].geometry, materials.materialInvisible.material);
        this.colliderMaster.add(collider); //ajout des colliders dynamiques au collider master
        this.mobilesColliders[name] = collider; //pour les rendre accessibles aux autres instances
      }
    }

    //this.root.add(new THREE.AmbientLight(0x999999 /*0x000000*/)); //lumière minimum

    this.position = new THREE.Vector3(); //position du niveau
    this.hammerTempo = 0; //progression de l'animation de choc
    this.hammerDuration = 0.2; //durée d'animation de choc
    this.deadTempo = 0; //progression de l'animation de fin de partie
  }

  add(list) { //ajouter un élément enfant au niveau
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
    this.root.position.copy(this.position); //on réinitialise  le niveau à la bonne position, les animtions peuvent l'avoir déplacé

    if (this.hammerTempo > 0) { //si animation de choc en cours (quand le joueur est touché, la camera vibre)
      this.hammerTempo -= dt;
      this.root.translateY(-0.1 * Math.cos(this.hammerTempo / this.hammerDuration * Math.PI / 2)); //animation sur l'axe z, 0.1 à 0
    }

    if (this.deadTempo > 0) { //si animation de fin de partie
      this.deadTempo -= dt;
      this.position.y = 1.3 * (1 - this.deadTempo / this.hammerDuration); //animation sur l'axe z, 0 à -1.3
    }
  }

  setPos(position) { //positionnement relatif du niveau par rapport au joueur
    this.position.set(-position.x, -position.y, -position.z); //mise à jour de la position du niveau
    this.root.position.set(-position.x, -position.y, -position.z); //on déplace les meshs et les éléments enfants
    this.colliderMaster.position.set(-position.x, -position.y, -position.z); //on déplace le collider du sol
    this.colliderMaster.updateWorldMatrix(false, true);  //mise à jour de la matrice world pour les détecteurs de collision susceptibles de l'utiliser
  }

  startHammer() { //déclenchement de l'animation de choc
    this.hammerTempo = this.hammerDuration;
  }

  gameover() {  //déclenchement de l'animation de fin de partie
    this.deadTempo = this.hammerDuration;
  }
};
