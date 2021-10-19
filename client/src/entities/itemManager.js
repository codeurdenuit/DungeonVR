import * as THREE from 'three';

const itemsConf = [
  { mesh: 'hammer', x: 73.65, y: -12.09, z: -21.11, indexWeapon: 2 },
  { mesh: 'stick', x: 43, y: -6.35, z: -19.98, indexWeapon: 1 },
  { mesh: 'sword', x: 71.93, y: -15.94, z: 0.78, indexWeapon: 0 },
  { mesh: 'shield', x: 18.79, y: 0, z: -3.483, indexWeapon: -1 },
  { mesh: 'sword', x: 18.79, y: 0, z: 3.483, indexWeapon: 0 },
];

export default class ItemManager {

  constructor(assets, materialRigid, world) {
    this.itemsConf = itemsConf;

    this.items = [];
    for(let i=0; i<itemsConf.length; i++) {
      const item = new THREE.Mesh(assets.socle.geometry, materialRigid.material);
      const weapon = new THREE.Mesh(assets[itemsConf[i].mesh].geometry, materialRigid.material);
      weapon.position.y = 0.5; 
      item.position.set(itemsConf[i].x, itemsConf[i].y, itemsConf[i].z);
      item.add(weapon);
      item.userData.indexWeapon = itemsConf[i].indexWeapon;
      world.add(item);
      item.visible = false;
      this.items.push(item);
    }
  }

  update(dt, player, soundManager) {
    for (let i = 0; i < this.items.length; i++) {//on vérifie la distance de item avec le joueur
      const item = this.items[i];
      const distanceX = Math.abs(player.positionVirtual.x - item.position.x);
      const distanceZ = Math.abs(player.positionVirtual.z - item.position.z);
      if (distanceX < 15 && distanceZ< 15) { //si le joueur arrive à moins de 10m d'un item
        item.visible = true;
      }
      if ( item.children.length &&  distanceX < 0.5 && distanceZ< 0.5) { //si le joueur arrive sur l'item
        item.clear(); //on retire l'arme affichée
        player.takeWeapon(item.userData.indexWeapon, soundManager);
      }

      if(item.visible && item.children[0]) {
        item.children[0].rotateY(dt*Math.PI)
      }
    }
  }
};
