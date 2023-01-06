import {
  getInputAriaProperties,
  getListAriaProperties,
  getItemAriaProperties,
  Item,
  getValidItems,
} from './commandMachine';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  ListItem,
  UnorderedList,
} from '@chakra-ui/react';
import { Input } from '@chakra-ui/react';
import { useCommandPalette } from './App';
import {
  AddIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from '@chakra-ui/icons';

export function Command(props: {
  onCommand: (value: string) => void;
  items: Item[];
}) {
  const [state, send] = useCommandPalette(props.items, (value) => {
    props.onCommand(value);
  });

  return (
    <Box
      className="App"
      onKeyDown={(ev) => {
        send(ev);
      }}
      display="flex"
      flexDir="column"
      gap="2"
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
        placeholder="Enter a command"
      />
      <UnorderedList
        {...getListAriaProperties(state.context)}
        listStyleType="none"
        margin="0"
        padding="0"
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
            textAlign="left"
            sx={{
              '&[aria-selected="true"]': {
                background: 'gray.300',
              },
            }}
            _hover={{
              background: 'gray.200',
            }}
            userSelect="none"
            {...getItemAriaProperties(item, state.context)}
            onClick={() => {
              send({ type: 'change', item });
            }}
          >
            {item.value}
          </ListItem>
        ))}
      </UnorderedList>
      <ButtonGroup size="sm" isAttached variant="outline">
        <IconButton aria-label="Add to friends" icon={<ArrowUpIcon />} />
        <IconButton aria-label="Add to friends" icon={<ArrowDownIcon />} />
      </ButtonGroup>
    </Box>
  );
}
