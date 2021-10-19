import * as THREE from 'three';

export default class SoundManager {

  constructor(assets, camera) {
    const listener = new THREE.AudioListener();
    camera.root.add(listener);

    this.playerSword = new THREE.Audio( listener );
    this.playerMob = new THREE.Audio( listener );
    this.playerPlayer = new THREE.Audio( listener );
    this.playerTrigger = new THREE.Audio( listener );
    this.playerDoor = new THREE.Audio( listener );

    const as = assets.sounds;
    this.buffersMove =  [as.move0,as.move1,as.move2];
    this.bufferTrigger =  as.switch0;
    this.buffersDoor =  [as.door0,as.door1];
    this.buffersCutMob =  [as.cut1,as.cut2];
    this.buffersTouchMob =  [as.chocMob3,as.chocMob0];
    this.bufferShield = as.chocShield0;
    this.bufferstoucPlayer =  [as.chocPlayer0,as.chocPlayer1];
  }

  playSword() {
    const buffer = this.buffersMove[Math.floor(Math.random()*this.buffersMove.length)];
    if(this.playerSword.isPlaying)
    this.playerSword.stop();
    this.playerSword.setBuffer( buffer );
    this.playerSword.play();
  }

  playOpen1() {
    this.playerTrigger.setBuffer(  this.bufferTrigger );
    this.playerTrigger.play();
    this.playerDoor.setBuffer(  this.buffersDoor[0] );
    this.playerDoor.play();
  }

  playOpen2() {
    this.playerTrigger.setBuffer(   this.buffersDoor[1] );
    this.playerTrigger.play(0.3);
  }

  playOpen3() {
    this.playerTrigger.setBuffer(   this.bufferTrigger);
    this.playerTrigger.play();
  }


  playCutmob() {
    const buffer = this.buffersCutMob[Math.floor(Math.random()*this.buffersCutMob.length)];
    this.playerMob.setBuffer( buffer );
    this.playerMob.play();
  }

  playHurtmob() {
    const buffer = this.buffersTouchMob[Math.floor(Math.random()*this.buffersTouchMob.length)];
    this.playerMob.setBuffer( buffer );
    this.playerMob.play();
  }

  playShield() {
    if(this.playerPlayer.isPlaying)
    this.playerPlayer.stop();
    this.playerPlayer.setBuffer(   this.bufferShield );
    this.playerPlayer.play();
  }
  
  playHurtPlayer() {

    const buffer = this.bufferstoucPlayer[Math.floor(Math.random()*this.bufferstoucPlayer.length)];
    if(this.playerPlayer.isPlaying)
    this.playerPlayer.stop();
    this.playerPlayer.setBuffer( buffer );
    this.playerPlayer.play();
  }

};
