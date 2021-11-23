import * as THREE from 'three';

const geometryCollier = new THREE.BoxGeometry();
geometryCollier.translate(0, 0.45, 0).scale(0.6, 0.4, 0.66);
const RANDOM = 0, FOCUS = 1, ATTACK = 2, HURT = 3;
const bodyparts = {
  head: { asset: 'bodypart_head', origin: 'spine03', scaleX: 1, dirX: 0, dirY: 0 },
  body_l: { asset: 'bodypart_body', origin: 'spine01', scaleX: -1, dirX: 0.5, dirY: -0.5 },
  body_r: { asset: 'bodypart_body', origin: 'spine01', scaleX: 1, dirX: -0.5, dirY: -0.5 },
  soulder_l: { asset: 'bodypart_shoulder', origin: 'upper_arm_l', scaleX: -1, dirX: 1, dirY: 0 },
  soulder_r: { asset: 'bodypart_shoulder', origin: 'upper_arm_r', scaleX: 1, dirX: 0, dirY: 0 },
  arm_l: { asset: 'bodypart_arm', origin: 'upper_arm_l', scaleX: -1, dirX: 1, dirY: -0.5 },
  arm_r: { asset: 'bodypart_arm', origin: 'upper_arm_r', scaleX: 1, dirX: -1, dirY: -0.5 },
  leg_l: { asset: 'bodypart_leg', origin: 'shin_l', scaleX: -1, dirX: 1, dirY: 0 },
  leg_r: { asset: 'bodypart_leg', origin: 'shin_r', scaleX: 1, dirX: -1, dirY: 0 },
}

const boneMap = {
  'spine03': { anim: 'hurthead', morph: [6], bodyparts: ['head'] },
  'spine02': { anim: 'hurtbody', morph: [], bodyparts: ['body_l', 'body_r', 'head', 'soulder_l', 'arm_l', 'soulder_r', 'arm_r', 'leg_l', 'leg_r'] },
  'spine01': { anim: 'hurtbody', morph: [], bodyparts: ['body_l', 'body_r', 'head', 'soulder_l', 'arm_l', 'soulder_r', 'arm_r', 'leg_l', 'leg_r'] },
  'shoulder_l': { anim: 'hurtarml', morph: [5, 1], bodyparts: ['soulder_l', 'arm_l'] },
  'upper_arm_l': { anim: 'hurtarml', morph: [5, 1], bodyparts: ['soulder_l', 'arm_l'] },
  'forearm_l': { anim: 'hurtarml', morph: [1], bodyparts: ['arm_l'] },
  'shoulder_r': { anim: 'hurtarmr', morph: [4, 0], bodyparts: ['soulder_r', 'arm_r'] },
  'upper_arm_r': { anim: 'hurtarmr', morph: [4, 0], bodyparts: ['soulder_r', 'arm_r'] },
  'forearm_r': { anim: 'hurtarmr', morph: [0], bodyparts: ['arm_r'] },
  'thigh_l': { anim: 'hurtlegl', morph: [3], bodyparts: ['leg_l'] },
  'shin_l': { anim: 'hurtlegl', morph: [3], bodyparts: ['leg_l'] },
  'thigh_r': { anim: 'hurtlegr', morph: [2], bodyparts: ['leg_r'] },
  'shin_r': { anim: 'hurtlegr', morph: [2], bodyparts: ['leg_r'] }
}

export default class Mob {

  constructor(asset, materials, x, y, z) {
    //materials.materialMorphSkin.material.visible = false; materials.materialInvisible.material.visible = true; //pour voir uniquement le squelette
    this.root = new THREE.Object3D(); //Object 3D racine de cette instance
    const mesh = new THREE.SkinnedMesh(asset.mob.geometry, materials.materialMorphSkin.material.clone()); //on instancie le mesh animable du mob
    this.mesh = mesh;
    this.skeleton = asset.mob.skeleton.clone(); //on instancie une nouvelle instance du squelette du mob, ne pas utiliser la même référence pour tous les mobs
    this.rootBone = this.skeleton.bones[0]; //on récupere l'os racine du squelette
    mesh.bind(this.skeleton); //on lie le squelette au mesh animable
   
    this.root.add(mesh); //on attache le mesh qui représente le mob
    this.root.add(this.rootBone); //on attache le squelette qui anime le mob
    this.root.animations = asset.mob.animations; //on attache les animations jouables
    this.colliders = this.buildColliders(materials.materialInvisible); //création des colliders pour détecter si le joueur touche les os du mob
    this.bodyParts = this.buildBodyParts(asset, materials.materialRigid); //parties détachables XD
    this.bloodGeometry = asset.blood2.geometry; //geométrie qui sera utililsée pour instancier les meshs d'impact sanglant
    this.bloodMaterial = materials.materialMorph.material;
    this.animedParts = []; //liste des morceaux en cours d'animation
    this.animedBlood = []; //liste du sang en cours d'animation

    this.raycasterBody = new THREE.Raycaster(new THREE.Vector3(0, 0.5, 0), this.raycasterDirection, 0, 1); //pour détecter que le mob touche le sol

    this.mixer = new THREE.AnimationMixer(this.root); //lecteur d'animation

    this.rangeWatch = 8; //distance du vision
    this.rangeHit = 1.3; //distance d'attaque

    this.speedWalk = 0.5; //vitesse de marche
    this.speedRun = 1; //vitesse de course
    this.currentSpeed = 0; //vitesse actuelle

    this.durationRandom = 5; //temps entre les comportement aléatoire (s)
    this.durationHit = 1.5;  //temps entre les comportement d'attaque (s)
    this.durationHurt = 0.5;  //temps de paralysie lors d'un blessure (s)

    this.probPause = 0.3;  //probabilité d'attente
    this.probHit1 = 0.2; //probabilité d'attaque1
    this.probHit2 = 0.4; //probabilité d'attaque2

    this.currentAnimation = null;  //animation actuellement en lecture
    this.animations = {}; //animations disponibles

    this.worldPosition = new THREE.Vector3(); //position du peronnage dans l'espace absolu
    this.rotation = 0; //orientation du mob

    this.tempo = 0 //variable utilisée pour décompter les durées d'animation ou d'états

    this.blinded = false; //si le mob n'as plus tête, son comportement change
    this.isDead = false; //indicateur de l'état de vie du mob
    this.hitting = false; //si le mot est en train de frapper
    this.initPosition(x, y, z);
  }

  buildColliders(materialInvisible) { //création des colliders pour chaque os
    const colliders = []; //pour stocker les colliers
    const originBone = this.rootBone;
    function collisionBox(bone) { //procédure de création d'un collier
      for (let i = 0; i < bone.children.length; i++) {
        if (bone.children[i].type === 'Bone') { //les éléments attachés à un os ne sont pas toujours des os
          collisionBox(bone.children[i]); //pour chaque os enfant, on relance la procédure
        }
      }

      const box = new THREE.Mesh(geometryCollier, materialInvisible.material); //création d'une box qui servira de collider
      box.scale.set(0.3, 0.8, 0.3); //ajustement des dimensions
      box.name = bone.name;
      box.userData.hp = 100; //point de vie associé à cette partie du corps
      bone.add(box); //on attache le collider à l'os
      colliders.push(box); //on stocke la référence
    }
    collisionBox(originBone);//on commence la procédure
    return colliders;
  }

  buildBodyParts(assets, materialRigid) { //création des morceaux détachables
    const mapParts = {};
    for (let partName in bodyparts) { //on parcourt l'objet de configuration.
      const info = bodyparts[partName];
      mapParts[partName] = new THREE.Mesh(assets[info.asset].geometry, materialRigid.material); //préparation des meshs
      mapParts[partName].scale.set(info.scaleX, 1, 1); //pour les morceaux symétriques. On réutilise les mêmes géométries
    }
    return mapParts;
  }

  initPosition(x, y, z) { //placement du mob à l'initialisation
    this.root.position.x = x;
    this.root.position.y = y;
    this.root.position.z = z;
    this.root.updateWorldMatrix(); 
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld); //si jamais utilisé avant le premier rendu, on force la mise à jour de la matrice de position
  }

  startAnimation(animationName) {
    if (!this.animations[animationName]) { //on vérifie que l'animation est instanciée
      const clip = THREE.AnimationClip.findByName(this.root.animations, animationName);
      this.animations[animationName] = this.mixer.clipAction(clip, this.rootBone); //on instancie l'animation si elle n'existe pas
    }
    if (this.currentAnimation === this.animations[animationName]) { //si l'animation est déjà en cours, on la relance
      this.currentAnimation.reset();
    } else {
      if (this.currentAnimation) //on efface l'animation précédente si elle existe avant de la remplacer.
        this.currentAnimation.stop();
      this.currentAnimation = this.animations[animationName];
      this.currentAnimation.play();
    }
  }

  hurt(direction, point, speed, indexBone, soundManager, weaponIndex, damage) { //fonction de blessure, déclenche l'animation de blessure et gère les points de vie du mob
    if (this.isDead) return; //si le mob est mort, on ne peut plus le toucher
    if (this.colliders[indexBone].userData.hp <= 0) return; //si la zone est déjà détruite, le coup est ignoré
    if (this.behviour === HURT & this.tempo > this.durationHurt / 2) return; //si le mob est déjà en train de subir des dégàts, le coup est ignoré, sauf après 1/2 du temps d'immobilité
    const boneName = this.colliders[indexBone].name; //nom de l'os conserné
    this.startAnimation(boneMap[boneName].anim); //animation du choc
    this.behviour = HURT; //le comportement passe en phase de choc, le perso ne peut plus bouger
    this.tempo = this.durationHurt; //temps d'immobilité 
    this.currentSpeed = 0; //le mob ne se déplace plus
    this.startAnimationBlood(point); //pour chaque coup, on lance une animation d'impact
    this.colliders[indexBone].userData.hp -= damage; //on retrir des points de vie du collider touché
    if (this.colliders[indexBone].userData.hp <= 0) { //si collider HS
      soundManager.playCutmob(); //bruitage du démembrement
      this.startAnimationBodyPart(boneName, direction, speed) //on déclenche l'animation de démembrement 
      if (boneName === 'spine03') { //si l'os touché correspond à la tête du mob
        this.blinded = true; //le mob est aveugle. 
        this.speedWalk = 0; //le mob ne peux plus se déplacer
      }
      if (boneName === 'spine02' || boneName === 'spine01') { //l'os détruit est la colonne vertébrale, le mob est considéré comme éliminé
        this.isDead = true; //pour indiquer au processus que le comportement du mob est désactivé
      }
    } else {
      soundManager.playHurtmob(weaponIndex);
    }
  }

  update(dt, world, player, mobs, soundManager) {
    this.behviour = this.updateBehviour(dt, player); //on détermine le comportement en cours

    if (!this.isDead) //si le mob est HS, on arrete les processus de comportement. 
      switch (this.behviour) {
        case RANDOM:
          this.updateRandom(dt); //processus du comportement aléatoire
          break;
        case FOCUS:
          this.updateFocus(dt, player); //processus de déplacement vers le joueur
          break;
        case ATTACK:
          this.updateAttack(dt, player, world, soundManager);  //processus d'attaque
          break;
        case HURT:
          this.updateHurt(dt, player); //processus de blessure
          break;
        default:
      }

    this.updatePosition(dt, world, mobs); //déplacement de la géométrie du mob


    this.mixer.update(dt);

    //Fix pour l'affiche de mesh, je ne comprend pas pourquoi le mesh s'affiche en symétrie rz, sans ce fix, le mesh ne fait pas face au joueur
    this.root.rotation.y = this.rotation; //on applique la rotation du personnage
    this.root.rotation.y -= Math.PI / 2; //correction, le mesh est face à l'axe z et non l'axe x. Peut-être fixé, en modifiant la géométrie sur Blender
    this.root.rotation.y = Math.PI * 2 - this.root.rotation.y; //je ne comprends toujours pas ce bug de rotation négative
    this.root.updateWorldMatrix();

    this.updatePartAnimation(dt);//animation des morceaux détachés
    this.updateBloodAnimation(dt);//animation des impacts
    this.checkLife(dt); //si mob HS, le mesh est retiré de la scène une fois que toutes les animations sont terminées
  }

  updateBehviour(dt, player) {  //gestion comportementale du mob
    const distance = player.getDistance(this.root.position); //distance entre le mob et le joueur
    if (this.behviour === HURT && this.tempo > 0) {
      this.tempo -= dt; //subire une attaque
      return HURT;
    } else if ((distance < this.rangeHit || (this.blinded && distance < this.rangeWatch)) && player.hp > 0) { //si à porté ou si aveugle, le mob ne se déplace plus et attaque à l'aveugle
      if (this.behviour !== ATTACK) this.tempo = 0;
      return ATTACK; //attaquer le joueur;
    } else if (distance < this.rangeWatch && player.hp > 0 && !this.blinded) { //si à distance de vue du joueur et que le joueur est vivant
      if (this.behviour !== FOCUS) this.tempo = 0;
      return FOCUS; //courir vers le joueur;
    } else {
      if (this.behviour !== RANDOM) this.tempo = 0;
      return RANDOM; //déplacement aléatoire;
    }
  }

  updateRandom(dt) {
    this.tempo -= dt;
    if (this.tempo <= 0) {//décompte avant changement de comportement
      this.tempo = Math.random() * this.durationRandom / 2 + this.durationRandom / 2; //durée d'un déplacement aléatoire
      this.currentSpeed = Math.random() > 0.5 ? this.speedWalk : 0; //attendre ou marcher
      this.rotation = this.currentSpeed ? Math.random() * Math.PI * 2 : this.rotation; //si un déplacement débute, le mob change de direction.
      this.startAnimation(this.currentSpeed ? 'walk' : 'pause'); //animation de déplacement ou d'attente 
    }
  }

  updateFocus(dt, player) { //Le mob va vers le joueur
    this.rotation = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; //s'oriente vers le joueur
    if (this.currentSpeed !== this.speedRun) { //si debut du focus, on active l'animation
      this.currentSpeed = this.speedRun; //se déplace en courant
      this.startAnimation('run');
    }
  }

  updateAttack(dt, player, world, soundManager) { //Le mob est en train de frapper
    this.tempo -= dt;
    this.currentSpeed = 0; //le mob ne se déplace plus

    if (this.tempo <= 0) { //toutes les 33ms, on change d'action de combat
      this.tempo = this.durationHit; //durée de l'action de frappe
      this.hitting = false; //on réinitialise l'action
      const prob = Math.random();  //nombre entre 0 1 pour déterminer la probabilité d'action
      if (!this.blinded) //si le mob est aveugle, il ne change plus d'orientation
        this.rotation = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; //le mob fait face au joueur
      if (prob < this.probHit1) {
        this.startAnimation('hit1'); //animation de la géomatrie
        this.hitting = true; //le mob commence une animation de frappe
      } else if (prob < this.probHit2) {
        this.startAnimation('hit2'); //animation de la géomatrie
        this.hitting = true;//le mob commence une animation de frappe
      } else { //le mob attend et ne frappe pas
        this.startAnimation('hitpause'); //animation de la géomatrie
      }
    }

    if (this.tempo < this.durationHit / 2 && this.hitting) {  //si animation arrive à 50% et que le mob frappe
      const distance = player.getDistance(this.root.position); //distance entre joueur et mob
      const diffAngle = Math.abs(this.rotation - new THREE.Vector2(player.positionCamera.x - this.worldPosition.x, player.positionCamera.z - this.worldPosition.z).angle()); //erreur d'angle entre l'orientation du mob et l'orientation entre mob et joueur
      if (diffAngle < Math.PI / 6 && distance < this.rangeHit) { //si joueur à porté et face au mob (angle < pi/6)
        player.hurt(this.worldPosition, world, soundManager); //on touche le joueur et on indique la position de l'attaquant pour savoir si le bouclier peut parer 
      }
      this.hitting = false; //le mob a touché le joueur, l'animation doit encore se terminer, mais le processus de frappe ne doit pas se redéclancher
    }
  }

  updateHurt(dt, player) { //si le mob est en train de subir une blessure 
    //Rien pour le moment
  }

  updatePosition(dt, world, mobs) { //déplacement de la géométrie du mob
    if (!this.currentSpeed) return; //si pas de vitesse, pas de déplacement XD
    const distance = this.currentSpeed * dt; //distance parcourue

    let dx = Math.cos(this.rotation) * distance; //distance parcourue x
    let dz = Math.sin(this.rotation) * distance; //distance parcourue z


    for (let i = 0; i < mobs.length; i++) { //on vérifie si il y a collision avec un autre mob, objectif, éviter la superposition des mobs
      if (mobs[i] === this) continue; //on ne teste pas une collision avec soi-même
      if (mobs[i].getDistance(this.root.position) < 1) { //si distance inférieure à 1m on corrige la position
        const rotation = this.rotation + Math.PI / 2 * this.getSide(mobs[i].root.position); //on va vers la droite ou la gauche en fonction de la position de l'entité par rapport au vecteur de déplacement
        dx = Math.cos(rotation) * distance; //distance parcourue x
        dz = Math.sin(rotation) * distance; //distance parcourue z
      }
    }

    this.root.position.x += dx; //distance parcourue x
    this.root.position.z += dz; //distance parcourue z

    this.root.updateWorldMatrix(); //mise à jour de la matrice world pour récupérer la position absolue
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld); //mise a jour de la position absolue
    this.worldPosition.y += 0.5 //offest for raycaseter
    this.raycasterBody.set(this.worldPosition, new THREE.Vector3(0, -1, 0)); //mise a jour du raycaster avec la nouvelle position absolue
    const col = this.raycasterBody.intersectObject(world.colliderMaster); //détection de la collision avec le sol

    if (!col.length) {  //si mob hors-jeu, on rollback la position de ce dernier
      this.root.position.x -= dx;
      this.root.position.z -= dz;
    } else { //si toujours en jeu, on adapte la position verticale du mob dans l'espace relatif au niveau, c'est le niveau qui bouge, pas le joueur
      this.root.position.y = col[0].point.y - world.root.position.y; //on corrige le décalage entre le sol et le mob
    }
  }

  startAnimationBodyPart(boneName, direction, speed) { //animtion de démembrement 
    const morph = boneMap[boneName].morph; //indication de déformation de la géométrie du mob
    const parts = boneMap[boneName].bodyparts; //indication du morceau à afficher

    for (let i = 0; i < morph.length; i++) { //on applique les déformations au mesh, zone coupée
      this.mesh.morphTargetInfluences[morph[i]] = 1;
    }

    for (let i = 0; i < parts.length; i++) { //pour une partie du corps coupée, on parcourt les morceaux à projeter
      const partName = parts[i];
      const origin = bodyparts[partName].origin; //L'os d'où part le mesh à animer
      const dirX = bodyparts[partName].dirX; //direction de l'animation
      const dirY = bodyparts[partName].dirY
      const partMesh = this.bodyParts[partName]; //mesh à animer
      if (partName === 'body_l') { //plus de corps
        this.mesh.visible = false; //le mob est détruit, il n'est plus visible, mauvaise pratique, l'animation ne doit pas contenir un code de fonctionnalité
      }

      if (!partMesh) continue; //si déjà animé
      const bone = this.skeleton.getBoneByName(origin); //on récupère l'os d'où commence la trajectoire
      const positionWorld = bone.getWorldPosition(new THREE.Vector3()); //on récupère sa position dans le repère absolu
      const rotationWorld = bone.getWorldDirection(new THREE.Vector3()) //on récupère sa rotation dans le repère absolu
      const positionInLevel = this.root.parent.worldToLocal(positionWorld); //on calcule cette position dans le repère du niveau (c'est le niveau qui se déplace et non le joueur)
      const directionRelative = direction.clone(); //on ne doit pas modifier l'object réference qui indique la direction
      directionRelative.z += -2; //la trajectoire doit reculer derrière le mob (design)
      if (dirX !== 0 || dirY !== 0) { //si une direction est forcée par la config
        directionRelative.set(dirX, dirY, -2);
      }
      directionRelative.normalize();

      const directionInRoot = directionRelative.applyEuler(this.root.rotation); //le vecteur directeur est orienté par rapport au repère du mob                

      partMesh.position.copy(positionInLevel); //on applique la position désirée au mesh
      partMesh.rotation.copy(rotationWorld); //on applique l'orientation désirée au mesh
      delete this.bodyParts[partName]; //on l'efface le mesh de la liste, un morceau ne peut tomber q'une fois
      this.root.parent.add(partMesh); // on ajoute le mesh au niveau
      this.animedParts.push({ mesh: partMesh, direction: directionInRoot, tempo: this.durationHurt * 2, speed }); //l'animation à jouer est ajoutée à la pile des animations en cours
    }
  }

  updatePartAnimation(dt) { //lecture d'une animation de démembrement en cours
    for (let i = 0; i < this.animedParts.length; i++) { //pour chaque animation en cours
      const anim = this.animedParts[i];
      if (anim.tempo > 0) {
        anim.mesh.translateOnAxis(anim.direction, anim.speed * 1.5 * dt * anim.tempo);
        anim.mesh.rotateOnAxis(anim.direction, anim.speed * dt);
        anim.tempo -= dt;
      } else { //si l'animation est terminée
        anim.mesh.removeFromParent(); //le mesh du morceau est retiré de la scène
        this.animedParts.splice(i, 1); //l'animation est retirée de la pile
        i--;
      }
    }
  }

  startAnimationBlood(position) {
    const mesh = new THREE.Mesh(this.bloodGeometry, this.bloodMaterial); //préparation des meshs représentant le sang
    const positionInLevel = this.root.parent.worldToLocal(position); //position du mesh relatif à l'espace absolu, il faut le placer dans référentiel niveau, le mesh bouge avec le niveau
    mesh.position.copy(positionInLevel);
    mesh.rotation.y = Math.random() * Math.PI * 2; //le mesh subit une rotation aléatoire sur l'axe y pour simuler une apparence differente.
    this.animedBlood.push({ mesh, tempo: this.durationHurt, duration: this.durationHurt }); //on ajoute l'animation du mesh à la liste des animations
    this.root.parent.add(mesh); //le mesh est ajouté à la scene
  }

  updateBloodAnimation(dt) { //lecture d'une animation de sang
    for (let i = 0; i < this.animedBlood.length; i++) { //pour chaque animation
      const anim = this.animedBlood[i];
      if (anim.tempo > 0) { //tant que l'animation n'est pas terminée, on continue le processus d'animation
        const progress = 1 - anim.tempo / anim.duration //progression de 0 à 1;
        const horizontalProgress = 1 - (1 - progress) * (1 - progress); //0 to 1 (1-x)²
        const verticalProgress = progress * progress //x² 
        anim.mesh.morphTargetInfluences[0] = horizontalProgress; //animation morphing pour l'axe horizontal 
        anim.mesh.morphTargetInfluences[1] = verticalProgress; //animation morphing pour l'axe vertical 
        anim.tempo -= dt;
      } else { //une fois l'animation terminée
        anim.mesh.removeFromParent(); //on détache le mesh du niveau.
        this.animedBlood.splice(i, 1); //on efface l'animation de la liste, l'animation est terminée
        i--;
      }
    }
  }

  checkLife(dt) {
    if (this.isDead) {  //si le mob est éliminé
      if (!this.animedParts.length && !this.animedBlood.length) { //si toutes les animations sont terminées
        this.root.clear(); //le mesh du mob est effacé de la scène
        this.root.removeFromParent();
      }
    }
  }

  getDistance(target) {
    const dX = Math.abs(this.root.position.x - target.x);
    const dZ = Math.abs(this.root.position.z - target.z);
    return Math.sqrt(dX * dX + dZ * dZ);
  }

  getSide(target) { //de quel coté se trouve une coordonnée par rapport au mob
    const dirVector = new THREE.Vector2(this.root.position.x + Math.cos(this.rotation) - this.root.position.x, this.root.position.z + Math.sin(this.rotation) - this.root.position.z);
    const tragetVector = new THREE.Vector2(target.x - this.root.position.x, target.z - this.root.position.z);
    const angle = tragetVector.cross(dirVector);
    return angle > 0 ? 1 : -1;
  }

};
