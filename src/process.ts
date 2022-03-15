import { InternalProcess } from './internal-process';
import { ProcessStatus } from './typings';

/*
 * Process - отвечает за доступ к внутреннему процессу
 * с ограниченными возможностями
 * */
export class Process {
  /**
   * Слушатель - на доступность к выполнению
   * @type {Observable<true>}
   */
  allowed$ = this.process.allowed$;

  /**
   * Слушатель - на блок процесса
   * @type {Observable<ProcessStatus>}
   */
  locked$ = this.process.locked$;

  /**
   * Слушатель на отмену процесса
   * @type {Observable<ProcessStatus>}
   */
  canceled$ = this.process.canceled$;

  /**
   * Слушатель на повтор процесса
   * @type {Observable<ProcessStatus>}
   */
  repeated$ = this.process.repeated$;

  /**
   * Слушатель на завершение процесса
   * @type {Observable<ProcessStatus>}
   */
  finished$ = this.process.finished$;

  /**
   * Слушатель на начало процесса (когда вызывают process.run())
   * @type {Observable<ProcessStatus>}
   */
  created$ = this.process.created$;

  /**
   * Получает внутренний процесс
   * @param {InternalProcess} process
   */
  constructor(private process: InternalProcess) {}

  /*
   * Получить статус ошибки операции процесса
   * */
  isError(): boolean {
    return this.process.isError();
  }

  /**
   * Получение текущего статуса
   * @returns {ProcessStatus}
   */
  status(): ProcessStatus {
    return this.process.status();
  }

  /**
   * Отправка команды на блокирование процесса
   */
  lock(): void {
    this.process.lock();
  }

  /**
   * Разблокирует процесс
   */
  unlock(): void {
    this.process.unlock();
  }

  /**
   * Стартует процесс
   */
  run(): void {
    this.process.run();
  }

  /**
   * Повторяет процесс
   */
  repeat(): void {
    this.process.repeat();
  }

  /**
   * Отменяет процесс
   */
  cancel(): void {
    this.process.cancel();
  }
}
