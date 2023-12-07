function xxm(width, height, props, children) {
  let div = document.createElement('div');
  div.className = 'xxm';
  if (props.style) { div.style = props.style }
  div.style.width = width;
  div.style.height = height;
  div.state = { editMode: props.editMode };
  div.append(...children);
  xxm.root = div;
  return div;
}

xxm.map = function(props, children) {
  let div = document.createElement('div');
  div.className = 'map';
  if (props.style) { div.style = props.style }
  if (props.bgImage) { div.style.backgroundImage = `url("${props.bgImage}")` }
  if (props.tilesetImage) { div.style.setProperty('--tileset-image', `url("${props.tilesetImage}")`) }
  div.roadblocks = props.roadblocks;
  div.append(...children);
  requestAnimationFrame(() => {
    if (xxm.root.state.editMode) {
      let cursor = document.createElement('div');
      cursor.className = 'cursor';
      div.append(cursor);
      div.addEventListener('mousemove', xxm.map.onMouseMove);
      xxm.root.state.editModeCursor = cursor;
    }
  });
  return div;
};

xxm.map.setCursor = function(div) {
  let { editModeCursor } = xxm.root.state;
  editModeCursor.innerHTML = '';
  editModeCursor.append(div);
};

xxm.map.onMouseMove = function(ev) {
  let { clientX, clientY } = ev;
  let { editModeCursor } = xxm.root.state;
  let rect = xxm.root.getBoundingClientRect();
  let x = Math.floor((clientX - rect.left) / 32);
  let y = Math.floor((clientY - rect.top) / 32);
  editModeCursor.style.setProperty('--x', x);
  editModeCursor.style.setProperty('--y', y);
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

  for (let [k, v] of Object.entries({ '--x': x, '--y': y, '--sw': w, '--sh': h })) {
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
  let map = sprite.closest('.map');
  let sx = Number(sprite.style.getPropertyValue('--x'));
  let sy = Number(sprite.style.getPropertyValue('--y'));
  let dir = sprite.style.getPropertyValue('--sy') || '0';

  for (let tile of xxm.findTiles(map, sx, sy)) {
    let tx = Number(tile.style.getPropertyValue('--tx'));
    let ty = Number(tile.style.getPropertyValue('--ty'));
    let roadblocks = map.roadblocks[ty][tx] || 'OOOO';
    if (roadblocks[dir] === 'X') { return false }
  }

  let nsx = sx, nsy = sy, incomingDir;
  switch (dir) {
    case '0': nsy++; incomingDir = 1; break;
    case '1': nsy--; incomingDir = 0; break;
    case '2': nsx++; incomingDir = 3; break;
    case '3': nsx--; incomingDir = 2; break;
  }

  for (let tile of xxm.findTiles(map, nsx, nsy)) {
    let tx = Number(tile.style.getPropertyValue('--tx'));
    let ty = Number(tile.style.getPropertyValue('--ty'));
    let roadblocks = map.roadblocks[ty][tx] || 'OOOO';
    if (roadblocks[incomingDir] === 'X') { return false }
  }

  return !xxm.findSprite(map, nsx, nsy);
};

xxm.sprite.animate = function(sprite, anim) {
  let resolve, promise = new Promise(res => resolve = res);
  let classNames = ['animate__animated', `animate__${anim}`];
  sprite.classList.add(...classNames);
  sprite.addEventListener('animationend', () => {
    sprite.classList.remove(...classNames);
    resolve();
  }, { once: true });
  return promise;
};

xxm.sprite.step = function(sprite, dir, manageClassName = true) {
  let resolve, promise = new Promise(res => resolve = res);
  if (Number(dir) < 10) {
    sprite.style.setProperty('--sy', dir);
    manageClassName && sprite.classList.add('walking');
    switch (String(dir)) {
      case '0': sprite.style.setProperty('--y', Number(sprite.style.getPropertyValue('--y')) + 1); break;
      case '1': sprite.style.setProperty('--y', Number(sprite.style.getPropertyValue('--y')) - 1); break;
      case '2': sprite.style.setProperty('--x', Number(sprite.style.getPropertyValue('--x')) + 1); break;
      case '3': sprite.style.setProperty('--x', Number(sprite.style.getPropertyValue('--x')) - 1); break;
    }
    sprite.addEventListener('transitionend', () => {
      manageClassName && sprite.classList.remove('walking');
      resolve();
    }, { once: true });
  } else {
    sprite.style.setProperty('--sy', Number(dir) - 10);
    resolve();
  }
  return promise;
};

xxm.sprite.walk = async function(sprite, route) {
  sprite.classList.add('walking');
  for (let dir of route) {
    await xxm.sprite.step(sprite, dir, false);
  }
  sprite.classList.remove('walking');
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
    case 'z': xxm.onAction(); break;
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
  let root = sprite?.closest?.('.xxm');
  if (!sprite || sprite.classList.contains('walking') || root.classList.contains('locked')) { return }

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
    case 'down': sprite.style.setProperty('--sy', 0); break;
    case 'up': sprite.style.setProperty('--sy', 1); break;
    case 'right': sprite.style.setProperty('--sy', 2); break;
    case 'left': sprite.style.setProperty('--sy', 3); break;
  }

  if (xxm.spriteUnblocked(sprite)) {
    let dir = sprite.style.getPropertyValue('--sy') || '0';
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
  let root = sprite?.closest?.('.xxm');
  if (!sprite || sprite.classList.contains('walking') || root.classList.contains('locked')) { return }

  let sx = Number(sprite.style.getPropertyValue('--x'));
  let sy = Number(sprite.style.getPropertyValue('--y'));
  let dir = sprite.style.getPropertyValue('--sy') || '0';
  let nsx = sx, nsy = sy;
  switch (dir) {
    case '0': nsy++; break;
    case '1': nsy--; break;
    case '2': nsx++; break;
    case '3': nsx--; break;
  }

  let sprite2 = xxm.findSprite(root, nsx, nsy);
  root.classList.add('locked');
  await sprite2?.props?.onAction?.();
  root.classList.remove('locked');
};

xxm.ui = function() {
  let div = document.createElement('div');
  div.className = 'ui';
  //requestAnimationFrame(() => xxm.ui.msgbox('This is an example message.'));
  xxm.ui.el = div;
  return div;
};

xxm.ui.msgbox = function(text) {
  let div = document.createElement('div');
  div.className = 'msgbox';
  let resolve, promise = new Promise(res => resolve = res);
  div.state = { i: 0, text, resolve };
  requestAnimationFrame(() => msgboxFrame(div));
  xxm.ui.el.append(div);
  return promise;
};

function msgboxFrame(div) {
  let { state } = div;
  if (div.classList.contains('done')) { return }
  requestAnimationFrame(() => msgboxFrame(div));
  let root = div.closest('.xxm');
  state.i++;
  div.textContent = state.text.slice(0, state.i);

  if (div.textContent.length >= state.text.length) {
    let cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = ' ▼';
    div.append(cursor);
    div.classList.add('done');
    msgboxFrame.done = div;
    addEventListener('keydown', msgboxFrame.onKeyDown);
  }
}

msgboxFrame.onKeyDown = function(ev) {
  if (ev.key !== 'z') { return }
  let { done } = msgboxFrame;
  done.remove();
  removeEventListener('keydown', msgboxFrame.onKeyDown);
  done.state.resolve();
};

xxm.playSound = function(url) {
  let audio = document.createElement('audio');
  let resolve, promise = new Promise(res => resolve = res);
  audio.src = url;
  audio.autoplay = true;
  xxm.ui.el.append(audio);
  audio.addEventListener('ended', () => {
    audio.remove();
    resolve();
  }, { once: true });
  return promise;
};

export default xxm;
