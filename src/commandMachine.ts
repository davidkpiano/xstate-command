import { ExtractEvent, assign, createMachine } from 'xstate';
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
  selectedIndex: number;
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
  | { type: 'last' }
  | { type: 'updateSelectedToIndex' }
  | { type: 'search'; value: string }
  | { type: 'change'; item: Item }
  | { type: 'items.update'; items: Item[] }
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
  return getValidItems(ctx)[ctx.selectedIndex];
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
        selectedIndex: index,
      });
    }
  });

function updateSelectedByChange(ctx: CommandContext, change: 1 | -1) {
  return capture((ctx: CommandContext, e, x) => {
    const selectedItem = getSelectedItem(ctx);
    const items = getValidItems(ctx);
    const index = items.findIndex((item) => item.value === selectedItem?.value);
    let selectedIndex = ctx.selectedIndex;

    // Get item at this index
    let newSelectedItem = items[index + change];

    if (ctx.loop) {
      selectedIndex =
        selectedIndex + change < 0
          ? items.length - 1
          : selectedIndex + change === items.length
          ? 0
          : selectedIndex + change;
      newSelectedItem =
        index + change < 0
          ? items[items.length - 1]
          : index + change === items.length
          ? items[0]
          : items[index + change];
    }

    x.assign({
      selected: newSelectedItem?.value,
      selectedIndex,
    });
  });
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
      // TODO: implement this a different way
      // updateSelectedToGroup(ctx, 1);
    } else {
      // Next item
      x.capture(updateSelectedByChange(ctx, 1));
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
      // TODO: implement this a different way
      // updateSelectedToGroup(ctx, -1);
    } else {
      // Previous item
      x.capture(updateSelectedByChange(ctx, -1));
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
      selectedIndex: 0,
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
      // updateSelectedToIndex: {
      //   actions: updateSelectedToIndex,
      // },
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
                  x.raise({ type: 'change', item });
                  input.onChange(item);
                }
              }
            }

            x.assign({});
          }
        }),
      },
      search: {
        actions: assign<CommandContext, ExtractEvent<CommandEvents, 'search'>>({
          search: (_, e) => e.value,
          selectedIndex: 0,
        }),
      },
      change: {
        actions: 'onChange',
      },
      'items.update': {
        actions: assign<
          CommandContext,
          ExtractEvent<CommandEvents, 'items.update'>
        >({
          items: (_, e) => e.items,
          search: '',
          selectedIndex: 0,
        }),
      },
    },
  });

export function getItemAriaProperties(item: Item, ctx: CommandContext) {
  // const isSelected = item.value === ctx.selected;
  const isSelected =
    getValidItems(ctx).findIndex(
      (validItem) => item.value === validItem.value
    ) === ctx.selectedIndex;
  return {
    'aria-selected': isSelected || undefined,
    'aria-disabled': item.disabled || undefined,
    role: 'option',
  };
}

export function getInputAriaProperties(ctx: CommandContext) {
  return {
    autoComplete: 'off',
    role: 'combobox',
    'aria-autocomplete': 'list' as const,
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
