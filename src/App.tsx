import { useId, useState } from 'react';
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

/** Setters */

function useCommandPalette(items: Item[]) {
  const listId = useId();
  const inputId = useId();
  const labelId = useId();
  const [state, send] = useMachine(() =>
    createCommandMachine({
      onChange: () => {},
      items,
      listId,
      inputId,
      labelId,
    })
  );

  return [state, send] as const;
}

function Command(props: { onCommand: (item: Item) => void; items: Item[] }) {
  const [state, send] = useCommandPalette(props.items);

  console.log('changed', state.changed);

  return (
    <div
      className="App"
      onKeyDown={(ev) => {
        send(ev);
      }}
    >
      <input
        {...getInputAriaProperties(state.context)}
        type="text"
        onChange={(ev) => {
          send({
            type: 'change',
            value: ev.target.value,
          });
        }}
      />
      <ul {...getListAriaProperties(state.context)}>
        {getValidItems(state.context).map((item) => (
          <li
            key={item.value}
            style={{
              background:
                state.context.selected === item.value ? 'red' : 'blue',
            }}
            {...getItemAriaProperties(item, state.context)}
          >
            {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [item, setItem] = useState<Item | null>(null);

  return (
    <main>
      <h1>Command</h1>
      <Command
        key={item?.value}
        onCommand={(item) => {
          setItem(item);
        }}
        items={
          [
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
          ] as Item[]
        }
      />
    </main>
  );
}

export default App;
