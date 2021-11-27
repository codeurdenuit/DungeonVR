import * as THREE from 'three';

export default function custom() {

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
      b.updateWorldMatrix()
    });

    return instance2;
  }
}
