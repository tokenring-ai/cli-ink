import {type ParsedQuestionRequest} from "@tokenring-ai/agent/AgentEvents";
import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';

interface AskInputProps {
  request: ParsedQuestionRequest;
  onResponse: (response: string) => void;
}

export default function AskScreen({ request, onResponse }: AskInputProps) {
  const [lines, setLines] = useState<string[]>(['']);
  const [currentLine, setCurrentLine] = useState(0);

  const {message} = request;

  useInput((input, key) => {
    if ((key.escape || input === 'q')) {
      onResponse('');
      return;
    }

    if (key.ctrl && input === 'd') {
      onResponse(lines.join('\n'));
      return;
    }

    if (key.return) {
      setLines([...lines, '']);
      setCurrentLine(currentLine + 1);
      return;
    }

    if (key.backspace || key.delete) {
      const newLines = [...lines];
      if (newLines[currentLine].length > 0) {
        newLines[currentLine] = newLines[currentLine].slice(0, -1);
      } else if (currentLine > 0) {
        newLines.splice(currentLine, 1);
        setCurrentLine(currentLine - 1);
      }
      setLines(newLines);
      return;
    }

    if (input) {
      const newLines = [...lines];
      newLines[currentLine] = (newLines[currentLine] || '') + input;
      setLines(newLines);
    }
  });

  return (
    <Box flexDirection="column">
      {message && <Text color="cyan">{message}</Text>}
      <Text dimColor>(Press Ctrl+D to submit, Esc to cancel)</Text>
      {lines.map((line, idx) => (
        <Text key={idx}>{line}{idx === currentLine ? '█' : ''}</Text>
      ))}
    </Box>
  );
}
