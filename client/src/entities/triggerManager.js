import * as THREE from 'three';


const machinery = [
  { door: { mesh: 'door1', x: 19, y: 0.54, z: 0, action: 'translateZ', value: -1, duration: 2 }, trigger: { mesh: 'trigger1', x: 17.23, y: 0, z: 1.3 }, collider: 'collider_1', audio: 'playOpen1' },
  { door: { mesh: 'door2', x: 43.6, y: -6.5, z: -8.8, action: 'rotateY', value: -Math.PI * 2 / 3, duration: 3 }, trigger: { mesh: 'trigger1', x: 44.6, y: -6.5, z: 7.26 }, collider: 'collider_2', audio: 'playOpen3' },
  { door: { mesh: 'door3', x: 53.63, y: -4.85, z: -15, action: 'translateY', value: 2, duration: 2 }, trigger: { mesh: 'trigger1', x: 38.11, y: -6.351, z: -19 }, collider: 'collider_3', audio: 'playOpen1' },
  { door: { mesh: 'door4', x: 76.886, y: -11.1, z: 24.43, action: 'rotateY', value: Math.PI * 2 / 3, duration: 3 }, trigger: { mesh: null, x: 75.991, y: -15.932, z: 19.135 }, collider: 'collider_4', audio: 'playOpen2' }
];

export default class TriggerManager {

  constructor(assets, materials, world) {

    const materialMorph = materials.materialMorph.material;
    const materialRigid = materials.materialRigid.material;

    this.doors = []; //list des meshs animables (porte)
    this.triggers = [];//liste des interrupteurs
    this.colliders = [];//liste des colliders dynamiques activés lors de l'ouverture des passages
    this.animations = [];//animation des meshs animables

    for (let i = 0; i < machinery.length; i++) {  //pour chaque mécanisme
      const doorConf = machinery[i].door;
      const triggerConf = machinery[i].trigger;

      const door = new THREE.Mesh(assets[doorConf.mesh].geometry, materialRigid);//creation du mesh
      door.position.set(doorConf.x, doorConf.y, doorConf.z);//position dans le niveau
      world.add(door);
      this.doors.push(door);

      if (triggerConf.mesh) { //si l'interrupteur est visible
        const trigger = new THREE.Mesh(assets[triggerConf.mesh].geometry, materialMorph.clone())
        trigger.material.emissive = new THREE.Color(0x110000);
        trigger.userData.enabled = false; //éviter d'activer 2 fois le mécanisme
        trigger.userData.blink = -1;
        trigger.position.set(triggerConf.x, triggerConf.y, triggerConf.z);//position dans le niveau
        world.add(trigger);
        this.triggers.push(trigger);
      } else {
        const trigger = new THREE.Object3D();//si l'interrupteur non visible, 
        trigger.userData.enabled = false;
        trigger.position.set(triggerConf.x, triggerConf.y, triggerConf.z);
        world.add(trigger);
        this.triggers.push(trigger);
      }


      const collider = world.mobilesColliders[machinery[i].collider]; //récupération des colliders dynamiques
      collider.position.y = -10;
      this.colliders.push(collider);

      this.animations.push({ duration: doorConf.duration, tempo: 0, action: doorConf.action, value: doorConf.value, audio: machinery[i].audio });
    }
  }

  update(dt, mobs, player, soundManager) {
    this.triggerProcess(player, soundManager);
    this.updateAnimations(dt);
  }

  triggerProcess(player, soundManager) {
    for (let i = 0; i < this.triggers.length; i++) {
      if (this.triggers[i].userData.enabled) continue;
      const distance = player.getDistance(this.triggers[i].position) //distance avec l'interrupteur
      if (distance < 4) { //si distance de moins de 1m
        if (player.raycasterHand.intersectObjects([this.triggers[i]]).length) { //si collision avec l'arme
          this.trigger(i);
          soundManager[this.animations[i].audio]();
        } else if (this.triggers[i].type === 'Object3D') { //si interrupteur invisible, seule la distance l'active
          this.trigger(i);
          soundManager[this.animations[i].audio]();
        }
      }
    }
  }

  trigger(i) {
    if (this.triggers[i].material)
      this.triggers[i].material.emissive = new THREE.Color(0x000000);//arret du blink
    this.triggers[i].userData.enabled = true;
    this.colliders[i].position.y = 0;
    this.animations[i].tempo = this.animations[i].duration;
  }


  updateAnimations(dt) {
    for (let i = 0; i < this.animations.length; i++) {
      const anim = this.animations[i];
      const trigger = this.triggers[i];
      if (anim.tempo > 0) {
        anim.tempo -= dt;
        if (trigger.morphTargetInfluences)
          trigger.morphTargetInfluences[0] = (anim.duration - anim.tempo) / anim.duration;
        this.doors[i][anim.action](anim.value * dt / anim.duration);
      } else if (!trigger.userData.enabled && trigger.material) {
        trigger.material.emissiveIntensity += trigger.userData.blink * dt; //blink
        trigger.material.emissiveIntensity > 1 ? trigger.userData.blink = -1 : null;
        trigger.material.emissiveIntensity < 0 ? trigger.userData.blink = 1 : null;
      }
    }
  }

};
