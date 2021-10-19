import * as THREE from 'three';
import engine from '../engine';

import MaterialMorphSkin from '../materials/materialMorphSkin';
import MaterialRigid from '../materials/materialRigid';
import MaterialMorph from '../materials/materialMorph';
import MaterialInvisible from '../materials/materialInvisible';

import Camera from '../entities/camera';
import World from '../entities/world';
import Player from '../entities/player';
import Mob from '../entities/mob';
import MobManager from '../entities/mobManager';
import TriggerManager from '../entities/triggerManager';
import SoundManager from '../entities/soundManager';

export default class Demo extends engine.View {

  init(assets) {

    this.scene = new THREE.Scene(); //instance de la scene 3D

    const materialMorphSkin = new MaterialMorphSkin(assets); //material pour les instances mobs
    const materialRigid = new MaterialRigid(assets);//material pour le decor et le joueur
    const materialMorph = new MaterialMorph(assets);//material pour les impacts
    const materialInvisible = new MaterialInvisible();//material pour les colliders

    this.materials = { materialMorphSkin, materialRigid, materialMorph, materialInvisible };

    this.camera = new Camera(1, 0.5, 2); //instance de la camera



    this.world = new World(assets.level, this.materials); //instance du niveau
    this.player = new Player(materialRigid, assets.level, materialInvisible); //instance du joueur

    this.mobManager = new MobManager(assets, this.materials, Mob);//ajoute et supprime les instances des mobs
    this.triggerManager = new TriggerManager(assets.level, this.materials, this.world); //ouverture des portes, activation des interupteurs, ramasser des clés et armes
    this.soundManager = new SoundManager(assets, this.camera);

    this.scene.add(this.world.root); //on ajoute l'object 3D du niveau à la scene
    this.scene.add(this.player.root); //on ajoute l'object 3D player à la scene

    this.mobs = []; //liste des instances de mob
  }


  update(dt) {
    this.world.update(dt);

    for (let i = 0; i < this.mobs.length; i++) {
      this.mobs[i].update(dt, this.world, this.player, this.mobs, this.soundManager); // processus des mobs
    }

    this.player.update(dt, this.controllerRight, this.controllerLeft, this.inputs, this.mobs, this.world, this.camera, this.soundManager);//processus joueur

    this.mobManager.update(dt, this.mobs, this.player, this.world); //ajoute et supprime les mobs

    this.triggerManager.update(dt, this.mobs, this.player, this.soundManager);//gestion des interupteurs et des ouvertures
  }

}
