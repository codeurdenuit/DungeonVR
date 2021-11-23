import * as THREE from 'three';


const machinery = [
  { door: { mesh: 'door1', x: 19, y: 0.54, z: 0, action: 'translateZ', value: -1, duration: 2 }, trigger: { mesh: 'trigger1', x: 21.97, y: 0, z: 0 }, collider: 'collider_1', audio: 'playOpen1' },
  { door: { mesh: 'door2', x: 43.6, y: -6.5, z: -8.8, action: 'rotateY', value: -Math.PI * 2 / 3, duration: 3 }, trigger: { mesh: 'trigger1', x: 44.65, y: -6.517, z: 7.5 }, collider: 'collider_2', audio: 'playOpen3' },
  { door: { mesh: 'door3', x: 53.63, y: -4.85, z: -15, action: 'translateY', value: 2, duration: 2 }, trigger: { mesh: 'trigger1', x: 40, y: -6.6, z: -19 }, collider: 'collider_3', audio: 'playOpen1' },
  { door: { mesh: 'door4', x: 76.886, y: -11.1, z: 24.43, action: 'rotateY', value: Math.PI * 2 / 3, duration: 3 }, trigger: { mesh: null, x: 75.991, y: -15.932, z: 19.135 }, collider: 'collider_4', audio: 'playOpen2' },
  { trigger: { mesh: 'treasure', x: 98.133, y: -17.958, z: 64.972 }, collider: 'collider_1', audio: 'playOpen1' }
];

export default class TriggerManager {

  constructor(assets, materials, world) {

    const materialMorph = materials.materialMorph.material;
    const materialRigid = materials.materialRigid.material;

    this.doors = []; //liste des meshs animé (portes et passages)
    this.triggers = []; //liste des interrupteurs
    this.colliders = []; //liste des surfaces de déplacements dynamiques
    this.animations = []; //list des animations d'ouverture de portes et passages

    for (let i = 0; i < machinery.length; i++) { //on parcourt l'objet de configuration
      const doorConf = machinery[i].door;
      const triggerConf = machinery[i].trigger;

      if(doorConf) { //si géométrie de porte
        const door = new THREE.Mesh(assets[doorConf.mesh].geometry, materialRigid); //instancee du mesh de la porte ou passage
        door.position.set(doorConf.x, doorConf.y, doorConf.z); //positionnement dans le décor
        world.add(door); //ajout au décor
        this.doors.push(door);
      } else {
        this.doors.push(null);
      }

      if (triggerConf.mesh) { //si l'interrupteur a une géométrie
        const trigger = new THREE.Mesh(assets[triggerConf.mesh].geometry, materialMorph.clone()); //instancee du mesh de l'interrupteur
        trigger.userData.enabled = false;  //interrupteur non activé
        trigger.position.set(triggerConf.x, triggerConf.y, triggerConf.z); //positionnement dans le décor
        world.add(trigger); //ajout au décor
        this.triggers.push(trigger);
      } else { //si l'interrupteur est invisible
        const trigger = new THREE.Object3D();  //cet interrupteur s'active simplement si le joueur est dans une zone proche de celui-ci
        trigger.userData.enabled = false;
        trigger.position.set(triggerConf.x, triggerConf.y, triggerConf.z);
        world.add(trigger);
        this.triggers.push(trigger);
      }

      const collider = world.mobilesColliders[machinery[i].collider];
      collider.position.y = -10; //par défaut, les surfaces dynamiques de déplacement sont déplacée pour bloquer le passage du joueur
      this.colliders.push(collider);
    
      if(doorConf) //ajout des animations à déclencher lors de l'activation d'une porte ou d'un passage
        this.animations.push({ duration: doorConf.duration, tempo: 0, action: doorConf.action, value: doorConf.value, audio: machinery[i].audio });
      else //ajout d'un son à déclencher lors de l'activation d'une porte ou d'un passage
        this.animations.push({ audio: machinery[i].audio });
    }
  }

  update(dt, mobs, player, soundManager) {
    this.triggerProcess(player, soundManager); //processus des interrupteurs 
    this.updateAnimations(dt); //processus des animations
  }

  triggerProcess(player, soundManager) {
    for (let i = 0; i < this.triggers.length; i++) { //pour chaque interrupteur du niveau
      if (this.triggers[i].userData.enabled) continue;  //si déjà activé, on ignor l'interrupteur
      const distance = player.getDistance(this.triggers[i].position); //distance entre le joueur et l'interrupteur
      if (distance < 4) { //si joueur à coté de l'interrupteur
        if (player.raycasterHand.intersectObjects([this.triggers[i]]).length) { //si le joueur touche l'interrupteur
          this.trigger(i); //activation d'un interrupteur 
          soundManager[this.animations[i].audio]();
        } else if (this.triggers[i].type === 'Object3D') { //si interrupteur, il s'active automatiquement 
          this.trigger(i); //activation d'un interrupteur 
          soundManager[this.animations[i].audio]();
        }
      }
    }
  }

  trigger(i) { //activation d'un interrupteur 
    this.triggers[i].userData.enabled = true;
    this.colliders[i].position.y = 0; //la surface dynamique de déplacement est placée de façon à laisser le joueur passer.
    if(this.animations[i].duration) //si durée d'animation d'ouverture du passage
     this.animations[i].tempo = this.animations[i].duration;
    if(!this.doors[i]) window.location.reload(); //si pas de géométrie, fin de la partie (c'est vraiment fait à l'arrache)
  }


  updateAnimations(dt) {
    for (let i = 0; i < this.animations.length; i++) { //pour chaque animation en cours de fonctionnement 
      const anim = this.animations[i];
      const trigger = this.triggers[i];
      if (anim.tempo > 0) {
        anim.tempo -= dt;
        if (trigger.morphTargetInfluences)
          trigger.morphTargetInfluences[0] = Math.min(6*(anim.duration - anim.tempo) / anim.duration,1); //animation d'un interrupteur
        this.doors[i][anim.action](anim.value * dt / anim.duration); //animation d'une porte ou d'un passage
      }
    }
  }

};
