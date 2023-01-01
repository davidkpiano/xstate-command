import {
  PureAction,
  assign,
  send,
  raise,
  EventObject,
  ActionObject,
} from 'xstate';
import { pure } from 'xstate/lib/actions';

type X = {
  assign: (...args: any[]) => void;
  send: (...args: any[]) => void;
  raise: (...args: any[]) => void;
  exec: (execFn: any) => void;
  capture: (action: ActionObject<any, any>) => void;
};

type CaptureFunction<TContext, TEvent extends EventObject> = (
  ctx: TContext,
  e: TEvent,
  x: X
) => void;

export function capture<TContext, TEvent extends EventObject>(
  fn: CaptureFunction<TContext, TEvent>
): PureAction<any, any> {
  return pure((ctx, e) => {
    const actions: ActionObject<TContext, TEvent>[] = [];

    const x: X = {
      assign: (...args) => {
        actions.push(assign(...args));
      },
      send: (...args) => {
        actions.push(send(...args));
      },
      raise: (...args) => {
        actions.push(raise(...args));
      },
      exec: (execFn) => {
        actions.push(execFn);
      },
      capture: (action) => {
        actions.push(action);
      },
    };

    fn(ctx, e, x);

    return actions;
  });
}
