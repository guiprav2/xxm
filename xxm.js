function xxm(props, children) {
  let div = document.createElement('div');
  div.className = 'xxm';
  if (props.style) { div.style = props.style }
  if (props.bgImage) { div.style.backgroundImage = `url("${props.bgImage}")` }
  if (props.tilesetImage) { div.style.setProperty('--tileset-image', `url("${props.tilesetImage}")`) }
  div.roadblocks = props.roadblocks;
  div.append(...children);
  return div;
}

xxm.layer = function(children) {
  let div = document.createElement('div');
  div.className = 'layer';
  div.append(...children);
  return div;
};

xxm.tile = function(x, y, tx, ty) {
  let div = document.createElement('div');
  div.className = 'tile';

  for (let [k, v] of Object.entries({ '--x': x, '--y': y, '--tx': tx, '--ty': ty })) {
    div.style.setProperty(k, v);
  }

  return div;
};

xxm.findTiles = function(root, x, y) {
  let tiles = [];
  for (let tile of root.querySelectorAll('.tile')) {
    let x2 = Number(tile.style.getPropertyValue('--x'));
    let y2 = Number(tile.style.getPropertyValue('--y'));
    if (x === x2 && y === y2) { tiles.push(tile) }
  }
  return tiles;
};

xxm.sprite = function(x, y, image, w, h, props) {
  let div = document.createElement('div');
  div.className = 'sprite';
  div.props = props;

  for (let [k, v] of Object.entries({ '--x': x, '--y': y, '--xxm-sw': w, '--xxm-sh': h })) {
    div.style.setProperty(k, v);
  }

  let internal = document.createElement('div');
  internal.style.backgroundImage = `url("${image}")`;
  div.append(internal);

  return div;
};

xxm.findSprite = function(root, x, y) {
  for (let sprite of root.querySelectorAll('.sprite')) {
    let x2 = Number(sprite.style.getPropertyValue('--x'));
    let y2 = Number(sprite.style.getPropertyValue('--y'));
    if (x === x2 && y === y2) { return sprite }
  }
  return null;
};

xxm.spriteUnblocked = function(sprite) {
  let root = sprite.closest('.xxm');
  let sx = Number(sprite.style.getPropertyValue('--x'));
  let sy = Number(sprite.style.getPropertyValue('--y'));
  let dir = sprite.style.getPropertyValue('--xxm-sy') || '0';

  for (let tile of xxm.findTiles(root, sx, sy)) {
    let tx = Number(tile.style.getPropertyValue('--tx'));
    let ty = Number(tile.style.getPropertyValue('--ty'));
    let roadblocks = root.roadblocks[ty][tx] || 'OOOO';
    if (roadblocks[dir] === 'X') { return false }
  }

  let nsx = sx, nsy = sy, incomingDir;
  switch (dir) {
    case '0': nsy++; incomingDir = 1; break;
    case '1': nsy--; incomingDir = 0; break;
    case '2': nsx++; incomingDir = 3; break;
    case '3': nsx--; incomingDir = 2; break;
  }

  for (let tile of xxm.findTiles(root, nsx, nsy)) {
    let tx = Number(tile.style.getPropertyValue('--tx'));
    let ty = Number(tile.style.getPropertyValue('--ty'));
    let roadblocks = root.roadblocks[ty][tx] || 'OOOO';
    if (roadblocks[incomingDir] === 'X') { return false }
  }

  return !xxm.findSprite(root, nsx, nsy);
};

xxm.hero = function(spr) {
  spr.classList.add('hero');
  xxm.hero.sprite = spr;
  return spr;
};

let kbdst = {};

addEventListener('keydown', ev => {
  switch (ev.key) {
    case 'ArrowDown': kbdst.down ??= 0; kbdst.down++; kbdst.last = 'down'; break;
    case 'ArrowUp': kbdst.up ??= 0; kbdst.up++; kbdst.last = 'up'; break;
    case 'ArrowRight': kbdst.right ??= 0; kbdst.right++; kbdst.last = 'right'; break;
    case 'ArrowLeft': kbdst.left ??= 0; kbdst.left++; kbdst.last = 'left'; break;
    case 'x': xxm.onAction(); break;
    default: return;
  }
});

addEventListener('keyup', ev => {
  switch (ev.key) {
    case 'ArrowDown': kbdst.down = 0; if (kbdst.last === 'down') { kbdst.last = null } break;
    case 'ArrowUp': kbdst.up = 0; if (kbdst.last === 'up') { kbdst.last = null } break;
    case 'ArrowRight': kbdst.right = 0; if (kbdst.last === 'right') { kbdst.last = null } break;
    case 'ArrowLeft': kbdst.left = 0; if (kbdst.last === 'left') { kbdst.last = null } break;
    default: return;
  }
});

function walkFrame() {
  requestAnimationFrame(walkFrame);

  let { sprite } = xxm.hero;
  if (!sprite || sprite.classList.contains('walking')) { return }

  if (kbdst[kbdst.last]) {
    sprite.classList.add('walking');
    walkFrame.onTransition({ target: sprite });
    sprite.addEventListener('transitionend', walkFrame.onTransition);
  }
}

walkFrame.onTransition = ev => {
  let sprite = ev.target;

  if (!kbdst.last) {
    sprite.classList.remove('walking');
    sprite.removeEventListener('transitionend', walkFrame.onTransition);
    return;
  }

  switch (kbdst.last) {
    case 'down': sprite.style.setProperty('--xxm-sy', 0); break;
    case 'up': sprite.style.setProperty('--xxm-sy', 1); break;
    case 'right': sprite.style.setProperty('--xxm-sy', 2); break;
    case 'left': sprite.style.setProperty('--xxm-sy', 3); break;
  }

  if (xxm.spriteUnblocked(sprite)) {
    let dir = sprite.style.getPropertyValue('--xxm-sy') || '0';
    switch (dir) {
      case '0': sprite.style.setProperty('--y', Number(sprite.style.getPropertyValue('--y')) + 1); break;
      case '1': sprite.style.setProperty('--y', Number(sprite.style.getPropertyValue('--y')) - 1); break;
      case '2': sprite.style.setProperty('--x', Number(sprite.style.getPropertyValue('--x')) + 1); break;
      case '3': sprite.style.setProperty('--x', Number(sprite.style.getPropertyValue('--x')) - 1); break;
    }
  } else {
    sprite.classList.remove('walking');
    sprite.removeEventListener('transitionend', walkFrame.onTransition);
  }
};

walkFrame();

xxm.onAction = async function() {
  let { sprite } = xxm.hero;
  if (!sprite || sprite.classList.contains('walking')) { return }

  let sx = Number(sprite.style.getPropertyValue('--x'));
  let sy = Number(sprite.style.getPropertyValue('--y'));
  let dir = sprite.style.getPropertyValue('--xxm-sy') || '0';
  let nsx = sx, nsy = sy;
  switch (dir) {
    case '0': nsy++; break;
    case '1': nsy--; break;
    case '2': nsx++; break;
    case '3': nsx--; break;
  }

  let root = sprite.closest('.xxm');
  let sprite2 = xxm.findSprite(root, nsx, nsy);
  await sprite2?.props?.onAction?.();
};

export default xxm;
