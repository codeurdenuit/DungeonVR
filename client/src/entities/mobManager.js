import * as THREE from 'three';

export default class MobManager {

  constructor(assets, materials, classMob) {
    const buffer = assets.level.spawners.geometry.attributes.position.array; //les points de cette géométrie indiquent les points de spawns
    this.spawners = []; //liste des points de spawn
    for (let i = 0; i < buffer.length; i += 3) {
      this.spawners.push(new THREE.Vector3(buffer[i], buffer[i + 1], buffer[i + 2]));
    }
    this.mobAsset = assets.mob; //asset utilisé pour créer les mobs
    this.materials = materials; //materials  utilisés pour créer les mobs
    this.classMob = classMob; //class pour instancier les mobs
  }

  update(dt, mobs, player, world) {

    for (let i = 0; i < this.spawners.length; i++) {//on vérifie la distance de chaque spawn avec le joueur
      const spawn = this.spawners[i];
      if (Math.abs(player.positionVirtual.x - spawn.x) < 10 && Math.abs(player.positionVirtual.z - spawn.z) < 10) { //si le joueur arrive à moins de 10m du spanw
        console.log('mob créé')
        const mob = new this.classMob(this.mobAsset, this.materials, spawn.x, spawn.y, spawn.z);
        world.add(mob.root)//l'object3D du mob est ajouté au niveau, pas besoin de corriger la position, le référentiel du spawn est lié au niveau et non au référentiel absolu
        mobs.push(mob); //on créé le mob et on l'ajoute à la liste des mobs
        this.spawners.splice(i, 1);//on efface ce point de spawn
        i--;
      }
    }

    for (let i = 0; i < mobs.length; i++) { //on vérifie qu'un mob n'est pas éliminé de la scene
      if (!mobs[i].root.parent) { //si un mob n'est plus affiché
        console.log('mob éliminé')
        mobs.splice(i, 1);//on efface ce mob de la liste des mobs
        i--;
      }
    }
  }

};
