import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

class View {

  constructor() {
    this.clock = new THREE.Clock(true);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this._resize = this.resize.bind(this);
    window.addEventListener('resize', this._resize);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;
    this.inputs = {
      leftButton1: false,
      leftButton2: false,
      rightButton1: false,
      rightButton2: false
    };
    this._contollers = {
      leftPreviousPos: new THREE.Vector3(),
      rightPreviousPos: new THREE.Vector3(),
      weaponPreviousPos: new THREE.Vector3(),
    };
  }

  async start(assets, config) {
    this.init(assets, config);
    if (!this.camera) return;
    this._camera = this.camera.root;

    if (this.renderer.xr.enabled) {
      this.controllerLeft = this.renderer.xr.getController(0); //on récupère les object3D des controlleurs.
      this.controllerLeft.addEventListener('selectstart', this._onPressLeft1.bind(this));
      this.controllerLeft.addEventListener('selectend', this._onReleaseLeft1.bind(this));
      this.controllerLeft.addEventListener('squeezestart', this._onPressLeft2.bind(this));
      this.controllerLeft.addEventListener('squeezeend', this._onReleaseLeft2.bind(this));
      this.controllerLeft.userData.direction = new THREE.Vector3();
      this.controllerRight = this.renderer.xr.getController(1); //on récupère les object3D des controlleurs.
      this.controllerRight.addEventListener('selectstart', this._onPressRight1.bind(this));
      this.controllerRight.addEventListener('selectend', this._onReleaseRight1.bind(this));
      this.controllerRight.addEventListener('squeezestart', this._onPressRight2.bind(this));
      this.controllerRight.addEventListener('squeezeend', this._onReleaseRight2.bind(this));
      this.controllerRight.userData.direction = new THREE.Vector3();
      this.controllerRight.userData.weaponDirection = new THREE.Vector3();
      this.weaponSensor = new THREE.Object3D(); //on ajoute un object3D à l'extrémité du controlleur pour mesurer la vitesse et l'acc de l'arme.
      this.weaponSensor.position.z = 1;//celui-ci est éloigner pour prendre en compte la vitesse de rotation.
      this.controllerRight.add(this.weaponSensor);

      const reducer = (previousValue, currentValue) => previousValue + currentValue;
      this.weaponSpeedList = []; //il y a trop de bruit dans les mesures, je dois lisser avant de récupérer une valeur de vitesse. 

      this.renderer.setAnimationLoop(() => {
        const dt = this.clock.getDelta();
        this.controllerRight.userData.direction.subVectors(this.controllerRight.position, this._contollers.rightPreviousPos);
        this.controllerRight.userData.speed = this.controllerRight.userData.direction.length() / dt; //vitesse de la main droite
        this._contollers.rightPreviousPos.copy(this.controllerRight.position);

        this.controllerLeft.userData.direction.subVectors(this.controllerLeft.position, this._contollers.leftPreviousPos);
        this.controllerLeft.userData.speed = this.controllerLeft.userData.direction.length() / dt; //vitesse de la main gaucle
        this._contollers.leftPreviousPos.copy(this.controllerLeft.position);

        const weaponPos = this.weaponSensor.getWorldPosition(new THREE.Vector3()); //position de l'arme dans l'espace absolu
        this.controllerRight.userData.weaponDirection.subVectors(weaponPos, this._contollers.weaponPreviousPos); //direction du mouvement de l'arme

        let weaponSpeed = this.controllerRight.userData.weaponDirection.length() / dt; //vitesse durant cette frame

        this.weaponSpeedList.push(weaponSpeed); //on moyenne la vitesse avec les 5 dernières afin d'avoir une progression propre.
        if (this.weaponSpeedList.length > 5) this.weaponSpeedList.shift(); //Jamais plus de 5
        weaponSpeed = this.weaponSpeedList.reduce(reducer) / this.weaponSpeedList.length;

        const weaponAcc = (weaponSpeed - this.controllerRight.userData.weaponSpeed); //accélération de l'arme pour cette frame
        this.controllerRight.userData.weaponSpeed = weaponSpeed;
        this.controllerRight.userData.weaponAcc = weaponAcc;
        this._contollers.weaponPreviousPos.copy(weaponPos);
        this.render();
        this.update(dt);
      });
    } else {
      const update = () => {
        this.requestAnimation = requestAnimationFrame(update);
        this.render();
        this.update(this.clock.getDelta());
      };
      update();
    }

  }

  render() {
    this.renderer.render(this.scene, this._camera);
  }

  resize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }


  dismount() {
    window.removeEventListener('resize', this._resize);
    cancelAnimationFrame(this.requestAnimation);
  }

  _onPressLeft1() {
    this.inputs.leftButton1 = true;
    if (this.onPressLeft1) {
      this.onPressLeft1();
    }
  }

  _onReleaseLeft1() {
    this.inputs.leftButton1 = false;
    if (this.onReleaseLeft1) {
      this.onReleaseLeft1();
    }
  }

  _onPressLeft2() {
    this.inputs.leftButton2 = true;
    if (this.onPressLeft2) {
      this.onPressLeft2();
    }
  }

  _onReleaseLeft2() {
    this.inputs.leftButton2 = false;
    if (this.onReleaseLeft2) {
      this.onReleaseLeft2();
    }
  }

  _onPressRight1() {
    this.inputs.rightButton1 = true;
    if (this.onPressRight1) {
      this.onPressRight1();
    }
  }

  _onReleaseRight1() {
    this.inputs.rightButton1 = false;
    if (this.onReleaseRight1) {
      this.onReleaseRight1();
    }
  }

  _onPressRight2() {
    this.inputs.rightButton2 = true;
    if (this.onPressRight2) {
      this.onPressRight2();
    }
  }

  _onReleaseRight2() {
    this.inputs.rightButton2 = false;
    if (this.onReleaseRight2) {
      this.onReleaseRight2();
    }
  }

}

////////////////FIX////////////////////////////
THREE.Skeleton.prototype.clone = function () {
  const instance = new THREE.Skeleton();
  instance.bones = this.bones.map(bone => {
    const boneClone = new bone.constructor().copy(bone, false);
    boneClone.rotation.copy(bone.rotation);
    return boneClone;
  });
  instance.bones.forEach(bone => {
    const sourceBone = this.getBoneByName(bone.name);
    const parentName = sourceBone.parent.name;
    const parentBone = instance.getBoneByName(parentName);
    if (parentBone) {
      parentBone.add(bone);
    }
  });
  const instance2 = new THREE.Skeleton(instance.bones);
  //fix
  instance2.bones.forEach(b => {
    b.updateWorldMatrix();
  });
  return instance2;
};

export default View;