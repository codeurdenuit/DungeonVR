import * as THREE from 'three';

const materialInvisible = new THREE.MeshStandardMaterial({ color: 0xff0000, visible: false });
const geometryBone = new THREE.BoxGeometry();
geometryBone.translate(0, 0.45, 0).scale(0.35, 0.4, 0.35);
const RANDOM = 0, FOCUS = 1, ATTACK = 2, HURT = 3;
const bodyparts = {
  head:{asset:'bodypart_head', origin: 'spine03', scaleX:1, dirX:0, dirY:0},
  body_l:{asset:'bodypart_body', origin: 'spine01', scaleX:-1, dirX:0.5, dirY:-0.5},
  body_r:{asset:'bodypart_body', origin: 'spine01', scaleX:1, dirX:-0.5, dirY:-0.5},
  soulder_l:{asset:'bodypart_shoulder', origin: 'upper_arm_l', scaleX:-1, dirX:1, dirY:0},
  soulder_r:{asset:'bodypart_shoulder', origin: 'upper_arm_r', scaleX:1, dirX:0, dirY:0},
  arm_l:{asset:'bodypart_arm', origin: 'upper_arm_l', scaleX:-1, dirX:1, dirY:-0.5},
  arm_r:{asset:'bodypart_arm', origin: 'upper_arm_r', scaleX:1, dirX:-1, dirY:-0.5},
  leg_l:{asset:'bodypart_leg', origin: 'shin_l', scaleX:-1, dirX:1, dirY:0},
  leg_r:{asset:'bodypart_leg', origin: 'shin_r', scaleX:1, dirX:-1, dirY:0},
}

const boneMap = { 
'spine03': {anim : 'hurthead', morph: [6], bodyparts: ['head']},
'spine02': {anim : 'hurtbody', morph: [], bodyparts: ['body_l', 'body_r', 'head', 'soulder_l', 'arm_l', 'soulder_r', 'arm_r', 'leg_l', 'leg_r']}, 
'spine01': {anim : 'hurtbody', morph: [], bodyparts: ['body_l', 'body_r', 'head']}, 
'shoulder_l': {anim : 'hurtarml', morph: [5, 1], bodyparts: ['soulder_l', 'arm_l']}, 
'upper_arm_l': {anim : 'hurtarml', morph: [5, 1], bodyparts: ['soulder_l', 'arm_l']}, 
'forearm_l': {anim : 'hurtarml', morph: [1], bodyparts: ['arm_l']},
'shoulder_r': {anim : 'hurtarmr', morph: [4, 0], bodyparts: ['soulder_r', 'arm_r']}, 
'upper_arm_r': {anim : 'hurtarmr', morph: [4, 0], bodyparts: ['soulder_r', 'arm_r']},
'forearm_r': {anim : 'hurtarmr', morph: [0], bodyparts: ['arm_r']},    
'thigh_l': {anim : 'hurtlegl', morph: [3], bodyparts: ['leg_l']},
'shin_l': {anim : 'hurtlegl', morph: [3], bodyparts: ['leg_l']}, 
'thigh_r': {anim : 'hurtlegr', morph: [2], bodyparts: ['leg_r']}, 
'shin_r': {anim : 'hurtlegr', morph: [2], bodyparts: ['leg_r']} }

export default class Mob {

  constructor(asset, materialSkin, x, y, z,  material) {
    //materialSkin.visible =  false
    const mobAssets = asset.mob;
    const mesh = new THREE.SkinnedMesh(mobAssets.geometry, materialSkin.clone()); //on instancie le mesh animable du personnage
    this.mesh = mesh;
    this.skeleton = mobAssets.skeleton.clone(); //on instancie une nouvelle instance du squelette du personnage
    this.rootBone = this.skeleton.bones[0]; //on récupere l'os racine du squelette
    mesh.bind(this.skeleton); // on lie le squelette au mesh animable
    this.root = new THREE.Object3D(); //Object 3D racine de cette instance
    this.root.add(mesh); // on attache le mesh qui représente le personnage
    this.root.add(this.rootBone); //on attache le squelette qui anime le personnage
    this.root.animations = mobAssets.animations; //on attache les animations jouables
    this.colliders = this.buildColliders(); // création des colliders pour détecter si le joueur touche les os du personnage
    this.bodyParts = this.buildBodyParts(asset, material);//parties détachables XD
    this.animedParts = [];//listes des morceaux en cours d'animation

    this.raycasterBody = new THREE.Raycaster(new THREE.Vector3(0, 0.5, 0), this.raycasterDirection, 0, 1); //pour détecter que le personnage touche le sol

    this.mixer = new THREE.AnimationMixer(this.root); //lecteur d'animation

    this.rangeWatch = 10; //distance du vision
    this.rangeHit = 1.3; //distance d'attaque

    this.speedWalk = 0.5; //vitesse de marche
    this.speedRun = 1; //vitesse de course
    this.currentSpeed = 0; //vitesse actuelle

    this.durationRandom = 5; //temps entre les comportement aléatoire (s)
    this.durationHit = 1;  //temps entre les comportement d'attaque (s)
    this.durationHurt = 0.33;  //temps de paralysie lors d'un blessure (s)

    this.probPause = 0.3;  //probabilité d'attandre
    this.probHit1 = 0.2; //probabilité d'attaque1
    this.probHit2 = 0.4; //probabilité d'attaque2

    this.currentAnimation = null;  //animation actuellement en lecture
    this.animations = {}; //animations disponibles

    this.worldPosition = new THREE.Vector3(); // position du peronnage dans l'espace absolue
    this.rotation = 0;// roation du personnage

    this.tempo = 0 //variablie utilisée pour décompter des durées
    this.tempoHit = 0//temps entre l'attaque et la collision avec le joueur;

    this.initPosition(x, y, z);
  }

  buildColliders() {
    const isBone = 'Bone'; // pour ne pas instancier un string a chaque itération
    const colliders = []; // pour stocker les colliers
    const originBone = this.rootBone;
    function collisionBox(bone) { //procédure de création d'un collier
      for (let i = 0; i < bone.children.length; i++) {
        if (bone.children[i].type === isBone) { // les élément attaché à un os ne sont pas toujours des os
          collisionBox(bone.children[i]); // pour chaque os enfant, on relance la procedure
        }
      }
      const box = new THREE.Mesh(geometryBone, materialInvisible.clone()); //création d'une box
      box.scale.set(0.3, 0.8, 0.3); // ajustement des dimentions
      box.name = bone.name;
      box.userData.hp = 100; //point de vie associés a cette partie du corps
      bone.add(box); //on attache le collider à l'os
      colliders.push(box);//on stocke la référence
    }
    collisionBox(originBone);//on commence la procedure
    return colliders;
  }

  buildBodyParts(assets, material) {
    const mapParts = {};
    for(let partName in bodyparts) {
      const info = bodyparts[partName];
      mapParts[partName] = new THREE.Mesh(assets[info.asset].geometry, material);//préparation des instances
      mapParts[partName].scale.set(info.scaleX, 1, 1);//pour les morceaux symétriques. On réutilise les mêmes géométries
    }
    return mapParts;
  }

  initPosition(x, y, z) { // placement du personnage à l'initialisation
    this.root.position.x = x;
    this.root.position.y = y;
    this.root.position.z = z;
    this.root.updateWorldMatrix();
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld);
  }

  startAnimation(animationName) {
    if (!this.animations[animationName]) { // on vérifié que l'animation est instanciée
      const clip = THREE.AnimationClip.findByName(this.root.animations, animationName);
      this.animations[animationName] = this.mixer.clipAction(clip, this.rootBone); //on instancie l'animation si elle n'existe pas
    }
    if (this.currentAnimation === this.animations[animationName]) { //si l'animation est déjà en cours, on la relance
      this.currentAnimation.reset();
    } else {
      if (this.currentAnimation) //on efface l'animation précedante si elle existe avant de la remplacer
        this.currentAnimation.stop();
      this.currentAnimation = this.animations[animationName];
      this.currentAnimation.play();
    }
  }

  hurt(direction, point, speed, indexBone) {
    if(this.behviour === HURT || this.colliders[indexBone].userData.hp <= 0) return
    const boneName = this.colliders[indexBone].name;//nom de l'os conserné
    this.startAnimation(boneMap[boneName].anim);//animation du choc
    this.behviour = HURT;//le comportement passe en phase de choc, le perso ne peut plus bouger
    this.tempo = this.durationHurt;//temps d'immobilité 
    this.colliders[indexBone].userData.hp -= 50;//on retrir des points de vie au collider
    if(this.colliders[indexBone].userData.hp === 0) { 
      this.startAnimationBodyPart(boneName, direction, speed) //Si colliders HS, on déclanche l'animation de démembrement 
    }
  }

  update(dt, world, player) {
    this.behviour = this.updateBehviour(dt, player);//on détermine le comportement en cours

    switch (this.behviour) {
      case RANDOM:
        this.updateRandom(dt); //processus du comportement aléatoire
        break;
      case FOCUS:
        this.updateFocus(dt, player); //processus de déplacement vers le joueur
        break;
      case ATTACK:
        this.updateAttack(dt, player);  //processus d'attaque
        break;
      case HURT:
        this.updateHurt(dt, player); //processus de blessure
        break;
      default:
    }

    this.updatePosition(dt, world);


    this.mixer.update(dt);

    //Fix pour l'affiche de mesh, je ne comprend pas pourquoi le mesh s'affiche en symétrie rz, sans cela, le mesh ne fait pas face au joueur
    this.root.rotation.y = this.rotation; //on applique la rotation du personnage
    this.root.rotation.y -= Math.PI/2;//correction, le mesh est face à l'axe z et non l'axe x.
    this.root.rotation.y = Math.PI * 2 - this.root.rotation.y; //je ne comprends toujours pas ce bug de rotation négative
    this.root.updateWorldMatrix();

    this.updatePartAnimation(dt);// animation des morceaux détachés
  }


  updateBehviour(dt, player) {
    const distance = player.getDistance(this.root.position); // distance entre le personnage et le joueur
    if (this.behviour === HURT && this.tempo > 0) {
      this.tempo -= dt; //subire une attaque
      return HURT;
    } else if (distance < this.rangeHit) {
      return ATTACK; //attaquer le joueur;
    } else if (distance < this.rangeWatch) {
      return FOCUS; //courir vers le joueur;
    } else {
      return RANDOM; //déplacementd aléatoired;
    }
  }

  updateRandom(dt) {
    this.tempo -= dt;
    if (this.tempo <= 0) {// décompte avant changement de comportement
      this.tempo = Math.random() * this.durationRandom / 2 + this.durationRandom / 2; //durée de ce sous comportement
      this.currentSpeed = Math.random() > 0.5 ? this.speedWalk : 0; //on attendre au marcher
      this.rotation = this.currentSpeed ? Math.random() * Math.PI * 2 : this.rotation; // Si déplacement, changement de direction
      this.startAnimation(this.currentSpeed ? 'walk' : 'pause');
    }
  }

  updateFocus(dt, player) {
    this.rotation = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI;
    if (this.currentSpeed !== this.speedRun) { //Si debut du focus, on active l'animation et on commence la course
      this.currentSpeed = this.speedRun;
      this.startAnimation('run');
    }
  }

  updateAttack(dt, player) {
    this.tempo -= dt;
    this.currentSpeed = 0; //le personnage ne se déplace plus

    if (this.tempo <= 0) { //toutes les 33ms, on change d'action de combat
      this.tempo = this.durationHit;
      const prob = Math.random();  //nombre entre 0 1 pour déterminé la probabilité d'action
      this.rotation = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; // le personnage fait face au joueur
      if (prob < this.probHit1) {
        this.startAnimation('hit1');
        this.tempoHit = this.durationHit * 0.33; //durée avant impact
      } else if (prob < this.probHit2) {
        this.startAnimation('hit2');
        this.tempoHit = this.durationHit * 0.33; //durée avant impact      
      } else {
        this.startAnimation('hitpause');
      }
    }

    if (this.tempoHit > 0) this.tempoHit -= dt;
    if (this.tempoHit <= 0) {
      player.hurt(this.worldPosition); //on attack le jouer et on indique la position du coup pour savoir si le bouclier peut parer 
    }
  }

  updateHurt(dt, player) {
   
  }

  updatePosition(dt, world) {
    if (!this.currentSpeed) return; //si pas de vitesse, pas de déplacement XD
    const distance = this.currentSpeed * dt; //distance parcourue
    this.root.position.x += Math.cos(this.rotation) * distance; //distance parcourue x
    this.root.position.z += Math.sin(this.rotation) * distance; //distance parcourue z
    this.root.updateWorldMatrix(); //mise à jour de la matrice world pour récupérer la position absolue
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld); // mise a jour de la position absolue
    this.worldPosition.y += 0.5 //offest for raycaseter
    this.raycasterBody.set(this.worldPosition, new THREE.Vector3(0, -1, 0)); //mise a jour du raycaster avec la nouvelle position absolue
    const col = this.raycasterBody.intersectObjects(world.colliders); //détection de la collision avec le sol

    if (!col.length) {  //si hors jeu, on rollback la position du personnage
      this.root.position.x -= Math.cos(this.rotation) * distance;
      this.root.position.z -= Math.sin(this.rotation) * distance;
    } else { //si toujours en jeu, on adapte la position y du personnage dans l'espace relatif au niveau, c'est le niveau qui bouge, pas le joueur
      this.root.position.y = col[0].point.y - world.root.position.y;
    }
  }

  startAnimationBodyPart(boneName, direction, speed) {
    const morph = boneMap[boneName].morph;
    const parts = boneMap[boneName].bodyparts;

    for(let i = 0; i<morph.length; i++) { //on applique les déformations au mesh, zone coupée
      this.mesh.morphTargetInfluences[morph[i]] = 1;
    }

    for(let i = 0; i<parts.length; i++) {//pour une partie du corps coupée, on parcourt les morceaux à projeter
      const partName = parts[i];
      const origin = bodyparts[partName].origin; //L'os d'où part le mesh à animer
      const dirX =  bodyparts[partName].dirX; //direction de l'animation
      const dirY = bodyparts[partName].dirY
      const partMesh = this.bodyParts[partName];//mesh à déplacer
      if(partName === 'body_l') { //plus de corps
        this.mesh.visible = false; //le personnage est détruit, il n'est plus visible
      }

      if(!partMesh) continue; // si déjà animé
      const bone = this.skeleton.getBoneByName(origin);//on récupére l'os d'ou commence la trajectoire
      const positionWorld = bone.getWorldPosition(new THREE.Vector3());//on récupère sa position dans le repère absolue
      const rotationWorld = bone.getWorldDirection(new THREE.Vector3())//on récupère sa rotation dans le repère absolue
      const positionInLevel = this.root.parent.worldToLocal(positionWorld); //on calcule cette position dans le repère du niveau (c'est le niveau qui se déplace et non le joueur)
      const directionRelative = direction.clone();//on ne doit pas modifier l'object réference de la direction
      directionRelative.z += -2; //la trajectoire doit reculer derrière le mob
      if(dirX!==0 ||dirY!==0 ) { //si un direction est forcée par la config
        directionRelative.set(dirX,dirY,-2);
      } 
      directionRelative.normalize();

      const directionInRoot = directionRelative.applyEuler(this.root.rotation); //le vecteur directeur est orienté par rapport au repère du personnage                
      
      partMesh.position.copy(positionInLevel);//on applique la position désirée au mesh
      partMesh.rotation.copy(rotationWorld);//on applique l'orientation désirée au mesh
      delete this.bodyParts[partName];// on l'efface le mesh de la liste, un morceau ne peut tomber q'une fois
      this.root.parent.add(partMesh);// on ajoute le mesh au niveau
      this.animedParts.push({mesh:partMesh, direction:directionInRoot, tempo:this.durationHurt*2, speed });// on ajoute l'animation dans la liste des animations
    }
  }

  updatePartAnimation(dt) {
    for(let i=0; i<this.animedParts.length; i++ ) { // pour chaque animation
      const anim = this.animedParts[i];
      if(anim.tempo > 0) { //tant que l'animation n'est pas terminée
        anim.mesh.translateOnAxis(anim.direction, anim.speed*1.5 * dt * anim.tempo); //translation du mesh dans la direction prévue
        anim.mesh.rotateOnAxis(anim.direction, anim.speed * dt ); //rotation du mesh dans l'axe de déplacement
        anim.tempo -= dt;
      } else {
        anim.mesh.removeFromParent(); // on détache le mesh du niveau.
        this.animedParts.splice(i, 1);//on efface l'animation de la liste, l'animation est terminée
        i--;
      }
    }
  }
};
