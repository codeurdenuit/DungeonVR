import Demo from './src/views/demo';
import engine from './src/engine';

window.addEventListener('load', async () => {
  const view = new Demo();

  const mob = await engine.load('mob.glb');
  const level = await engine.load('level.glb');
  const texture = await engine.load('assets.jpg'); //texture color
  const textureLight = await engine.load('assetsLight.png'); //texture luminance 
  const sounds = {};

  //TODO stack all audio files in one file
  sounds.move0 = await engine.load('sounds/move0.mp3');//hammer
  sounds.move1 = await engine.load('sounds/move1.mp3');//sword
  sounds.move5 = await engine.load('sounds/move5.mp3');//stick
  sounds.switch0 = await engine.load('sounds/switch0.mp3');
  sounds.door0 = await engine.load('sounds/door0.mp3');
  sounds.door1 = await engine.load('sounds/door1.mp3');
  sounds.cut1 = await engine.load('sounds/cut1.mp3');
  sounds.cut2 = await engine.load('sounds/cut2.mp3');
  sounds.chocMob3 = await engine.load('sounds/chocMob3.mp3');//sword
  sounds.chocMob0 = await engine.load('sounds/chocMob0.mp3');//stick
  sounds.chocMob4 = await engine.load('sounds/chocMob1.mp3');//hammer
  sounds.chocShield0 = await engine.load('sounds/chocShield0.mp3');
  sounds.chocPlayer0 = await engine.load('sounds/chocPlayer0.mp3');
  sounds.chocPlayer1 = await engine.load('sounds/chocPlayer1.mp3');
  sounds.takeWeapon = await engine.load('sounds/take1.mp3');//take item
  sounds.walk0 = await engine.load('sounds/walk0.mp3');//take item

  const assets = { mob, level, texture, textureLight, sounds };

  await view.start(assets);

});
