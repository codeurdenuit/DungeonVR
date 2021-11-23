import * as THREE from 'three';

const geometryCollier = new THREE.BoxGeometry();
geometryCollier.scale(0.5, 0.5, 0.1); //utiliser pour détecter les frappes de l'épee sur le bouclier

export default class Player {

  constructor(materialRigid, assets, materialInvisible) {
    this.root = new THREE.Object3D();  //Object 3D racine de cette instance
    this.root.matrixAutoUpdate = false; //Optimisation, root ne va ne va jamais se déplacer

    this.weapons = [ //meshs des armes utilisables
      new THREE.Mesh(assets.sword.geometry, materialRigid.material),
      new THREE.Mesh(assets.stick.geometry, materialRigid.material),
      new THREE.Mesh(assets.hammer.geometry, materialRigid.material)
    ];
    this.damages = [45, 20, 80]; //valeur de dégâts des armes
    this.currentWeaponIndex = 1; //index d'arme active par defaut

    this.shield = new THREE.Mesh(assets.shield.geometry, materialRigid.material); //création du mesh de la main gauche
    this.lantern = new THREE.Mesh(assets.lantern.geometry, materialRigid.material);  //création du mesh de la lanterne
    this.light = new THREE.PointLight(0xffffff, 1.2, 33, 5); //création d'une lumière omni pour éclairer le jeu

    this.handLeft = new THREE.Object3D(); //en début de partie, le joueur a la main gauche sans bouclier
    this.handLeft.add(this.lantern); //la lanterne est attachée à la main gauche
    this.lantern.add(this.light); //la lumière est attachée à la lanterne
    this.handRight = this.weapons[this.currentWeaponIndex]; //ajout du mesh de la main droite, arme actuellement active
    this.light.position.y = 1; //l'éclairage est meilleur s'il est placé au-dessus du joueur

    this.root.add(this.handLeft); //les meshs des mains sont attachées à l'objet root
    this.root.add(this.handRight);

    this.walkSeed = 3; //vitesse de déplacement du joueur
    this.positionVirtual = new THREE.Vector3();  //position virtuelle du joueur, dans le repère du niveau, le joueur ne se déplace pas
    this.positionVictualCamera = new THREE.Vector3(0, 0, 0); //position virtuelle avec prise en compte du déplacement du casque VR
    this.positionCamera = new THREE.Vector3(0, 0.5, 0); //position du casque VR dans la piece, 0.5=> utilisé pour place le raycasting verticalement
    this.direction = new THREE.Vector3(); //direction de déplacement du joueur
    this.raycasterBody = new THREE.Raycaster(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), 0, 2); //détecteur de collision avec le niveau
    this.raycasterHand = new THREE.Raycaster(new THREE.Vector3(0.0, 0, 0), new THREE.Vector3(1.0, 0, 0), 0, 0.4); //détecteur de collision de la main droite

    this.hp = 100; //point de vie du joueur
    this.colliderShield = new THREE.Mesh(geometryCollier, materialInvisible.material); //pour frapper le bouclier, juste pour le fun XD
    this.previousSpeed = 0; //utiliser pour ne jouer le son de l'épée qu'en début de mouvement.
  }

  takeWeapon(index, soundManager) {
    if (index !== -1) { //si c'est une arme
      if (this.handRight) { //l'arme précèdente est retiré du jeu
        this.handRight.removeFromParent();
      }
      this.handRight = this.weapons[index]; //le nouveau mesh d'arme devient la main droite
      this.root.add(this.handRight); //la nouvelle main droite est attachée au joueur
      this.currentWeaponIndex = index; //on met à jour l'index d'arme correspondant
      soundManager.playTakeWeapon(); //son de changement d'arme
    } else { //si c'est un bouclier
      this.handLeft.removeFromParent(); //on retire l'object Invisible de la scene
      this.handLeft = this.shield; //le bouclier devient la main gauche
      this.root.add(this.handLeft); //il est ajouter au joueur
      this.lantern.position.y = -0.35; //la lanterne est placée plus bas
      this.handLeft.add(this.lantern); //elle est attachée au bouclier
      this.handLeft.add(this.colliderShield); //on ajoute le collider du bouclier
      soundManager.playTakeWeapon(); //son de changement d'arme
    }
  }

  update(dt, controllerRight, controllerLeft, inputs, mobs, world, camera, soundManager) {
    if (this.hp <= 0) return; //un joueur mort ne peut plus intéragir

    this.updateHands(dt, controllerRight, controllerLeft); //processus d'affichage des mains

    this.updatePositionByCamera(camera, world);

    if (inputs.rightButton1) {
      this.updatePosition(dt, world, camera, soundManager, 1); //déplacement vers l'avant
    } else if (inputs.rightButton2) {
      this.updatePosition(dt, world, camera, soundManager, -1); //déplacement vers l'arrière
    } else {
      soundManager.stopWalk(); //la boucle sonore est stoppée
    }

    if (controllerRight.userData.weaponSpeed > 8) { //si mouvement brutal, il est considéré  comme un coup, je n'utilise pas l'accélération car instable
      if (this.previousSpeed === 0) { //si début d'accélération alors le son est joué.
        this.previousSpeed = controllerRight.userData.weaponSpeed; //mise à jour de la variable afin d'éviter de relancer le son au cours du mouvement
        soundManager.playWind(this.currentWeaponIndex); //bruitage du mouvement
      }
      this.updateHit(dt, mobs, controllerRight.userData.weaponSpeed, controllerRight.userData.weaponDirection, soundManager); //processus d'attaque
    } else {
      this.previousSpeed = 0; //si vitesse de l'arme trop faible, vitesse considérée comme nulle.
    }
  }

  updateHands(dt, controllerRight, controllerLeft) { //mise à joueur de la position des mains en fonction du périphérique
    this.handRight.position.copy(controllerRight.position); //on récupére la positon de la main droite
    this.handRight.rotation.copy(controllerRight.rotation); //on récupére l'orientation de la main droite
    this.handRight.rotateX(Math.PI / 6);  //oriention de l'épee de la main droite
    this.handLeft.position.copy(controllerLeft.position); //on récupére la positon de la main gauche
    this.handLeft.rotation.copy(controllerLeft.rotation); //on récupére l'orientation de la main gauche
    this.lantern.lookAt(new THREE.Vector3(0, 0, -10));  //lanterne toujours verticale
  }

  updatePositionByCamera(eye) { //prise en compte des mouvements du casque
    this.positionCamera.x = eye.getPositionX(); //position du casque en absolu
    this.positionCamera.z = eye.getPositionZ();
    this.positionVictualCamera.x = this.positionCamera.x + this.positionVirtual.x; //position du casque dans le niveau
    this.positionVictualCamera.y = this.positionCamera.y + this.positionVirtual.y;
    this.positionVictualCamera.z = this.positionCamera.z + this.positionVirtual.z;
  }


  updatePosition(dt, world, eye, soundManager, way) { //simulation du déplacement du joueur
    this.direction.x = this.handRight.position.x - eye.getPositionX(); //direction de déplacement en fonction de la positon de la main droite par rapport au regard
    this.direction.z = this.handRight.position.z - eye.getPositionZ();
    const power = this.direction.length() / 0.7;
    const distance = way * this.walkSeed * dt * power; //distance parcourue
    distance > 0.001 ? soundManager.playWalk() : soundManager.stopWalk();
    this.direction.normalize(); //normalisaition du vecteur
    this.positionVirtual.x += this.direction.x * distance; //mise à jour de la position virtuelle du joueur
    this.positionVirtual.z += this.direction.z * distance;
    this.positionVictualCamera.x = eye.getPositionX() + this.positionVirtual.x; //mise à jour de la position virtuelle du casque
    this.positionVictualCamera.z = eye.getPositionZ() + this.positionVirtual.z;
    world.setPos(this.positionVirtual); //déplacement du monde opposement à cette position virtuelle, c'est le monde qui bouge, pas le joueur
    this.raycasterBody.set(this.positionCamera, new THREE.Vector3(0, -1, 0)); //mise à jour du raycaster par rapport à la position du casque
    const col = this.raycasterBody.intersectObject(world.colliderMaster); //on vérifie que le joueur est toujours dans les limites autorisées du décor
    if (!col.length) { //si pas de collision avec le sol
      this.positionVirtual.x -= this.direction.x * distance; //rollback de la position virtuelle
      this.positionVirtual.z -= this.direction.z * distance;
      world.setPos(this.positionVirtual); //rollback de la position du décor
    } else {
      this.positionVirtual.y += col[0].point.y; //si déplacement authorisé, on corrige l'écart de hauteur entre le sol du niveau et le raycaster toujours centré à zero
    }
  }

  updateHit(dt, mobs, speed, direction, soundManager) { //processus en cas de frappe du joueur
    const matrix = new THREE.Matrix4().extractRotation(this.handRight.matrix); //on extrait la matrice de rotation de la main droite
    const orientation = new THREE.Vector3(0, 0, -1).applyMatrix4(matrix); //on extrait le vecteur directeur
    this.raycasterHand.set(this.handRight.position, orientation); //on met à jour la position du détecteur de collision

    for (let i = 0; i < mobs.length; i++) { //pour chaque mob instancié
      const colliders = mobs[i].colliders; //on récupère la liste de leurs colliders
      const cols = this.raycasterHand.intersectObjects(colliders, false,); //on vérifié si il y a collision
      if (cols.length) { //si collision
        const touche = cols[0]; //on récupère la premiere collision
        const indexBone = colliders.indexOf(touche.object); //on récupère l'index du collider pour informer le mob touché
        const damage = this.damages[this.currentWeaponIndex]; //dommage correspondant à l'arme utilisée
        mobs[i].hurt(direction.normalize(), touche.point, speed, indexBone, soundManager, this.currentWeaponIndex, damage); //on indique au mob la collision, direction d'attaque, point de collision, vitesse, index du collider
      }
    }

    const col = this.raycasterHand.intersectObject(this.colliderShield, false); //si le joueur frappe son bouclier
    if (col.length) {
      soundManager.playShield(); // bruitage de collision
    }
  }

  hurt(position, world, soundManager) { //le joueur est touché par un mob
    if (this.hp <= 0) return; //un joueur mort ne peut plus être blessé
    const shieldPos = this.handLeft.position
    const vectorShieldToMob = new THREE.Vector2(position.x - shieldPos.x, position.z - shieldPos.z);
    const vectorshieldToPlayer = new THREE.Vector2(this.positionCamera.x - shieldPos.x, this.positionCamera.z - shieldPos.z);
    const angle = vectorShieldToMob.cross(vectorshieldToPlayer); //angle entre le vecteur bouclier player et le bouclier mob
    if (Math.abs(angle) > 0.2) { //si angle faible, alors le bouclier est entre le joueur et le mob
      this.hp -= 25;
      if (this.hp > 0) {
        world.startHammer(); //tremblement de la caméra
      } else {
        soundManager.stopWalk();
        world.gameover(); //fin de partie
      }
      soundManager.playHurtPlayer();
    } else {
      soundManager.playShield();
    }
  }

  getDistance(target) { //distance entre le joueur et un élément du jeu dans l'espace du niveau, pas dans l'espace absolu
    const dX = Math.abs(this.positionVictualCamera.x - target.x);
    const dY = Math.abs(this.positionVictualCamera.y - target.y);
    const dZ = Math.abs(this.positionVictualCamera.z - target.z);
    return Math.sqrt(dX * dX + dZ * dZ + dY * dY);
  }
};
