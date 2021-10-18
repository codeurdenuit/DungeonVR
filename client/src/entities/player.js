import * as THREE from 'three';

export default class Player {

  constructor(materialRigid, camera) {
    this.root = new THREE.Object3D();  //Object 3D racine de cette instance
    this.root.matrixAutoUpdate = false; //Object ne va jamais se déplacer

    const geometryHandLeft = new THREE.BoxGeometry(0.1, 0.1, 0.1); //geométrie utilisée pour représenter la main gauche du joueur
    const geometryHandRight = new THREE.BoxGeometry(0.06, 0.1, 0.4); //geométrie utilisée pour représenter la main droite du joueur
    geometryHandRight.translate(0, 0, -0.2); //modification du centre de gravité de la géométrie pour symboliser une épée

    this.handLeft = new THREE.Mesh(geometryHandLeft, materialRigid.material); //création du mesh de la main gauche
    this.handRight = new THREE.Mesh(geometryHandRight, materialRigid.material); //création du mesh de la main droite

    this.light = new THREE.PointLight(0xffffff, 1, 30, 5); //création d'une lumière omni pour éclairer le jeu
    this.handLeft.add(this.light); //la luimière est attachée à la main gauche

    this.root.add(this.handLeft); //les meshs sont attachée à l'objet root
    this.root.add(this.handRight);

    this.walkSeed = 3; //vitesse de déplacement du joueur
    this.positionVirtual = new THREE.Vector3();  //position virtuelle du joueur, dans le repère du niveau, le joueur ne se déplace pas
    this.positionVictualCamera = new THREE.Vector3(0, 0, 0);//position virtuelle avec prise en compte du déplacement du casque VR, 0.5=> utilisé pour place le raycasting verticalement
    this.positionCamera = new THREE.Vector3(0, 0.5, 0);//position du casque VR dans la piece, 0.5=> utilisé pour place le raycasting verticalement
    this.direction = new THREE.Vector3(); //diréction de déplacement du joueur
    this.raycasterBody = new THREE.Raycaster(new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0, -1, 0), 0, 1); //détecteur de collision avec le niveau
    this.raycasterHand = new THREE.Raycaster(new THREE.Vector3(0.0, 0, 0), new THREE.Vector3(1.0, 0, 0), 0, 0.4); //détecteur de collision de la main droite

    this.hp = 100; //point de vie du joueur
  }

  update(dt, controllerRight, controllerLeft, inputs, mobs, world, camera) {
    if(this.hp <= 0) return; //un joueur mort ne peut plus intéragir

    this.updateHands(dt, controllerRight, controllerLeft); //processus d'affichage des mains

    this.updatePositionByCamera(camera, world);

    if (inputs.rightButton2) {
      this.updatePosition(dt, world, camera); //processus de déplacement
    }

    if (controllerRight.userData.speed > 2) {//si mouvement brutale 
      this.updateHit(dt, mobs, controllerRight.userData.speed, controllerRight.userData.direction); //processus d'attaque
    }
  }

  updateHands(dt, controllerRight, controllerLeft) { //mise à joueur de la position des mains en fonction du périphérique
    this.handRight.position.copy(controllerRight.position); //on récupére la positon de la main droite
    this.handRight.rotation.copy(controllerRight.rotation); //on récupére l'orientation de la main droite
    this.handRight.rotateX(Math.PI / 6);  //oriention de l'épee de la main droite
    this.handLeft.position.copy(controllerLeft.position); //on récupére la positon de la main gauche
    this.handLeft.rotation.copy(controllerLeft.rotation); //on récupére l'orientation de la main gauche
  }

  updatePositionByCamera(eye) { //Prise en compte des mouvements du casque
    this.positionCamera.x = eye.getPositionX(); //position du casque en absolue
    this.positionCamera.z = eye.getPositionZ();
    this.positionVictualCamera.x = this.positionCamera.x + this.positionVirtual.x; //position du casque dans le niveau
    this.positionVictualCamera.z = this.positionCamera.z + this.positionVirtual.z;
  }


  updatePosition(dt, world, eye) { //simulation du déplacement du joueur
    this.direction.x = this.handRight.position.x - eye.getPositionX(); //direction de déplacement en fonction de la positon de la main droite par rapport au regard
    this.direction.z = this.handRight.position.z - eye.getPositionZ();
    const power = this.direction.length()/0.5;
    const distance = this.walkSeed * dt * power; //distance parcourue
    this.direction.normalize(); //normalisaition du vecteur
    this.positionVirtual.x += this.direction.x * distance; //mise à jour de la position virtuelle du joueur
    this.positionVirtual.z += this.direction.z * distance;
    this.positionVictualCamera.x = eye.getPositionX() + this.positionVirtual.x;//mise à jour de la position du casque dans le niveau
    this.positionVictualCamera.z = eye.getPositionZ() + this.positionVirtual.z;
    world.setPos(this.positionVirtual); //déplacement du monde opposement à cette position virtuelle, c'est le monde qui bouge, pas le joueur
    this.raycasterBody.set(this.positionCamera, new THREE.Vector3(0, -1, 0));
    const col = this.raycasterBody.intersectObject(world.colliderMaster); //on vérifie que le joeur est toujours dans les limites autorisées du décor
    if (!col.length) { //si pas de collision avec le sol
      this.positionVirtual.x -= this.direction.x * distance; //rollback de la position virtuelle
      this.positionVirtual.z -= this.direction.z * distance;
      world.setPos(this.positionVirtual); //rollback de la position du décor
    } else {
      this.positionVirtual.y += col[0].point.y; //si déplacement authorisé, on corrige l'écart de heuteur entre le sol du niveau et le raycaster toujours centré à zero
    }
  }

  updateHit(dt, mobs, speed, direction) { //processus en cas de frappe du joueur
    const matrix = new THREE.Matrix4().extractRotation(this.handRight.matrix); //on extrait la matrice de rotation de la main droite
    const orientation = new THREE.Vector3(0, 0, -1).applyMatrix4(matrix); //on extrait le vecteur directeur
    this.raycasterHand.set(this.handRight.position, orientation); //on met à jour la position du détecteur de collsions

    for (let i = 0; i < mobs.length; i++) { //pour chaque mob instancié
      const colliders = mobs[i].colliders; //on récupère la liste de leurs colliders
      const cols = this.raycasterHand.intersectObjects(colliders, false, ); //on vérifié si il y a collision
      if (cols.length) { //si collision
        const touche = cols[0]; //on récupère la premiere collision
        const indexBone = colliders.indexOf(touche.object); //on récupère l'index du collider pour informer le mob touché
        mobs[i].hurt(direction.normalize(), touche.point, speed, indexBone);//on indique au mob la collision, direction d'attaque, point de collision, vitesse, index du collider
      }
    }
  }

  hurt(position, world) { //le joueur est touché par un mob
    if(this.hp <= 0) return; //un joueur mort ne peut plus être blessé
    const shieldPos =  this.handLeft.position
    const vectorShieldToMob = new THREE.Vector2(position.x-shieldPos.x, position.z-shieldPos.z);
    const vectorshieldToPlayer = new THREE.Vector2(this.positionCamera.x-shieldPos.x, this.positionCamera.z-shieldPos.z);
    const angle = vectorShieldToMob.cross(vectorshieldToPlayer); //angle entre le vecteur bouclier player et le bouclier mob
    if(Math.abs(angle)> 0.2) { //Si angle faible, alors le bouclier est entre le joueur et le mob
      this.hp -= 25;
      if(this.hp>0) {
        world.startHammer(); //tramblement de la caméra
      } else {
        world.gameover(); //fin de partie
      }
    }
  }

  getDistance(target) { //distance entre le joueur et un élément du jeu dans l'espace du niveau, pas dans l'espace absolue
    const dX = Math.abs(this.positionVictualCamera.x - target.x);
    const dZ = Math.abs(this.positionVictualCamera.z - target.z);
    return Math.sqrt(dX * dX + dZ * dZ);
  }

};
