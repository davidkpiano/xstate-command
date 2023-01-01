import { ExtractEvent, createMachine } from 'xstate';
import { capture } from './capture';
import { commandScore } from './commandScore';

export interface Item {
  disabled?: false;
  value: string;
}

export interface Group {
  name: string;
  items: Item[];
}

export interface CommandContext {
  allGroups: Group[];
  ids: Record<string, Item>;
  selected: string | undefined;
  search: string;
  items: Item[];
  loop: boolean;
  listId: string;
  labelId: string;
  inputId: string;
}

export type CommandEvents =
  | { type: 'next'; event: React.KeyboardEvent }
  | { type: 'prev'; event: React.KeyboardEvent }
  | { type: 'updateSelectedToIndex' }
  | (React.KeyboardEvent & { type: 'keydown' });

export interface ScoredItem extends Item {
  score: number;
}

function score(
  value: string,
  search: string,
  scorer: (value: string, search: string) => number
) {
  return value ? scorer(value, search) : 0;
}

export function getSelectedItem(ctx: CommandContext) {
  return ctx.items.find((item) => item.value === ctx.selected);
}

export function getValidItems(ctx: CommandContext): ScoredItem[] {
  const enabledItems = ctx.items.filter((item) => !item.disabled);
  const itemsWithScores = enabledItems.map((item) => ({
    ...item,
    score: score(item.value, ctx.search, commandScore),
  }));

  // return items with scores > 0
  return itemsWithScores.filter((item) => item.score > 0);
}

const updateSelectedToIndex = (index: number) =>
  capture((ctx: CommandContext, e, x) => {
    const items = getValidItems(ctx);
    const item = items[index];
    if (item) {
      x.assign({
        selected: item.value,
      });
    }
  });

function updateSelectedByChange(ctx: CommandContext, change: 1 | -1) {
  const selectedItem = getSelectedItem(ctx);
  const items = getValidItems(ctx);
  const index = items.findIndex((item) => item.value === selectedItem?.value);

  // Get item at this index
  let newSelectedItem = items[index + change];

  if (ctx.loop) {
    newSelectedItem =
      index + change < 0
        ? items[items.length - 1]
        : index + change === items.length
        ? items[0]
        : items[index + change];
  }

  if (newSelectedItem) {
    ctx.selected = newSelectedItem.value;
  }

  console.log('selected', ctx.selected);
}

function updateSelectedToGroup(ctx: CommandContext, change: 1 | -1) {
  const selectedItem = getSelectedItem(ctx)!;
  const groupKeys = ctx.allGroups.map((group) => group.name);
  const items = getValidItems(ctx);
  let groupKey = groupKeys.find((key) => {
    const entries = ctx.allGroups.find((group) => group.name === key);
    return entries?.items.find(
      (groupItem) => groupItem.value === selectedItem.value
    );
  });
  let item: Item | undefined = undefined;

  while (groupKey && !item) {
    groupKey =
      change > 0
        ? groupKeys[groupKeys.indexOf(groupKey) + 1]
        : groupKeys[groupKeys.indexOf(groupKey) - 1];

    if (!groupKey) {
      break;
    }

    const group = ctx.allGroups.find((group) => group.name === groupKey);
    const groupItems = group
      ? items.filter(
          (item) =>
            !item.disabled &&
            group.items.find((groupItem) => groupItem.value === item.value)
        )
      : [];
    console.log('group', groupItems);
    item = groupItems[0];
  }

  if (item) {
    ctx.selected = item.value;
  } else {
    updateSelectedByChange(ctx, change);
  }
}

const last = capture((ctx: CommandContext, e, x) => {
  x.capture(updateSelectedToIndex(getValidItems(ctx).length - 1));
});

const next = capture(
  (ctx: CommandContext, e: ExtractEvent<CommandEvents, 'next'>, x) => {
    e.event.preventDefault();

    if (e.event.metaKey) {
      // Last item
      x.capture(last);
    } else if (e.event.altKey) {
      // Next group
      updateSelectedToGroup(ctx, 1);
    } else {
      // Next item
      updateSelectedByChange(ctx, 1);
    }
  }
);

const prev = capture(
  (ctx: CommandContext, e: ExtractEvent<CommandEvents, 'prev'>, x) => {
    e.event.preventDefault();

    if (e.event.metaKey) {
      // First item
      x.capture(updateSelectedToIndex(0));
    } else if (e.event.altKey) {
      // Previous group
      updateSelectedToGroup(ctx, -1);
    } else {
      // Previous item
      updateSelectedByChange(ctx, -1);
    }
  }
);

export const createCommandMachine = (input: {
  onChange: (item: Item) => void;
  items: Item[];
  listId: string;
  inputId: string;
  labelId: string;
}) =>
  createMachine<CommandContext, CommandEvents>({
    context: {
      allGroups: [
        {
          name: 'first',
          items: ['one', 'two', 'three'].map((i) => ({ value: i })),
        },
        {
          name: 'second',
          items: ['four', 'five', 'six'].map((i) => ({ value: i })),
        },
        {
          name: 'third',
          items: ['seven', 'eight', 'nine'].map((i) => ({ value: i })),
        },
      ],
      ids: {} as Record<string, Item>,
      selected: 'one', // todo: change to value
      search: '',
      items: input.items,
      loop: true,
      listId: input.listId,
      inputId: input.inputId,
      labelId: input.labelId,
    },
    on: {
      next: {
        actions: next,
      },
      prev: {
        actions: prev,
      },
      updateSelectedToIndex: {
        actions: updateSelectedToIndex,
      },
      last: {
        actions: last,
      },
      keydown: {
        actions: capture<CommandContext, React.KeyboardEvent>((ctx, e, x) => {
          if (!e.defaultPrevented) {
            switch (e.key) {
              case 'n':
              case 'j': {
                // vim keybind down
                if (e.ctrlKey) {
                  x.raise({ type: 'next', event: e });
                }
                break;
              }
              case 'ArrowDown': {
                x.raise({ type: 'next', event: e });
                break;
              }
              case 'p':
              case 'k': {
                // vim keybind up
                if (e.ctrlKey) {
                  x.raise({ type: 'prev', event: e });
                }
                break;
              }
              case 'ArrowUp': {
                x.raise({ type: 'prev', event: e });

                break;
              }
              case 'Home': {
                // First item
                e.preventDefault();
                x.raise({ type: 'updateSelectedToIndex', index: 0 });
                break;
              }
              case 'End': {
                // Last item
                e.preventDefault();
                // last(ctx);
                x.raise({ type: 'last' });
                break;
              }
              case 'Enter': {
                // Trigger item onSelect
                e.preventDefault();
                const item = getSelectedItem(ctx);
                if (item) {
                  console.log('enter item', item);
                  input.onChange(item);
                  // const event = new Event(SELECT_EVENT);
                  // item.dispatchEvent(event);
                }
              }
            }

            x.assign({});
          }
        }),
      },
      change: {
        actions: (
          ctx: CommandContext,
          e: { type: 'change'; value: string }
        ) => {
          ctx.search = e.value;
          ctx.selected = getValidItems(ctx)[0].value;
        },
      },
    },
  });

export function getItemAriaProperties(item: Item, ctx: CommandContext) {
  const isSelected = item.value === ctx.selected;
  return {
    'aria-selected': isSelected || undefined,
    'aria-disabled': item.disabled || undefined,
    role: 'option',
  };
}

export function getGroupAriaProperties(name: string, ctx: CommandContext) {
  const entries = ctx.allGroups
    .find((group) => group.name === name)
    ?.items.map((item) => item.value);
  const items = entries
    ? ctx.items.filter((item) => entries.includes(item.value))
    : [];
  const selectedItems = items.filter((item) => item.value === ctx.selected);
  const disabledItems = items.filter((item) => item.disabled);

  return {
    role: 'presentation',
  };
}

export function getInputAriaProperties(ctx: CommandContext) {
  return {
    autoComplete: 'off',
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-controls': ctx.listId,
    'aria-labelledby': ctx.labelId,
  };
}

export function getListAriaProperties(ctx: CommandContext) {
  return {
    role: 'listbox',
    'aria-label': 'Suggestions',
    'aria-labelledby': ctx.inputId,
  };
}
