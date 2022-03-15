import { Executor } from '../executor';
import { Operation } from '../operation';
import { BehaviorSubject, of } from 'rxjs';

import {
  OnCancel,
  OnFinish,
  OnInit,
  OnLocked,
  OnRepeat,
  OnStarted,
  OnUnLocked,
} from './../typings';
import { ProcessStatus } from '../typings';

describe('Executor', () => {
  let executor: Executor;
  let result: BehaviorSubject<string>;
  beforeEach(() => {
    executor = new Executor();
    result = new BehaviorSubject<string>('');
    jest.useFakeTimers();
  });
  afterEach(() => {
    executor.onDestroy();
  });

  it('check result for Observable method operation', () => {
    const process = executor.create(of('test'), result);
    process.run();
    jest.runAllTimers();
    expect(result.getValue()).toBe('test');
    expect(process.status()).toBe(ProcessStatus.finished);
  });

  it('check result for Function method operation', () => {
    const process = executor.create(() => of('test'), result);
    process.run();
    jest.runAllTimers();
    expect(result.getValue()).toBe('test');
    expect(process.status()).toBe(ProcessStatus.finished);
  });

  it('check result for class method operation', () => {
    const process = executor.create(
      new (class extends Operation<string> {
        run() {
          return of('test');
        }
      })(),
      result,
    );
    process.run();
    jest.runAllTimers();
    expect(result.getValue()).toBe('test');
    expect(process.status()).toBe(ProcessStatus.finished);
  });

  it('check multi result', () => {
    const process = executor.create(of('test0', 'test1', 'test'), result);
    spyOn(result, 'next').and.callThrough();
    process.run();
    jest.runAllTimers();
    expect(result.getValue()).toBe('test');
    expect(process.status()).toBe(ProcessStatus.finished);
    expect(result.next).toHaveBeenCalledTimes(3);
  });

  it('check destroy', () => {
    executor.onDestroy();
    const process = executor.create(of('test'), result); // Возможно имеет смысл как то в перспективе оповестить что executor больше не функционален
    process.run();
    jest.runAllTimers();
    expect(result.getValue()).toBe('');
  });

  it('check finish', () => {
    const operation = new BehaviorSubject<string>('test');
    const process = executor.create(operation, result);
    process.run();
    jest.runAllTimers();
    expect(process.status()).toBe(ProcessStatus.processing);
    expect(result.getValue()).toBe('test');
    process.repeat();
    jest.runAllTimers();
    expect(process.status()).toBe(ProcessStatus.processing);
    operation.complete();
    expect(process.status()).toBe(ProcessStatus.finished);
  });

  it('check error', () => {
    const operation = new BehaviorSubject<string>('test');
    const process = executor.create(operation, result);
    process.run();
    jest.runAllTimers();
    operation.error('error');
    expect(process.status()).toBe(ProcessStatus.finished);
  });

  it('check status', () => {
    const operation = new BehaviorSubject<string>('test');
    const process = executor.create(operation, result);
    expect(process.status()).toBe(ProcessStatus.creating);
    process.run();
    expect(process.status()).toBe(ProcessStatus.created);
    jest.runAllTimers();
    expect(process.status()).toBe(ProcessStatus.processing);
    process.lock();
    expect(process.status()).toBe(ProcessStatus.wait);
    process.unlock();
    expect(process.status()).toBe(ProcessStatus.created);
    process.repeat();
    expect(process.status()).toBe(ProcessStatus.repeat);
    jest.runAllTimers();
    expect(process.status()).toBe(ProcessStatus.processing);
    process.cancel();
    expect(process.status()).toBe(ProcessStatus.canceled);
  });

  it('check hooks', () => {
    let onFinish = false;
    let onInit = false;
    let onLocked = false;
    let onRepeat = false;
    let onStarted = false;
    let onUnlocked = false;
    const operation = new BehaviorSubject<string>('');
    const process = executor.create(
      new (class
        extends Operation<string>
        implements OnInit, OnRepeat, OnFinish, OnLocked, OnUnLocked, OnStarted {
        onFinish(): void {
          onFinish = true;
        }

        onInit(): void {
          onInit = true;
        }

        onLocked(): void {
          onLocked = true;
        }

        onRepeat(): void {
          onRepeat = true;
        }

        onStarted(): void {
          onStarted = true;
        }

        onUnLocked(): void {
          onUnlocked = true;
        }
        run() {
          return operation;
        }
      })(),
      result,
    );

    expect(onInit).toBeTruthy();
    process.run();
    jest.runAllTimers();
    process.lock();
    jest.runAllTimers();
    process.unlock();
    jest.runAllTimers();
    process.repeat();
    jest.runAllTimers();
    operation.complete();
    jest.runAllTimers();
    expect(onStarted).toBeTruthy();
    expect(onLocked).toBeTruthy();
    expect(onUnlocked).toBeTruthy();
    expect(onRepeat).toBeTruthy();
    expect(onFinish).toBeTruthy();
  });

  it('check hook cancel', () => {
    let onCancel = false;
    const operation = new BehaviorSubject<string>('');
    const process = executor.create(
      new (class extends Operation<string> implements OnCancel {
        onCancel(): void {
          onCancel = true;
        }
        run() {
          return operation;
        }
      })(),
      result,
    );

    process.cancel();
    jest.runAllTimers();
    expect(onCancel).toBeTruthy();
  });
});
