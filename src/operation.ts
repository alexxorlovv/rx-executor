import { Observable } from 'rxjs';
import { Process } from './process';
import { OnDestroy } from './typings';

export interface IProcessInjector {
  process?: Process;
  setProcess(process: Process): void;
}

export abstract class ProcessInjector implements IProcessInjector {
  process?: Process;
  setProcess(process: Process): void {
    this.process = process;
  }
}

export abstract class Operation<C> extends ProcessInjector implements OnDestroy {
  abstract run(): Observable<C>;

  onDestroy(): void {
    this.process?.cancel();
  }
}
