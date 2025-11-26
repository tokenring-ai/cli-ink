import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';

export interface ConfirmInputProps {
  message: string;
  defaultValue?: boolean;
  onConfirm: (value: boolean) => void;
}

export default function ConfirmationScreen({ message, defaultValue = false, onConfirm }: ConfirmInputProps) {
  const [value, setValue] = useState(defaultValue);

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
      </Box>
    </Box>
  );
};
