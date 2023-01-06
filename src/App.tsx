import { useEffect, useId, useState } from 'react';
import './App.css';
import { useMachine } from '@xstate/react';
import {
  createCommandMachine,
  getInputAriaProperties,
  getListAriaProperties,
  getItemAriaProperties,
  Item,
  getValidItems,
} from './commandMachine';
import { Box, ChakraProvider, ListItem, UnorderedList } from '@chakra-ui/react';
import { Input } from '@chakra-ui/react';

/** Setters */

function useCommandPalette(items: Item[], onChange?: (value: string) => void) {
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
          onChange?.(ctx.selected);
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

function Command(props: { onCommand: (value: string) => void; items: Item[] }) {
  const [state, send] = useCommandPalette(props.items, (value) =>
    props.onCommand(value)
  );

  return (
    <div
      className="App"
      onKeyDown={(ev) => {
        send(ev);
      }}
    >
      <Input
        {...getInputAriaProperties(state.context)}
        type="text"
        onChange={(ev) => {
          send({
            type: 'search',
            value: ev.target.value,
          });
        }}
        value={state.context.search}
      />
      <UnorderedList
        {...getListAriaProperties(state.context)}
        listStyleType="none"
        m="0"
        marginTop="2"
        p="0"
        borderWidth="1px"
        borderColor="gray.200"
        borderStyle="solid"
        borderRadius="md"
      >
        {getValidItems(state.context).map((item) => (
          <ListItem
            padding="2"
            key={item.value}
            fontWeight="bold"
            sx={{
              '&[aria-selected="true"]': {
                background: 'gray.300',
              },
            }}
            {...getItemAriaProperties(item, state.context)}
          >
            {item.value}
          </ListItem>
        ))}
      </UnorderedList>
    </div>
  );
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
        <h1>Command</h1>
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
