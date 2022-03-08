import Demo from './views/demo';
import { load } from './components/loader';

window.addEventListener('load', async () => {
  const view = new Demo();

  const mob = await load('mob.glb');
  const level = await load('level.glb');
  const texture = await load('assets.jpg'); //texture color
  const textureLight = await load('assetsLight.png'); //texture luminance 
  const sounds = {};

  //TODO stack all audio files in one file
  sounds.move0 = await load('sounds/move0.mp3');//hammer
  sounds.move1 = await load('sounds/move1.mp3');//sword
  sounds.move5 = await load('sounds/move5.mp3');//stick
  sounds.switch0 = await load('sounds/switch0.mp3');
  sounds.door0 = await load('sounds/door0.mp3');
  sounds.door1 = await load('sounds/door1.mp3');
  sounds.cut1 = await load('sounds/cut1.mp3');
  sounds.cut2 = await load('sounds/cut2.mp3');
  sounds.chocMob3 = await load('sounds/chocMob3.mp3');//sword
  sounds.chocMob0 = await load('sounds/chocMob0.mp3');//stick
  sounds.chocMob4 = await load('sounds/chocMob1.mp3');//hammer
  sounds.chocShield0 = await load('sounds/chocShield0.mp3');
  sounds.chocPlayer0 = await load('sounds/chocPlayer0.mp3');
  sounds.chocPlayer1 = await load('sounds/chocPlayer1.mp3');
  sounds.takeWeapon = await load('sounds/take1.mp3');//take item
  sounds.walk0 = await load('sounds/walk0.mp3');//take item

  const assets = { mob, level, texture, textureLight, sounds };

  await view.start(assets);

});
