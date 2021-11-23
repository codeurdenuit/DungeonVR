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
    this.forceFirstInstance = false; //optimisation, si la géométrie du premier mob est chargée en cours de partie, il peut y avoir un lag, je force la création d'une instance au démarrage
    delete this.mobAsset.mob.geometry.morphAttributes.normal; //on retire les normals de déformation, elles n'ont pas d'utilité et sont fausses
  }

  update(dt, mobs, player, world) {


    //optimisation, ne pas prendre en compte :)
    if(!this.forceFirstInstance) {
      const spawn = this.spawners[0]; 
      const mob = new this.classMob(this.mobAsset, this.materials, spawn.x, spawn.y, spawn.z); 
      world.add(mob.root);
      mobs.push(mob);
      this.spawners.splice(0, 1);
      this.forceFirstInstance = true;
    }

    for (let i = 0; i < this.spawners.length; i++) {//on vérifie la distance de chaque spawn avec le joueur
      const spawn = this.spawners[i];
      if (Math.abs(player.positionVirtual.x - spawn.x) < 14 && Math.abs(player.positionVirtual.z - spawn.z) < 14) { //si le joueur arrive à moins de 10m du spanw
        const mob = new this.classMob(this.mobAsset, this.materials, spawn.x, spawn.y, spawn.z); //un mob est instancié
        world.add(mob.root);//l'object3D du mob est ajouté au niveau, pas besoin de corriger la position, le référentiel du spawn est lié au niveau et non au référentiel absolu
        mobs.push(mob); //on créé le mob et on l'ajoute à la liste des mobs
        this.spawners.splice(i, 1);//on efface ce point de spawn
        i--;
      }
    }

    for (let i = 0; i < mobs.length; i++) { //on vérifie qu'un mob n'est pas éliminé de la scene
      if (!mobs[i].root.parent) { //si un mob n'est attaché à la scène (il est donc éliminé)
        mobs.splice(i, 1); //on efface ce mob de la liste des mobs
        i--;
      }
    }



  }

};
