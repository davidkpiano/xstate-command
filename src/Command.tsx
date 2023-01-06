import {
  getInputAriaProperties,
  getListAriaProperties,
  getItemAriaProperties,
  Item,
  getValidItems,
} from './commandMachine';
import { ListItem, UnorderedList } from '@chakra-ui/react';
import { Input } from '@chakra-ui/react';
import { useCommandPalette } from './App';

export function Command(props: {
  onCommand: (value: string) => void;
  items: Item[];
}) {
  const [state, send] = useCommandPalette(props.items, (value) => {
    props.onCommand(value);
  });

  console.log(state);

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
