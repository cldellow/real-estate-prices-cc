var _enabled = true;

export function log() {
  if(_enabled) {
    console.log.apply(null, arguments);
  }
}

export function disableLog() {
  _enabled = false;
}

export function enabled() {
  return _enabled;
}
