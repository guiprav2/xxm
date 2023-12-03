function xxm(props, children) {
  let div = document.createElement('div');
  div.className = 'xxm';
  if (props.style) { div.style = props.style }
  if (props.bgImage) { div.style.backgroundImage = `url("${props.bgImage}")` }
  if (props.tilesetImage) { div.style.setProperty('--tileset-image', `url("${props.tilesetImage}")`) }
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

xxm.sprite = function(x, y, image, w, h) {
  let div = document.createElement('div');
  div.className = 'sprite';

  for (let [k, v] of Object.entries({ '--x': x, '--y': y, '--xxm-sw': w, '--xxm-sh': h })) {
    div.style.setProperty(k, v);
  }

  let internal = document.createElement('div');
  internal.style.backgroundImage = `url("${image}")`;
  div.append(internal);

  return div;
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

  let dir = sprite.style.getPropertyValue('--xxm-sy') || '0';
  switch (dir) {
    case '0': sprite.style.setProperty('--y', Number(sprite.style.getPropertyValue('--y')) + 1); break;
    case '1': sprite.style.setProperty('--y', Number(sprite.style.getPropertyValue('--y')) - 1); break;
    case '2': sprite.style.setProperty('--x', Number(sprite.style.getPropertyValue('--x')) + 1); break;
    case '3': sprite.style.setProperty('--x', Number(sprite.style.getPropertyValue('--x')) - 1); break;
  }
};

walkFrame();

export default xxm;
