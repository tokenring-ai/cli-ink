import {HumanInterfaceRequestFor, HumanInterfaceResponseFor} from "@tokenring-ai/agent/HumanInterfaceRequest";
import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';

export interface PasswordInputProps {
  request: HumanInterfaceRequestFor<"askForPassword">
  onResponse: (response: HumanInterfaceResponseFor<"askForPassword">) => void;
}

export default function PasswordScreen({ request, onResponse } : PasswordInputProps) {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (key.return) {
      onResponse(value);
    } else if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && input) {
      setValue(prev => prev + input);
    }
  });

  return (
    <Box>
      <Text>{request.message} </Text>
      <Text>{'*'.repeat(value.length)}</Text>
    </Box>
  );
}