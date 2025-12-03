import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';

export interface ConfirmInputProps {
  message: string;
  defaultValue?: boolean;
  timeout?: number;
  onConfirm: (value: boolean) => void;
}

export default function ConfirmationScreen({ message, defaultValue = false, timeout, onConfirm }: ConfirmInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [remaining, setRemaining] = useState(timeout);

  React.useEffect(() => {
    if (timeout && timeout > 0) {
      const timer = setTimeout(() => onConfirm(defaultValue), timeout * 1000);
      const interval = setInterval(() => setRemaining(prev => Math.max(0, (prev ?? timeout) - 1)), 1000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [timeout, defaultValue, onConfirm]);

  useInput((input, key) => {
    if (input.toLowerCase() === 'y') {
      onConfirm(true);
    } else if (input.toLowerCase() === 'n') {
      onConfirm(false);
    } else if (key.return) {
      onConfirm(value);
    } else if (key.leftArrow || key.rightArrow) {
      setValue(prev => !prev);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{message} </Text>
      <Box flexDirection="row">
        <Text color={value ? 'green' : 'gray'}>[Yes]</Text>
        <Text> / </Text>
        <Text color={!value ? 'red' : 'gray'}>[No]</Text>
        {timeout && timeout > 0 && <Text color="yellow"> ({remaining}s)</Text>}
      </Box>
    </Box>
  );
};
