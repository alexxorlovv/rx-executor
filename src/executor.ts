import { OnDestroy } from './typings';
import { asyncScheduler, EMPTY, Observable, of, Subject, Subscription } from 'rxjs';
import { Process } from './process';
import {
  catchError,
  concatMap,
  delayWhen,
  finalize,
  mapTo,
  mergeMap,
  observeOn,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { ExecutionContext, OperationType } from './typings';
import { Operation } from './operation';
import {
  cancelHook,
  finishHook,
  initHook,
  lockedHook,
  repeatHook,
  startedHook,
  unLockedHook,
} from './hooks';
import { InternalProcess } from './internal-process';

/**
 * Executor - Исполняет операции относительно статусов процесса. А также связывает операцию и результат.
 */
export class Executor implements OnDestroy {
  /**
   * Слушатель операций
   * @type {Subject<ExecutionContext<any>>}
   * @private
   */
  private list: Subject<ExecutionContext<any>> = new Subject<ExecutionContext<any>>();

  /**
   * Обработчик операций
   * @type {Observable<void>}
   * @private
   */
  private processing$: Observable<void> = this.list.pipe(
    observeOn(asyncScheduler), // Операции должны быть выполнены асинхронно
    mergeMap((context) => this.launcher(context)), // каждая в своем observable
  );

  /**
   * запускаем обработчик операций
   * @type {Subscription}
   * @private
   */
  private processing: Subscription = this.processing$.subscribe();

  /**
   * Отвечает за управлением контекстом операции
   * @param {ExecutionContext<C>} context - контекст операции
   * @returns {Observable<void>}
   * @private
   */
  private launcher<C>(context: ExecutionContext<C>): Observable<void> {
    return of(context).pipe(
      delayWhen(() => context.process.allowed$.pipe(tap(() => unLockedHook(context.operation)))), // Ждем когда процесс будет доступен
      tap(() => startedHook(context.operation)), // Вызываем started хук если он есть в операции
      concatMap(() => this.run(context)), //Выполняем операцию
      takeUntil(
        context.process.repeated$.pipe(
          tap(() => repeatHook(context.operation)), // Вызываем repeat хук если он есть в операции
          tap(() => this.repeat(context, true)), // Выполняем повтор и меняем статус на created
        ),
      ), // Если ловим repeated - убиваем процесс и добавляем по новой
      takeUntil(
        context.process.locked$.pipe(
          // меняем статус на locked что не пропустит delayWhen и не отменит takeUntil (в rxjs takeUntil имеет более высокий приоритет по сравнению с delayWhen)
          tap(() => context.process.locked()),
          tap(() => lockedHook(context.operation)), // Вызываем locked хук если он есть в операции
          tap(() => this.repeat(context)), // Выполняем повтор операции - теперь она будет висеть в delayWhen пока статус не изменится
        ),
      ), // Если ловим локер - убиваем процесс и добавляем по новой(тогда сработает delayWhen и он будет ждать разблокирования)
      takeUntil(context.process.canceled$.pipe(tap(() => cancelHook(context.operation)))), // Если ловим canceled - просто убиваем процесс
      takeUntil(context.process.finished$), // Если ловим finished - просто убиваем процесс
    );
  }

  /**
   * Возвращает Observable операции относительно типа
   * @param {Process} process - процесс операции
   * @param {OperationType<C>} operation - операция
   * @returns {Observable<C>} - Observable операции
   * @private
   */
  private getOperation<C>(process: Process, operation: OperationType<C>): Observable<C> {
    if (operation instanceof Operation) {
      return operation.run();
    } else if (operation instanceof Observable) {
      return operation;
    } else {
      return operation(process);
    }
  }

  /**
   * Выполнение операции
   * @param {ExecutionContext<C>} context - контекст операции
   * @returns {Observable<void>}
   * @private
   */
  private run<C>(context: ExecutionContext<C>): Observable<void> {
    return of(context).pipe(
      tap(({ process }) => process.start()), // запускаем процесс
      concatMap(({ result, process, operation, externalProcess }) =>
        this.getOperation(externalProcess, operation).pipe(
          // Начинаем выполнять операцию
          tap((response: C) => result.next(response)), // записываем ответ операции в  результат.
          catchError((err) => {
            process.setIsError(true); // устанавливает что в процессе выполнения произошла ошибка (по сути это просто метка)
            // catchError - имеет более высокий приоритет чем finalize.
            result.error(err); // обработка ошибок должна быть на уровне операций. Если мы ловим ее тут - то мы убиваем результаты.
            return EMPTY;
          }),
          finalize(() => {
            // Если результаты закончились ошибкой или операция завершилась не через repeat/lock
            if (result.hasError || !context.repeated) {
              process.finish(); // тогда мы завершаем процесс.
              finishHook(context.operation); // Вызываем finished хук если он есть в операции
            } else if (context.repeated) {
              // То есть если завершилось через takeUntil repeat/lock тогда мы не делаем процесс в статусе финиша.
              // Что позволяет нам получать от операций больше 1 ответа - пока она не будет завершена.
              context.repeated = false;
            }
          }),
        ),
      ),
      mapTo(undefined),
    );
  }

  /**
   * Повторяет операцию
   * @param {ExecutionContext<C>} context - контекст операции
   * @param {boolean} isCreate - меняет статус процесса на created
   * @private
   */
  private repeat<C>(context: ExecutionContext<C>, isCreate = false): void {
    if (isCreate) {
      context.process.run();
    }
    context.repeated = true;
    this.list.next(context);
  }

  /**
   * Создает операцию но не запускает ее
   * @param {Operation<C> | OperationFunction<C>} operation - Операция, можно указать как функцию или как объект класса.
   * @param {Subject<C>} result - слушатель результатов, сюда будут отправлены результаты операции
   * @returns {Process} - процесс (Чтобы запустить процесс выполнить process.run())
   */
  create<C>(operation: OperationType<C>, result: Subject<C>): Process {
    const process = new InternalProcess();
    const externalProcess = new Process(process);
    if (operation instanceof Operation) {
      operation.setProcess(externalProcess);
    }

    const context = { externalProcess, process, operation, result, repeated: false };
    initHook(context.operation);
    this.list.next(context);
    return externalProcess;
  }

  /**
   * Уничтожает Executor
   * @returns void
   */
  onDestroy(): void {
    this.processing.unsubscribe();
  }
}
