import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface SelectInputProps<T = string> {
  message?: string;
  options: SelectOption<T>[];
  onSelect: (value: T) => void;
  onCancel?: () => void;
}

export function SelectInput<T = string>({
                                          message,
                                          options,
                                          onSelect,
                                          onCancel,
                                        }: SelectInputProps<T>): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape && onCancel) {
      onCancel();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(options.length - 1, prev + 1));
    } else if (key.return) {
      const selected = options[selectedIndex];
      if (selected) {
        onSelect(selected.value);
      }
    }
  });

  return (
    <Box flexDirection="column">
      {message && <Text color="cyan">{message}</Text>}
      {options.map((option, index) => (
        <Box key={index}>
          <Text color={index === selectedIndex ? 'green' : undefined}>
            {index === selectedIndex ? '❯ ' : '  '}
            {option.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
}