import Demo from './views/demo';
import engine from './engine';

window.addEventListener('load', async () => {
  const view = new Demo();
  const mob = await engine.load('assets/mob.glb');
  const level = await engine.load('assets/level.glb');

  const texture = await engine.load('assets/assets.png');
  const textureLight = await engine.load('assets/assetsLight.png');

  const assets = { mob, level, texture, textureLight };

  await view.start(assets);

});
