import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import React, {useCallback, useState} from 'react';

export interface CommandInputProps {
  history?: string[];
  autoCompletion?: string[];
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  onCtrlC?: () => void;
  prompt?: string;
}

export const CommandInput: React.FC<CommandInputProps> = ({
                                                            history = [],
                                                            autoCompletion = [],
                                                            onSubmit,
                                                            onCancel,
                                                            onCtrlC,
                                                            prompt = '>',
                                                          }) => {
  const [key, setKey] = useState(() => Math.random());
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState('');

  useInput((input, key) => {
    if (key.ctrl && input === 'c' && onCtrlC) {
      onCtrlC();
      return;
    }

    if (key.escape && onCancel) {
      onCancel();
      return;
    }

    if (key.upArrow && history.length > 0) {
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setKey(Math.random());
      setValue(history[history.length - 1 - newIndex] ?? '');
      return;
    }

    if (key.downArrow && historyIndex > -1) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setKey(Math.random());
      setValue(newIndex >= 0 ? (history[history.length - 1 - newIndex] ?? '') : '');
      return;
    }

    if (key.tab && suggestion) {
      setValue(suggestion);
      setSuggestion('');
    }
  });

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setHistoryIndex(-1);

    // Find matching autocomplete suggestion
    if (newValue && autoCompletion.length > 0) {
      const match = autoCompletion.find(cmd =>
        cmd.toLowerCase().startsWith(newValue.toLowerCase()) && cmd !== newValue
      );
      setSuggestion(match ?? '');
    } else {
      setSuggestion('');
    }
  }, [autoCompletion]);

  const handleSubmit = useCallback((submittedValue: string) => {
    onSubmit(submittedValue);
    setValue('');
    setSuggestion('');
    setHistoryIndex(-1);
  }, [onSubmit]);

  return (
    <Box>
      <Text color="yellowBright">{prompt} </Text>
      <TextInput
        key={key}
        value={value}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
      {false && suggestion && (
        <Text>{suggestion.slice(value.length)}</Text>
      )}
    </Box>
  );
};