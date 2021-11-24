import * as THREE from 'three';

const itemsConf = [
  { mesh: 'hammer', x: 73.65, y: -12.09, z: -21.11, indexWeapon: 2 },
  { mesh: 'stick', x: 43, y: -6.43, z: -19.98, indexWeapon: 1 },
  { mesh: 'sword', x: 71.93, y: -15.94, z: 0.78, indexWeapon: 0 },
  { mesh: 'shield', x: 18.79, y: 0, z: -3.483, indexWeapon: -1 },
  { mesh: 'sword', x: 18.79, y: 0, z: 3.483, indexWeapon: 0 },
];

export default class ItemManager {

  constructor(assets, materialRigid, world) {
    this.items = [];
    for(let i=0; i<itemsConf.length; i++) { //on parcourt l'objet de configuration
      const item = new THREE.Mesh(assets.socle.geometry, materialRigid.material);  //mesh qui représente le socle où se trouve l'arme
      const weapon = new THREE.Mesh(assets[itemsConf[i].mesh].geometry, materialRigid.material); //géométrie qui représente l'arme à ramasser
      weapon.position.y = 0.5; //l'arme est surelevée 
      item.position.set(itemsConf[i].x, itemsConf[i].y, itemsConf[i].z); //le socle est positionné dans le décor
      item.add(weapon); //l'arme est attaché au mesh du socle
      item.userData.indexWeapon = itemsConf[i].indexWeapon; //index de l'arme pour informer le joueur de l'arme qu'il ramasse
      world.add(item); //le socle est attaché au décor
      item.visible = false; //l'arme n'est pas visible temps que le joueur n'est pas proche de celle-ci (optimisation)
      this.items.push(item); //ajout à la liste des items du niveau
    }
  }

  update(dt, player, soundManager) {
    for (let i = 0; i < this.items.length; i++) { //on vérifie la distance de l'item avec le joueur
      const item = this.items[i];
      const distanceX = Math.abs(player.positionVirtual.x - item.position.x);
      const distanceZ = Math.abs(player.positionVirtual.z - item.position.z);
      if (distanceX < 15 && distanceZ< 15) { //si le joueur arrive à moins de 15m d'un item
        item.visible = true; //l'item est affiché et charger dans la scène
      }
      if ( item.children.length &&  distanceX < 0.5 && distanceZ< 0.5) { //si le joueur arrive sur l'item
        item.clear(); //on retire l'item' de la scène
        player.takeWeapon(item.userData.indexWeapon, soundManager); //on informe l'instance du joueur de l'acquisition
      }

      if(item.visible && item.children[0]) { //rotation des armes visibles
        item.children[0].rotateY(dt*Math.PI)
      }
    }
  }
};
