import * as THREE from 'three';
//import { HTMLMesh } from '../engine/engine.plugin/HTMLMesh';

export default class World {

  constructor(asset, materials, camera) {

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

    //J'ajoute ca à l'arrache, c'est très sale XD
    this.panelTuto =  new THREE.Mesh(asset.panel1.geometry, materials.materialRigid.material);
    this.panelGameover =  new THREE.Mesh(asset.panel2.geometry, materials.materialRigid.material);
    this.panelEnd =  new THREE.Mesh(asset.panel3.geometry, materials.materialRigid.material);
    this.panelTuto.position.set( 2.0, 1.5, 0 );
    this.root.add( this.panelTuto );
    this.camera = camera;
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

  update(dt, player) {
    this.root.position.copy(this.position); //on réinitialise  le niveau à la bonne position, les animtions peuvent l'avoir déplacé

    if (this.hammerTempo > 0) { //si animation de choc en cours (quand le joueur est touché, la camera vibre)
      this.hammerTempo -= dt;
      this.root.translateY(-0.1 * Math.cos(this.hammerTempo / this.hammerDuration * Math.PI / 2)); //animation sur l'axe z, 0.1 à 0
    }

    if(this.panelTuto.parent && player.positionVictualCamera.x > 1.5) {
      this.panelTuto.removeFromParent();
      this.panelTuto.geometry.dispose();
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
    this.hammerTempo = this.hammerDuration;
    const ref = new THREE.Object3D();
    this.camera.root.add(ref);
    ref.position.set(0,0,-1);
    ref.rotation.y = Math.PI/2;
    this.root.parent.add(this.panelGameover);
    this.panelGameover.matrix = ref.matrix;
    this.panelGameover.matrixWorld  = ref.matrixWorld ;
  }

  win() {  //déclenchement de l'animation de fin de partie
    const ref = new THREE.Object3D();
    this.camera.root.add(ref);
    ref.position.set(0,0,-1);
    ref.rotation.y = Math.PI/2;
    this.root.parent.add(this.panelEnd);
    this.panelEnd.matrix = ref.matrix;
    this.panelEnd.matrixWorld  = ref.matrixWorld ;
  }
};
