import { Process } from '../process';
import { ProcessStatus } from '../typings';
import { InternalProcess } from '../internal-process';

describe('Process', () => {
  let process: Process;
  let internalProcess: InternalProcess;

  beforeEach(() => {
    internalProcess = new InternalProcess();
    process = new Process(internalProcess);
  });

  it('check init', () => {
    expect(process.status()).toBe(ProcessStatus.creating);
  });

  it('check locked', () => {
    internalProcess.locked();
    expect(process.status()).toBe(ProcessStatus.wait);
  });

  it('check lock', () => {
    process.lock();
    expect(process.status()).toBe(ProcessStatus.waiting);
  });

  it('check unlock', () => {
    process.unlock();
    expect(process.status()).toBe(ProcessStatus.created);
  });

  it('check run', () => {
    process.run();
    expect(process.status()).toBe(ProcessStatus.created);
  });

  it('check repeat', () => {
    process.repeat();
    expect(process.status()).toBe(ProcessStatus.repeat);
  });

  it('check canceled', () => {
    process.cancel();
    expect(process.status()).toBe(ProcessStatus.canceled);
  });

  it('check finish', () => {
    internalProcess.finish();
    expect(process.status()).toBe(ProcessStatus.finished);
  });

  it('check allowed$ for status waiting', () => {
    let isAllowed = false;
    process.lock();
    const sub = process.allowed$.subscribe((status) => (isAllowed = status));
    expect(isAllowed).toBeFalsy();
    sub.unsubscribe();
  });

  it('check allowed$ for status locked', () => {
    let isAllowed = false;
    internalProcess.locked();
    const sub = process.allowed$.subscribe((status) => (isAllowed = status));
    expect(isAllowed).toBeFalsy();
    sub.unsubscribe();
  });

  it('check allowed$ for init status', () => {
    let isAllowed = false;
    const sub = process.allowed$.subscribe((status) => (isAllowed = status));
    expect(isAllowed).toBeFalsy();
    sub.unsubscribe();
  });

  it('check allowed$ for true', () => {
    let isAllowed = false;
    process.run();
    const sub = process.allowed$.subscribe((status) => (isAllowed = status));
    expect(isAllowed).toBeTruthy();
    sub.unsubscribe();
  });

  it('check locked$', () => {
    let isAllowed = false;
    process.lock();
    const sub = process.locked$.subscribe(() => (isAllowed = true));
    expect(isAllowed).toBeTruthy();
    sub.unsubscribe();
  });

  it('check canceled$', () => {
    let isAllowed = false;
    process.cancel();
    const sub = process.canceled$.subscribe(() => (isAllowed = true));
    expect(isAllowed).toBeTruthy();
    sub.unsubscribe();
  });

  it('check repeated$', () => {
    let isAllowed = false;
    process.repeat();
    const sub = process.repeated$.subscribe(() => (isAllowed = true));
    expect(isAllowed).toBeTruthy();
    sub.unsubscribe();
  });

  it('check finished$', () => {
    let isAllowed = false;
    internalProcess.finish();
    const sub = process.finished$.subscribe(() => (isAllowed = true));
    expect(isAllowed).toBeTruthy();
    sub.unsubscribe();
  });

  it('check created$', () => {
    let isAllowed = false;
    process.run();
    const sub = process.created$.subscribe(() => (isAllowed = true));
    expect(isAllowed).toBeTruthy();
    sub.unsubscribe();
  });

  it('check non change status for finish', () => {
    internalProcess.finish();
    process.lock();
    expect(process.status()).toBe(ProcessStatus.finished);
  });
  it('check non change status for cancel', () => {
    process.cancel();
    process.lock();
    expect(process.status()).toBe(ProcessStatus.canceled);
  });
});
