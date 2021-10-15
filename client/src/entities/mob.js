import * as THREE from 'three';

const materialInvisible = new THREE.MeshStandardMaterial({ color: 0xff0000, visible: false });
const geometryBone = new THREE.BoxGeometry();
geometryBone.translate(0, 0.45, 0);
const RANDOM = 0, FOCUS = 1, ATTACK = 2, HURT = 3;

export default class Mob {

  constructor(asset, material, x, y, z) {
    const mobAssets = asset.mob;
    const mesh = new THREE.SkinnedMesh(mobAssets.geometry, material.clone()); //on instancie le mesh animable du personnage
    this.skeleton = mobAssets.skeleton.clone(); //on instancie une nouvelle instance du squelette du personnage
    this.rootBone = this.skeleton.bones[0]; //on récupere l'os racine du squelette
    mesh.bind(this.skeleton); // on lie le squelette au mesh animable
    this.root = new THREE.Object3D(); //Object 3D racine de cette instance
    this.root.add(mesh); // on attache le mesh qui représente le personnage
    this.root.add(this.rootBone); //on attache le squelette qui anime le personnage
    this.root.animations = mobAssets.animations; //on attache les animations jouables
    this.colliders = this.buildColliders(); // création des colliders pour détecter si le joueur touche les os du personnage

    //mesh.morphTargetInfluences[0] = 1;
    ///mesh.morphTargetInfluences[2] = 1;
    //mesh.morphTargetInfluences[4] = 1;

    this.raycasterBody = new THREE.Raycaster(new THREE.Vector3(0, 0.5, 0), this.raycasterDirection, 0, 1); //pour détecter que le personnage touche le sol

    this.mixer = new THREE.AnimationMixer(this.root); //lecteur d'animation

    this.rangeWatch = 10; //distance du vision
    this.rangeHit = 1.3; //distance d'attaque

    this.speedWalk = 0.5; //vitesse de marche
    this.speedRun = 1; //vitesse de course
    this.currentSpeed = 0; //vitesse actuelle

    this.durationRandom = 5; //temps entre les comportement aléatoire (s)
    this.durationHit = 0.66;  //temps entre les comportement d'attaque (s)
    this.durationHurt = 0.33;  //temps de paralysie lors d'un blessure (s)

    this.probPause = 0.3;  //probabilité d'attandre
    this.probHit1 = 0.2; //probabilité d'attaque1
    this.probHit2 = 0.4; //probabilité d'attaque2

    this.currentAnimation = null;  //animation actuellement en lecture
    this.animations = {}; //animations disponibles

    this.worldPosition = new THREE.Vector3(); // position du peronnage dans l'espace absolue

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
      bone.add(box); //on attache le collider à l'os
      colliders.push(box);//on stocke la référence
    }
    collisionBox(originBone);//on commence la procedure
    return colliders;
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
    
    this.colliders[indexBone].material.color.setHex(Math.random() * 0xffffff);



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
        this.updateHurt(dt); //processus de blessure
        break;
      default:
    }

    this.updatePosition(dt, world);


    this.mixer.update(dt);

    //Fix pour l'affiche de mesh, je ne comprend pas pourquoi le mesh s'affiche en symétrie rz, sans cela, le mesh ne fait pas face au joueur
    this.root.rotation.y = Math.PI * 2 - this.root.rotation.y;
    this.root.updateWorldMatrix();
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
      this.root.rotation.y = this.currentSpeed ? Math.random() * Math.PI * 2 : this.root.rotation.y; // Si déplacement, changement de direction
      this.startAnimation(this.currentSpeed ? 'walk' : 'pause', true);
    }
  }

  updateFocus(dt, player) {
    this.root.rotation.y = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; //on cible le joueur //fix -z all z is negative ? why ?
    if (this.currentSpeed !== this.speedRun) { //Si debut du focus, on active l'animation et on commence la course
      this.currentSpeed = this.speedRun;
      this.startAnimation('run', true);
    }
  }

  updateAttack(dt, player) {
    this.tempo -= dt;
    this.currentSpeed = 0; //le personnage ne se déplace plus

    this.root.rotation.y = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; //on cible le joueur //fix -z all z is negative ? why ?


    if (this.tempo <= 0) { //toutes les 33ms, on change d'action de combat
      this.tempo = this.durationHit;
      const prob = Math.random();  //nombre entre 0 1 pour déterminé la probabilité d'action
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

  updateHurt(dt) {

  }

  updatePosition(dt, world) {
    if (!this.currentSpeed) return; //si pas de vitesse, pas de déplacement XD
    const distance = this.currentSpeed * dt; //distance parcourue
    this.root.position.x += Math.cos(this.root.rotation.y) * distance; //distance parcourue x
    this.root.position.z += Math.sin(this.root.rotation.y) * distance; //distance parcourue z
    this.root.updateWorldMatrix(); //mise à jour de la matrice world pour récupérer la position absolue
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld); // mise a jour de la position absolue
    this.worldPosition.y += 0.5 //offest for raycaseter
    this.raycasterBody.set(this.worldPosition, new THREE.Vector3(0, -1, 0)); //mise a jour du raycaster avec la nouvelle position absolue
    const col = this.raycasterBody.intersectObjects(world.colliders); //détection de la collision avec le sol

    if (!col.length) {  //si hors jeu, on rollback la position du personnage
      this.root.position.x -= Math.cos(this.root.rotation.y) * distance;
      this.root.position.z -= Math.sin(this.root.rotation.y) * distance;
    } else { //si toujours en jeu, on adapte la position y du personnage dans l'espace relatif au niveau, c'est le niveau qui bouge, pas le joueur
      this.root.position.y = col[0].point.y - world.root.position.y;
    }

  }
};
