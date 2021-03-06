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
};

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
};

export default class Mob {

  constructor(asset, materials, x, y, z) {
    //materials.materialMorphSkin.material.visible = false; materials.materialInvisible.material.visible = true; //pour voir uniquement le squelette
    this.root = new THREE.Object3D(); //Object 3D racine de cette instance
    const mesh = new THREE.SkinnedMesh(asset.mob.geometry, materials.materialMorphSkin.material.clone()); //on instancie le mesh animable du mob
    this.mesh = mesh;
    this.skeleton = asset.mob.skeleton.clone(); //on instancie une nouvelle instance du squelette du mob, ne pas utiliser la m??me r??f??rence pour tous les mobs
    this.rootBone = this.skeleton.bones[0]; //on r??cupere l'os racine du squelette
    mesh.bind(this.skeleton); //on lie le squelette au mesh animable
   
    this.root.add(mesh); //on attache le mesh qui repr??sente le mob
    this.root.add(this.rootBone); //on attache le squelette qui anime le mob
    this.root.animations = asset.mob.animations; //on attache les animations jouables
    this.colliders = this.buildColliders(materials.materialInvisible); //cr??ation des colliders pour d??tecter si le joueur touche les os du mob
    this.bodyParts = this.buildBodyParts(asset, materials.materialRigid); //parties d??tachables XD
    this.bloodGeometry = asset.blood2.geometry; //geom??trie qui sera utilils??e pour instancier les meshs d'impact sanglant
    this.bloodMaterial = materials.materialMorph.material;
    this.animedParts = []; //liste des morceaux en cours d'animation
    this.animedBlood = []; //liste du sang en cours d'animation

    this.raycasterBody = new THREE.Raycaster(new THREE.Vector3(0, 0.5, 0), this.raycasterDirection, 0, 1); //pour d??tecter que le mob touche le sol

    this.mixer = new THREE.AnimationMixer(this.root); //lecteur d'animation

    this.rangeWatch = 8; //distance du vision
    this.rangeHit = 1.3; //distance d'attaque

    this.speedWalk = 0.5; //vitesse de marche
    this.speedRun = 1; //vitesse de course
    this.currentSpeed = 0; //vitesse actuelle

    this.durationRandom = 5; //temps entre les comportement al??atoire (s)
    this.durationHit = 1.5;  //temps entre les comportement d'attaque (s)
    this.durationHurt = 0.5;  //temps de paralysie lors d'un blessure (s)

    this.probPause = 0.3;  //probabilit?? d'attente
    this.probHit1 = 0.2; //probabilit?? d'attaque1
    this.probHit2 = 0.4; //probabilit?? d'attaque2

    this.currentAnimation = null;  //animation actuellement en lecture
    this.animations = {}; //animations disponibles

    this.worldPosition = new THREE.Vector3(); //position du peronnage dans l'espace absolu
    this.rotation = 0; //orientation du mob

    this.tempo = 0; //variable utilis??e pour d??compter les dur??es d'animation ou d'??tats

    this.blinded = false; //si le mob n'as plus t??te, son comportement change
    this.isDead = false; //indicateur de l'??tat de vie du mob
    this.hitting = false; //si le mot est en train de frapper
    this.initPosition(x, y, z);
  }

  buildColliders(materialInvisible) { //cr??ation des colliders pour chaque os
    const colliders = []; //pour stocker les colliers
    const originBone = this.rootBone;
    function collisionBox(bone) { //proc??dure de cr??ation d'un collier
      for (let i = 0; i < bone.children.length; i++) {
        if (bone.children[i].type === 'Bone') { //les ??l??ments attach??s ?? un os ne sont pas toujours des os
          collisionBox(bone.children[i]); //pour chaque os enfant, on relance la proc??dure
        }
      }

      const box = new THREE.Mesh(geometryCollier, materialInvisible.material); //cr??ation d'une box qui servira de collider
      box.scale.set(0.3, 0.8, 0.3); //ajustement des dimensions
      box.name = bone.name;
      box.userData.hp = 100; //point de vie associ?? ?? cette partie du corps
      bone.add(box); //on attache le collider ?? l'os
      colliders.push(box); //on stocke la r??f??rence
    }
    collisionBox(originBone);//on commence la proc??dure
    return colliders;
  }

  buildBodyParts(assets, materialRigid) { //cr??ation des morceaux d??tachables
    const mapParts = {};
    for (let partName in bodyparts) { //on parcourt l'objet de configuration.
      const info = bodyparts[partName];
      mapParts[partName] = new THREE.Mesh(assets[info.asset].geometry, materialRigid.material); //pr??paration des meshs
      mapParts[partName].scale.set(info.scaleX, 1, 1); //pour les morceaux sym??triques. On r??utilise les m??mes g??om??tries
    }
    return mapParts;
  }

  initPosition(x, y, z) { //placement du mob ?? l'initialisation
    this.root.position.x = x;
    this.root.position.y = y;
    this.root.position.z = z;
    this.root.updateWorldMatrix(); 
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld); //si jamais utilis?? avant le premier rendu, on force la mise ?? jour de la matrice de position
  }

  startAnimation(animationName) {
    if (!this.animations[animationName]) { //on v??rifie que l'animation est instanci??e
      const clip = THREE.AnimationClip.findByName(this.root.animations, animationName);
      this.animations[animationName] = this.mixer.clipAction(clip, this.rootBone); //on instancie l'animation si elle n'existe pas
    }
    if (this.currentAnimation === this.animations[animationName]) { //si l'animation est d??j?? en cours, on la relance
      this.currentAnimation.reset();
    } else {
      if (this.currentAnimation) //on efface l'animation pr??c??dente si elle existe avant de la remplacer.
        this.currentAnimation.stop();
      this.currentAnimation = this.animations[animationName];
      this.currentAnimation.play();
    }
  }

  hurt(direction, point, speed, indexBone, soundManager, weaponIndex, damage) { //fonction de blessure, d??clenche l'animation de blessure et g??re les points de vie du mob
    if (this.isDead) return; //si le mob est mort, on ne peut plus le toucher
    if (this.colliders[indexBone].userData.hp <= 0) return; //si la zone est d??j?? d??truite, le coup est ignor??
    if (this.behviour === HURT & this.tempo > this.durationHurt / 2) return; //si le mob est d??j?? en train de subir des d??g??ts, le coup est ignor??, sauf apr??s 1/2 du temps d'immobilit??
    const boneName = this.colliders[indexBone].name; //nom de l'os consern??
    this.startAnimation(boneMap[boneName].anim); //animation du choc
    this.behviour = HURT; //le comportement passe en phase de choc, le perso ne peut plus bouger
    this.tempo = this.durationHurt; //temps d'immobilit?? 
    this.currentSpeed = 0; //le mob ne se d??place plus
    this.startAnimationBlood(point); //pour chaque coup, on lance une animation d'impact
    this.colliders[indexBone].userData.hp -= damage; //on retrir des points de vie du collider touch??
    if (this.colliders[indexBone].userData.hp <= 0) { //si collider HS
      soundManager.playCutmob(); //bruitage du d??membrement
      this.startAnimationBodyPart(boneName, direction, speed); //on d??clenche l'animation de d??membrement 
      if (boneName === 'spine03') { //si l'os touch?? correspond ?? la t??te du mob
        this.blinded = true; //le mob est aveugle. 
        this.speedWalk = 0; //le mob ne peux plus se d??placer
      }
      if (boneName === 'spine02' || boneName === 'spine01') { //l'os d??truit est la colonne vert??brale, le mob est consid??r?? comme ??limin??
        this.isDead = true; //pour indiquer au processus que le comportement du mob est d??sactiv??
      }
    } else {
      soundManager.playHurtmob(weaponIndex);
    }
  }

  update(dt, world, player, mobs, soundManager) {
    this.behviour = this.updateBehviour(dt, player); //on d??termine le comportement en cours

    if (!this.isDead) //si le mob est HS, on arrete les processus de comportement. 
      switch (this.behviour) {
      case RANDOM:
        this.updateRandom(dt); //processus du comportement al??atoire
        break;
      case FOCUS:
        this.updateFocus(dt, player); //processus de d??placement vers le joueur
        break;
      case ATTACK:
        this.updateAttack(dt, player, world, soundManager);  //processus d'attaque
        break;
      case HURT:
        this.updateHurt(dt, player); //processus de blessure
        break;
      default:
      }

    this.updatePosition(dt, world, mobs); //d??placement de la g??om??trie du mob


    this.mixer.update(dt);

    //Fix pour l'affiche de mesh, je ne comprend pas pourquoi le mesh s'affiche en sym??trie rz, sans ce fix, le mesh ne fait pas face au joueur
    this.root.rotation.y = this.rotation; //on applique la rotation du personnage
    this.root.rotation.y -= Math.PI / 2; //correction, le mesh est face ?? l'axe z et non l'axe x. Peut-??tre fix??, en modifiant la g??om??trie sur Blender
    this.root.rotation.y = Math.PI * 2 - this.root.rotation.y; //je ne comprends toujours pas ce bug de rotation n??gative
    this.root.updateWorldMatrix();

    this.updatePartAnimation(dt);//animation des morceaux d??tach??s
    this.updateBloodAnimation(dt);//animation des impacts
    this.checkLife(dt); //si mob HS, le mesh est retir?? de la sc??ne une fois que toutes les animations sont termin??es
  }

  updateBehviour(dt, player) {  //gestion comportementale du mob
    const distance = player.getDistance(this.root.position); //distance entre le mob et le joueur
    if (this.behviour === HURT && this.tempo > 0) {
      this.tempo -= dt; //subire une attaque
      return HURT;
    } else if ((distance < this.rangeHit || (this.blinded && distance < this.rangeWatch)) && player.hp > 0) { //si ?? port?? ou si aveugle, le mob ne se d??place plus et attaque ?? l'aveugle
      if (this.behviour !== ATTACK) this.tempo = 0;
      return ATTACK; //attaquer le joueur;
    } else if (distance < this.rangeWatch && player.hp > 0 && !this.blinded) { //si ?? distance de vue du joueur et que le joueur est vivant
      if (this.behviour !== FOCUS) this.tempo = 0;
      return FOCUS; //courir vers le joueur;
    } else {
      if (this.behviour !== RANDOM) this.tempo = 0;
      return RANDOM; //d??placement al??atoire;
    }
  }

  updateRandom(dt) {
    this.tempo -= dt;
    if (this.tempo <= 0) {//d??compte avant changement de comportement
      this.tempo = Math.random() * this.durationRandom / 2 + this.durationRandom / 2; //dur??e d'un d??placement al??atoire
      this.currentSpeed = Math.random() > 0.5 ? this.speedWalk : 0; //attendre ou marcher
      this.rotation = this.currentSpeed ? Math.random() * Math.PI * 2 : this.rotation; //si un d??placement d??bute, le mob change de direction.
      this.startAnimation(this.currentSpeed ? 'walk' : 'pause'); //animation de d??placement ou d'attente 
    }
  }

  updateFocus(dt, player) { //Le mob va vers le joueur
    this.rotation = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; //s'oriente vers le joueur
    if (this.currentSpeed !== this.speedRun) { //si debut du focus, on active l'animation
      this.currentSpeed = this.speedRun; //se d??place en courant
      this.startAnimation('run');
    }
  }

  updateAttack(dt, player, world, soundManager) { //Le mob est en train de frapper
    this.tempo -= dt;
    this.currentSpeed = 0; //le mob ne se d??place plus

    if (this.tempo <= 0) { //toutes les 33ms, on change d'action de combat
      this.tempo = this.durationHit; //dur??e de l'action de frappe
      this.hitting = false; //on r??initialise l'action
      const prob = Math.random();  //nombre entre 0 1 pour d??terminer la probabilit?? d'action
      if (!this.blinded) //si le mob est aveugle, il ne change plus d'orientation
        this.rotation = Math.atan2(-(player.positionVictualCamera.z - this.root.position.z), - (player.positionVictualCamera.x - this.root.position.x)) + Math.PI; //le mob fait face au joueur
      if (prob < this.probHit1) {
        this.startAnimation('hit1'); //animation de la g??omatrie
        this.hitting = true; //le mob commence une animation de frappe
      } else if (prob < this.probHit2) {
        this.startAnimation('hit2'); //animation de la g??omatrie
        this.hitting = true;//le mob commence une animation de frappe
      } else { //le mob attend et ne frappe pas
        this.startAnimation('hitpause'); //animation de la g??omatrie
      }
    }

    if (this.tempo < this.durationHit / 2 && this.hitting) {  //si animation arrive ?? 50% et que le mob frappe
      const distance = player.getDistance(this.root.position); //distance entre joueur et mob
      const diffAngle = Math.abs(this.rotation - new THREE.Vector2(player.positionCamera.x - this.worldPosition.x, player.positionCamera.z - this.worldPosition.z).angle()); //erreur d'angle entre l'orientation du mob et l'orientation entre mob et joueur
      if (diffAngle < Math.PI / 6 && distance < this.rangeHit) { //si joueur ?? port?? et face au mob (angle < pi/6)
        player.hurt(this.worldPosition, world, soundManager); //on touche le joueur et on indique la position de l'attaquant pour savoir si le bouclier peut parer 
      }
      this.hitting = false; //le mob a touch?? le joueur, l'animation doit encore se terminer, mais le processus de frappe ne doit pas se red??clancher
    }
  }

  updateHurt() { //si le mob est en train de subir une blessure 
    //Rien pour le moment
  }

  updatePosition(dt, world, mobs) { //d??placement de la g??om??trie du mob
    if (!this.currentSpeed) return; //si pas de vitesse, pas de d??placement XD
    const distance = this.currentSpeed * dt; //distance parcourue

    let dx = Math.cos(this.rotation) * distance; //distance parcourue x
    let dz = Math.sin(this.rotation) * distance; //distance parcourue z


    for (let i = 0; i < mobs.length; i++) { //on v??rifie si il y a collision avec un autre mob, objectif, ??viter la superposition des mobs
      if (mobs[i] === this) continue; //on ne teste pas une collision avec soi-m??me
      if (mobs[i].getDistance(this.root.position) < 1) { //si distance inf??rieure ?? 1m on corrige la position
        const rotation = this.rotation + Math.PI / 2 * this.getSide(mobs[i].root.position); //on va vers la droite ou la gauche en fonction de la position de l'entit?? par rapport au vecteur de d??placement
        dx = Math.cos(rotation) * distance; //distance parcourue x
        dz = Math.sin(rotation) * distance; //distance parcourue z
      }
    }

    this.root.position.x += dx; //distance parcourue x
    this.root.position.z += dz; //distance parcourue z

    this.root.updateWorldMatrix(); //mise ?? jour de la matrice world pour r??cup??rer la position absolue
    this.worldPosition.setFromMatrixPosition(this.root.matrixWorld); //mise a jour de la position absolue
    this.worldPosition.y += 0.5; //offest for raycaseter
    this.raycasterBody.set(this.worldPosition, new THREE.Vector3(0, -1, 0)); //mise a jour du raycaster avec la nouvelle position absolue
    const col = this.raycasterBody.intersectObject(world.colliderMaster); //d??tection de la collision avec le sol

    if (!col.length) {  //si mob hors-jeu, on rollback la position de ce dernier
      this.root.position.x -= dx;
      this.root.position.z -= dz;
    } else { //si toujours en jeu, on adapte la position verticale du mob dans l'espace relatif au niveau, c'est le niveau qui bouge, pas le joueur
      this.root.position.y = col[0].point.y - world.root.position.y; //on corrige le d??calage entre le sol et le mob
    }
  }

  startAnimationBodyPart(boneName, direction, speed) { //animtion de d??membrement 
    const morph = boneMap[boneName].morph; //indication de d??formation de la g??om??trie du mob
    const parts = boneMap[boneName].bodyparts; //indication du morceau ?? afficher

    for (let i = 0; i < morph.length; i++) { //on applique les d??formations au mesh, zone coup??e
      this.mesh.morphTargetInfluences[morph[i]] = 1;
    }

    for (let i = 0; i < parts.length; i++) { //pour une partie du corps coup??e, on parcourt les morceaux ?? projeter
      const partName = parts[i];
      const origin = bodyparts[partName].origin; //L'os d'o?? part le mesh ?? animer
      const dirX = bodyparts[partName].dirX; //direction de l'animation
      const dirY = bodyparts[partName].dirY;
      const partMesh = this.bodyParts[partName]; //mesh ?? animer
      if (partName === 'body_l') { //plus de corps
        this.mesh.visible = false; //le mob est d??truit, il n'est plus visible, mauvaise pratique, l'animation ne doit pas contenir un code de fonctionnalit??
      }

      if (!partMesh) continue; //si d??j?? anim??
      const bone = this.skeleton.getBoneByName(origin); //on r??cup??re l'os d'o?? commence la trajectoire
      const positionWorld = bone.getWorldPosition(new THREE.Vector3()); //on r??cup??re sa position dans le rep??re absolu
      const rotationWorld = bone.getWorldDirection(new THREE.Vector3()); //on r??cup??re sa rotation dans le rep??re absolu
      const positionInLevel = this.root.parent.worldToLocal(positionWorld); //on calcule cette position dans le rep??re du niveau (c'est le niveau qui se d??place et non le joueur)
      const directionRelative = direction.clone(); //on ne doit pas modifier l'object r??ference qui indique la direction
      directionRelative.z += -2; //la trajectoire doit reculer derri??re le mob (design)
      if (dirX !== 0 || dirY !== 0) { //si une direction est forc??e par la config
        directionRelative.set(dirX, dirY, -2);
      }
      directionRelative.normalize();

      const directionInRoot = directionRelative.applyEuler(this.root.rotation); //le vecteur directeur est orient?? par rapport au rep??re du mob                

      partMesh.position.copy(positionInLevel); //on applique la position d??sir??e au mesh
      partMesh.rotation.copy(rotationWorld); //on applique l'orientation d??sir??e au mesh
      delete this.bodyParts[partName]; //on l'efface le mesh de la liste, un morceau ne peut tomber q'une fois
      this.root.parent.add(partMesh); // on ajoute le mesh au niveau
      this.animedParts.push({ mesh: partMesh, direction: directionInRoot, tempo: this.durationHurt * 2, speed }); //l'animation ?? jouer est ajout??e ?? la pile des animations en cours
    }
  }

  updatePartAnimation(dt) { //lecture d'une animation de d??membrement en cours
    for (let i = 0; i < this.animedParts.length; i++) { //pour chaque animation en cours
      const anim = this.animedParts[i];
      if (anim.tempo > 0) {
        anim.mesh.translateOnAxis(anim.direction, anim.speed * 1.5 * dt * anim.tempo);
        anim.mesh.rotateOnAxis(anim.direction, anim.speed * dt);
        anim.tempo -= dt;
      } else { //si l'animation est termin??e
        anim.mesh.removeFromParent(); //le mesh du morceau est retir?? de la sc??ne
        this.animedParts.splice(i, 1); //l'animation est retir??e de la pile
        i--;
      }
    }
  }

  startAnimationBlood(position) {
    const mesh = new THREE.Mesh(this.bloodGeometry, this.bloodMaterial); //pr??paration des meshs repr??sentant le sang
    const positionInLevel = this.root.parent.worldToLocal(position); //position du mesh relatif ?? l'espace absolu, il faut le placer dans r??f??rentiel niveau, le mesh bouge avec le niveau
    mesh.position.copy(positionInLevel);
    mesh.rotation.y = Math.random() * Math.PI * 2; //le mesh subit une rotation al??atoire sur l'axe y pour simuler une apparence differente.
    this.animedBlood.push({ mesh, tempo: this.durationHurt, duration: this.durationHurt }); //on ajoute l'animation du mesh ?? la liste des animations
    this.root.parent.add(mesh); //le mesh est ajout?? ?? la scene
  }

  updateBloodAnimation(dt) { //lecture d'une animation de sang
    for (let i = 0; i < this.animedBlood.length; i++) { //pour chaque animation
      const anim = this.animedBlood[i];
      if (anim.tempo > 0) { //tant que l'animation n'est pas termin??e, on continue le processus d'animation
        const progress = 1 - anim.tempo / anim.duration; //progression de 0 ?? 1;
        const horizontalProgress = 1 - (1 - progress) * (1 - progress); //0 to 1 (1-x)??
        const verticalProgress = progress * progress; //x?? 
        anim.mesh.morphTargetInfluences[0] = horizontalProgress; //animation morphing pour l'axe horizontal 
        anim.mesh.morphTargetInfluences[1] = verticalProgress; //animation morphing pour l'axe vertical 
        anim.tempo -= dt;
      } else { //une fois l'animation termin??e
        anim.mesh.removeFromParent(); //on d??tache le mesh du niveau.
        this.animedBlood.splice(i, 1); //on efface l'animation de la liste, l'animation est termin??e
        i--;
      }
    }
  }

  checkLife() {
    if (this.isDead) {  //si le mob est ??limin??
      if (!this.animedParts.length && !this.animedBlood.length) { //si toutes les animations sont termin??es
        this.root.clear(); //le mesh du mob est effac?? de la sc??ne
        this.root.removeFromParent();
      }
    }
  }

  getDistance(target) {
    const dX = Math.abs(this.root.position.x - target.x);
    const dZ = Math.abs(this.root.position.z - target.z);
    return Math.sqrt(dX * dX + dZ * dZ);
  }

  getSide(target) { //de quel cot?? se trouve une coordonn??e par rapport au mob
    const dirVector = new THREE.Vector2(this.root.position.x + Math.cos(this.rotation) - this.root.position.x, this.root.position.z + Math.sin(this.rotation) - this.root.position.z);
    const tragetVector = new THREE.Vector2(target.x - this.root.position.x, target.z - this.root.position.z);
    const angle = tragetVector.cross(dirVector);
    return angle > 0 ? 1 : -1;
  }
}
