import {
  instanceOfOnCancel,
  instanceOfOnDestroy,
  instanceOfOnFinish,
  instanceOfOnInit,
  instanceOfOnLocked,
  instanceOfOnRepeat,
  instanceOfOnStarted,
  instanceOfOnUnLocked,
} from './typings';

export function destroyHook<H>(hookObject: H): void {
  if (instanceOfOnDestroy(hookObject)) {
    hookObject.onDestroy();
  }
}

export function repeatHook<H>(hookObject: H): void {
  if (instanceOfOnRepeat(hookObject)) {
    hookObject.onRepeat();
  }
}

export function lockedHook<H>(hookObject: H): void {
  if (instanceOfOnLocked(hookObject)) {
    hookObject.onLocked();
  }
}

export function unLockedHook<H>(hookObject: H): void {
  if (instanceOfOnUnLocked(hookObject)) {
    hookObject.onUnLocked();
  }
}

export function cancelHook<H>(hookObject: H): void {
  if (instanceOfOnCancel(hookObject)) {
    hookObject.onCancel();
  }
}

export function finishHook<H>(hookObject: H): void {
  if (instanceOfOnFinish(hookObject)) {
    hookObject.onFinish();
  }
}

export function initHook<H>(hookObject: H): void {
  if (instanceOfOnInit(hookObject)) {
    hookObject.onInit();
  }
}

export function startedHook<H>(hookObject: H): void {
  if (instanceOfOnStarted(hookObject)) {
    hookObject.onStarted();
  }
}
