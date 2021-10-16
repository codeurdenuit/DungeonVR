import * as THREE from 'three';
import engine from '../engine';

import MaterialMob from '../materials/mob';
import MaterialWorld from '../materials/world';

import Camera from '../entities/camera';
import World from '../entities/world';
import Player from '../entities/player';
import Mob from '../entities/mob';

export default class Demo extends engine.View {

  init(assets) {

    this.scene = new THREE.Scene(); //instance de la scene 3D

    this.materialMob = new MaterialMob(assets); //material pour les instances mobs
    this.materialWorld = new MaterialWorld(assets);//material pour le decor et le joueur

    this.world = new World(assets.level, this.materialWorld.material); //instance du niveau
    this.camera = new Camera(1, 0.5, 2); //instance de la camera
    this.player = new Player(this.materialWorld.material); //instance du joueur

    this.mobs = [ //instances des mobs
      new Mob(assets.mob, this.materialMob.material, 5, 0, 0, this.materialWorld.material)
    ]

    this.scene.add(this.world.root); //on ajoute l'object 3D du niveau à la scene
    this.world.add(this.mobs.map(m => m.root)); //on ajoute les objects 3D mobs au niveau, leur referentiel  est l'espace niveau
    this.scene.add(this.player.root); //on ajoute l'object 3D player à la scene
  }



  update(dt) {
    for (let i = 0; i < this.mobs.length; i++) {
      this.mobs[i].update(dt, this.world, this.player); // processus des mobs
    }

    this.camera.root.lookAt(this.mobs[0].root.position); //Seulement si pas de casque

    this.player.update(dt, this.controllerRight, this.controllerLeft, this.inputs, this.mobs, this.world, this.camera);//processus joueur
  }

}
