import { useEffect, useId, useState } from 'react';
import './App.css';
import { useMachine } from '@xstate/react';
import { createCommandMachine, getSelectedItem, Item } from './commandMachine';
import { Box, ChakraProvider } from '@chakra-ui/react';
import { Command } from './Command';
import { StatelyCommand } from './StatelyCommand';

/** Setters */

export function useCommandPalette(
  items: Item[],
  onChange?: (value: string) => void
) {
  const listId = useId();
  const inputId = useId();
  const labelId = useId();
  const [state, send] = useMachine(
    () =>
      createCommandMachine({
        onChange: () => {},
        items,
        listId,
        inputId,
        labelId,
      }),
    {
      actions: {
        onChange: (ctx) => {
          const selectedItem = getSelectedItem(ctx);
          onChange?.(selectedItem.value);
        },
      },
    }
  );

  console.log({
    selectedIndex: state.context.selectedIndex,
  });

  useEffect(() => {
    send({ type: 'items.update', items });
  }, items);

  return [state, send] as const;
}

const firstItems = [
  { value: 'one' },
  { value: 'two' },
  { value: 'three', disabled: true },
  { value: 'four' },
  { value: 'five' },
  { value: 'six' },
  { value: 'seven' },
  { value: 'eight' },
  { value: 'nine' },
  { value: 'ten' },
  { value: 'eleven' },
  { value: 'twelve' },
] as Item[];

function App() {
  const [items, setItems] = useState<Item[]>(firstItems);

  return (
    <ChakraProvider>
      <main>
        {/* <StatelyCommand /> */}
        <Command
          onCommand={(selectedItem) => {
            console.log('selected', selectedItem);
            setItems(
              firstItems.map((firstItem) => ({
                value: selectedItem + ' ' + firstItem.value,
              }))
            );
          }}
          items={items}
        />
      </main>
    </ChakraProvider>
  );
}

export default App;
