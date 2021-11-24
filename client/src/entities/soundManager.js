import * as THREE from 'three';

export default class SoundManager {

  constructor(assets, camera) {
    const listener = new THREE.AudioListener();
    camera.root.add(listener);

    this.playerSword = new THREE.Audio(listener);
    this.playerMob = new THREE.Audio(listener);
    this.playerPlayer = new THREE.Audio(listener);
    this.playerTrigger = new THREE.Audio(listener);
    this.playerDoor = new THREE.Audio(listener);
    this.playerWalk = new THREE.Audio(listener);

    const as = assets.sounds;
    this.buffersMove = [as.move1, as.move5, as.move0];
    this.bufferTrigger = as.switch0;
    this.buffersDoor = [as.door0, as.door1];
    this.buffersCutMob = [as.cut1, as.cut2];
    this.buffersTouchMob = [as.chocMob3, as.chocMob0, as.chocMob4];
    this.bufferShield = as.chocShield0;
    this.bufferstoucPlayer = [as.chocPlayer0, as.chocPlayer1];
    this.bufferTakeWeapon = as.takeWeapon;
    this.bufferWalk = as.walk0;

    this.playerWalk.setBuffer(this.bufferWalk);
  }

  playWind(index) {
    if (this.playerSword.isPlaying)
      this.playerSword.stop();
    this.playerSword.setBuffer(this.buffersMove[index]);
    this.playerSword.play();
  }

  playOpen1() {
    this.playerTrigger.setBuffer(this.bufferTrigger);
    this.playerTrigger.play();
    this.playerDoor.setBuffer(this.buffersDoor[0]);
    this.playerDoor.play();
  }

  playOpen2() {
    this.playerTrigger.setBuffer(this.buffersDoor[1]);
    this.playerTrigger.play(0.3);
  }

  playOpen3() {
    this.playerTrigger.setBuffer(this.bufferTrigger);
    this.playerTrigger.play();
  }

  playCutmob() {
    if (this.playerMob.isPlaying)
      this.playerMob.stop();
    const buffer = this.buffersCutMob[Math.floor(Math.random() * this.buffersCutMob.length)];
    console.log(buffer)
    this.playerMob.setBuffer(buffer);
    this.playerMob.play();
  }

  playHurtmob(index) {
    if (this.playerMob.isPlaying)
      this.playerMob.stop();
    this.playerMob.setBuffer(this.buffersTouchMob[index]);
    this.playerMob.play();
  }

  playShield() {
    if (this.playerPlayer.isPlaying)
      this.playerPlayer.stop();
    this.playerPlayer.setBuffer(this.bufferShield);
    this.playerPlayer.play();
  }

  playHurtPlayer() {
    const buffer = this.bufferstoucPlayer[Math.floor(Math.random() * this.bufferstoucPlayer.length)];
    if (this.playerPlayer.isPlaying)
      this.playerPlayer.stop();
    this.playerPlayer.setBuffer(buffer);
    this.playerPlayer.play();
  }

  playTakeWeapon() {
    this.playerTrigger.setBuffer(this.bufferTakeWeapon);
    this.playerTrigger.play();
  }

  playWalk(speed) {
    if (this.playerWalk.isPlaying) {
      this.playerWalk.setPlaybackRate(speed+0.4);
    }else {
      this.playerWalk.setLoop(true);
      this.playerWalk.setPlaybackRate(speed+0.4);
      this.playerWalk.play();
    }
  }

  stopWalk() {
    if (!this.playerWalk.isPlaying) return;
    this.playerWalk.stop();
  }

};
