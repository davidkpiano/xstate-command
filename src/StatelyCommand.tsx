import { useMachine } from '@xstate/react';
import { createMachine } from 'xstate';
import { useCommandPalette } from './App';
import { Command } from './Command';
import { Box, Text } from '@chakra-ui/react';

const trafficLightMachine = createMachine({
  id: 'trafficLight',
  initial: 'green',
  states: {
    green: {
      on: {
        TIMER: 'yellow',
      },
    },
    yellow: {
      on: {
        TIMER: 'red',
      },
    },
    red: {
      initial: 'walk',
      states: {
        walk: {
          on: {
            'COUNTDOWN.START': 'wait',
          },
        },
        wait: {
          on: {
            'COUNTDOWN.END': 'stop',
          },
        },
        stop: {
          on: {
            TIMER: 'done',
          },
        },
        done: {
          type: 'final',
        },
        blinking: {},
      },
      onDone: 'green',
    },
  },
  on: {
    EMERGENCY: '.red.blinking',
  },
});

export function StatelyCommand() {
  const [state, send] = useMachine(trafficLightMachine);
  const nextEvents = state.nextEvents;

  return (
    <Box>
      <Command
        items={nextEvents.map((event) => ({ value: event }))}
        onCommand={(value) => {
          console.log('oncommand', value);
          send(value);
        }}
      />
      <Text>Current state: {state.toStrings().at(-1)}</Text>
    </Box>
  );
}
