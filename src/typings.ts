import { Process } from './process';
import { Operation } from './operation';
import { Observable, Subject } from 'rxjs';
import { InternalProcess } from './internal-process';

export enum ProcessStatus {
  creating = 'creating', // подготовка - еще не добавлен в executor
  created = 'created', // Создано
  processing = 'processing', // Выполняется
  finished = 'finished', // Завершен
  canceled = 'canceled', //Отменен
  repeat = 'repeat', // повотор процесса
  waiting = 'waiting', // ожидаем чего то
  wait = 'wait',
}

export type OperationFunction<C> = (process: Process) => Observable<C>;

export interface ExecutionContext<C> {
  process: InternalProcess;
  externalProcess: Process;
  operation: Operation<C> | OperationFunction<C> | Observable<C>;
  result: Subject<C>;
  repeated: boolean;
}

export type OperationType<C> = Operation<C> | OperationFunction<C> | Observable<C>;

export interface OnDestroy {
  onDestroy(): void;
}

export interface OnLocked {
  onLocked(): void;
}

export interface OnUnLocked {
  onUnLocked(): void;
}

export interface OnRepeat {
  onRepeat(): void;
}

export interface OnCancel {
  onCancel(): void;
}

export interface OnFinish {
  onFinish(): void;
}

export interface OnStarted {
  onStarted(): void;
}

export interface OnInit {
  onInit(): void;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnDestroy(object: any): object is OnDestroy {
  return 'onDestroy' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnLocked(object: any): object is OnLocked {
  return 'onLocked' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnUnLocked(object: any): object is OnUnLocked {
  return 'onUnLocked' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnRepeat(object: any): object is OnRepeat {
  return 'onRepeat' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnCancel(object: any): object is OnCancel {
  return 'onCancel' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnFinish(object: any): object is OnFinish {
  return 'onFinish' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnStarted(object: any): object is OnStarted {
  return 'onStarted' in object;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function instanceOfOnInit(object: any): object is OnInit {
  return 'onInit' in object;
}
