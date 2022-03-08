import * as THREE from 'three';
import View from '../components/view';

import MaterialMorphSkin from '../materials/materialMorphSkin';
import MaterialRigid from '../materials/materialRigid';
import MaterialMorph from '../materials/materialMorph';
import MaterialInvisible from '../materials/materialInvisible';
import MaterialPanel from '../materials/materialPanel';

import Camera from '../components/camera';
import World from '../components/world';
import Player from '../components/player';
import Mob from '../components/mob';
import MobManager from '../components/mobManager';
import TriggerManager from '../components/triggerManager';
import SoundManager from '../components/soundManager';
import ItemManager from '../components/itemManager';

export default class Demo extends View {

  init(assets) {

    this.scene = new THREE.Scene(); //instance de la scene 3D

    const materialMorphSkin = new MaterialMorphSkin(assets); //material pour les instances mobs
    const materialRigid = new MaterialRigid(assets); //material pour le décor et le joueur
    const materialMorph = new MaterialMorph(assets); //material pour les impacts
    const materialInvisible = new MaterialInvisible(); //material pour les colliders
    const materialPanel = new MaterialPanel(assets); //material pour les textes explicatifs

    this.materials = { materialMorphSkin, materialRigid, materialMorph, materialInvisible, materialPanel };

    this.camera = new Camera(0, 1.3, 0, new THREE.Vector3(10,1.3,0)); //instance de la camera

    this.world = new World(assets.level, this.materials, this.camera); //instance du niveau
    this.player = new Player(materialRigid, assets.level, materialInvisible); //instance du joueur

    this.mobManager = new MobManager(assets, this.materials, Mob); //gestionnnaire du cycle de vie des instances des mobs
    this.triggerManager = new TriggerManager(assets.level, this.materials, this.world); //gestionnnaire des ouverture des portes et activation des interupteurs
    this.soundManager = new SoundManager(assets, this.camera); //gestionnnaire des sons du du jeu
    this.itemManager = new ItemManager(assets.level, materialRigid, this.world); //gestionnnaire des items ramassables 

    this.scene.add(this.world.root); //on ajoute l'object 3D du niveau à la scene
    this.scene.add(this.player.root); //on ajoute l'object 3D player à la scene

    this.mobs = []; //liste des instances de mob

    this.soundManager.playTakeWeapon(); 
  }


  update(dt) {
    this.world.update(dt, this.player);

    for (let i = 0; i < this.mobs.length; i++) {
      this.mobs[i].update(dt, this.world, this.player, this.mobs, this.soundManager); //processus des mobs
    }

    this.player.update(dt, this.controllerRight, this.controllerLeft, this.inputs, this.mobs, this.world, this.camera, this.soundManager); //processus du joueur

    this.mobManager.update(dt, this.mobs, this.player, this.world); //ajoute et supprime les mobs
    this.triggerManager.update(dt, this.mobs, this.player, this.soundManager); //gestion des interupteurs et des ouvertures
    this.itemManager.update(dt, this.player, this.soundManager); //gestion des éléments ramassables
  }

}
