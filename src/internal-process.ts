import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ProcessStatus } from './typings';

export const processCanceledFilter = (status: ProcessStatus) => status === ProcessStatus.canceled;
export const processUnlockedFilter = (status: ProcessStatus) =>
  status !== ProcessStatus.waiting &&
  status !== ProcessStatus.creating &&
  status !== ProcessStatus.wait;
export const processLockedFilter = (status: ProcessStatus) => status === ProcessStatus.waiting;
export const processRepeatedFilter = (status: ProcessStatus) => status === ProcessStatus.repeat;
export const processFinishedFilter = (status: ProcessStatus) => status === ProcessStatus.finished;
export const processCreatedFilter = (status: ProcessStatus) => status !== ProcessStatus.creating;

/*
 * Process - отвечает за состояние операций
 * является внутренним - к нему нет доступа извне
 * */

export class InternalProcess {
  /**
   * Храним статус
   * @type {BehaviorSubject<ProcessStatus>}
   * @private
   */
  private _status = new BehaviorSubject<ProcessStatus>(ProcessStatus.creating);

  /* Произошла ли ошибка ? */
  private _isError = false;

  /**
   * Слушатель - на доступность к выполнению
   * @type {Observable<true>}
   */
  allowed$ = this._status.pipe(
    map(processUnlockedFilter),
    distinctUntilChanged(),
    filter((status) => status),
  );

  /**
   * Слушатель - на блок процесса
   * @type {Observable<ProcessStatus>}
   */
  locked$ = this._status.pipe(filter(processLockedFilter));

  /**
   * Слушатель на отмену процесса
   * @type {Observable<ProcessStatus>}
   */
  canceled$ = this._status.pipe(filter(processCanceledFilter));

  /**
   * Слушатель на повтор процесса
   * @type {Observable<ProcessStatus>}
   */
  repeated$ = this._status.pipe(filter(processRepeatedFilter));

  /**
   * Слушатель на завершение процесса
   * @type {Observable<ProcessStatus>}
   */
  finished$ = this._status.pipe(filter(processFinishedFilter));

  /**
   * Слушатель на начало процесса (когда вызывают process.run())
   * @type {Observable<ProcessStatus>}
   */
  created$ = this._status.pipe(filter(processCreatedFilter));

  /**
   * Изменяет статус
   * @param {ProcessStatus} status
   * @private
   */
  private setStatus(status: ProcessStatus): void {
    const now = this._status.getValue();
    if (now === ProcessStatus.finished || now === ProcessStatus.canceled) {
      return; // Запрещаем изменять статус если процесс отменен или завершен
    }
    this._status.next(status);
  }

  /**
   * Устанавливает метку наличия ошибки в процессе.
   * @param {boolean} status
   */
  setIsError(status: boolean): void {
    const now = this._status.getValue();
    if (now === ProcessStatus.finished || now === ProcessStatus.canceled) {
      return;
    }
    this._isError = status;
  }

  isError(): boolean {
    return this._isError;
  }

  /**
   * Получение текущего статуса
   * @returns {ProcessStatus}
   */
  status(): ProcessStatus {
    return this._status.getValue();
  }

  /**
   * Блокирует процесс
   */
  locked(): void {
    this.setStatus(ProcessStatus.wait);
  }

  /**
   * Отправка команды на блокирование процесса
   */
  lock(): void {
    this.setStatus(ProcessStatus.waiting);
  }

  /**
   * Разблокирует процесс
   */
  unlock(): void {
    this.run();
  }

  /**
   * Выполняет процесс
   */
  start(): void {
    this.setStatus(ProcessStatus.processing);
  }

  /**
   * Стартует процесс
   */
  run(): void {
    this.setStatus(ProcessStatus.created);
  }

  /**
   * Повторяет процесс
   */
  repeat(): void {
    this.setStatus(ProcessStatus.repeat);
  }

  /**
   * Отменяет процесс
   */
  cancel(): void {
    this.setStatus(ProcessStatus.canceled);
  }

  /**
   * Завершает процесс
   */
  finish(): void {
    this.setStatus(ProcessStatus.finished);
  }
}
