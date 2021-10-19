import Demo from './views/demo';
import engine from './engine';

window.addEventListener('load', async () => {
  const view = new Demo();
  const mob = await engine.load('assets/mob.glb');
  const level = await engine.load('assets/level.glb');

  const texture = await engine.load('assets/assets.png');
  const textureLight = await engine.load('assets/assetsLight.png');

  const sounds = {};
  sounds.move0 = await engine.load('assets/sounds/move0.mp3');//hammer
  sounds.move1 = await engine.load('assets/sounds/move1.mp3');//sword
  sounds.move5 = await engine.load('assets/sounds/move5.mp3');//stick
  sounds.switch0 = await engine.load('assets/sounds/switch0.mp3');
  sounds.door0 = await engine.load('assets/sounds/door0.mp3');
  sounds.door1 = await engine.load('assets/sounds/door1.mp3');
  sounds.cut1 = await engine.load('assets/sounds/cut1.mp3');
  sounds.cut2 = await engine.load('assets/sounds/cut2.mp3');
  sounds.chocMob3 = await engine.load('assets/sounds/chocMob3.mp3');//sword
  sounds.chocMob0 = await engine.load('assets/sounds/chocMob0.mp3');//stick
  sounds.chocMob4 = await engine.load('assets/sounds/chocMob1.mp3');//hammer
  sounds.chocShield0 = await engine.load('assets/sounds/chocShield0.mp3');
  sounds.chocPlayer0 = await engine.load('assets/sounds/chocPlayer0.mp3');
  sounds.chocPlayer1 = await engine.load('assets/sounds/chocPlayer1.mp3');
  sounds.takeWeapon = await engine.load('assets/sounds/take1.mp3');////take item
  sounds.walk0 = await engine.load('assets/sounds/walk0.mp3');////take item

  const assets = { mob, level, texture, textureLight, sounds };

  await view.start(assets);

});
