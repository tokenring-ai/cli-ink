import {type ParsedQuestionRequest, type QuestionResponse} from "@tokenring-ai/agent/AgentEvents";
import type {ParsedFileSelectQuestion, ParsedTextQuestion, ParsedTreeSelectQuestion, ResultTypeForQuestion} from "@tokenring-ai/agent/question";
import {Box, Text, useInput} from 'ink';
import React, {useState} from 'react';

type QuestionInputScreenProps = {
  request: ParsedQuestionRequest;
  onResponse: (response: QuestionResponse["result"]) => void;
};

export default function QuestionInputScreen({ request, onResponse }: QuestionInputScreenProps) {
  const { question, message } = request;

  if (question.type === 'text') {
    return <TextInputComponent question={question} message={message} onResponse={onResponse} />;
  } else if (question.type === 'treeSelect') {
    return <TreeSelectInputComponent question={question} message={message} onResponse={onResponse} />;
  } else if (question.type === 'fileSelect') {
    return <FileSelectInputComponent question={question} message={message} onResponse={onResponse} />;
  }

  return <Box><Text>Unknown question type</Text></Box>;
}

interface TextInputComponentProps {
  question: ParsedTextQuestion
  message: string;
  onResponse: (response: ResultTypeForQuestion<ParsedTextQuestion>) => void;
}

function TextInputComponent({ question, message, onResponse }: TextInputComponentProps) {
  const [lines, setLines] = useState<string[]>(['']);
  const [currentLine, setCurrentLine] = useState(0);

  useInput((input, key) => {
    if ((key.escape || input === 'q')) {
      onResponse(null);
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

interface TreeSelectInputComponentProps {
  question: ParsedTreeSelectQuestion;
  message: string;
  onResponse: (response: ResultTypeForQuestion<ParsedTreeSelectQuestion>) => void;
}

function TreeSelectInputComponent({ question, message, onResponse }: TreeSelectInputComponentProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(question.defaultValue || []);

  useInput((input, key) => {
    if (key.escape) {
      onResponse(null);
      return;
    }
    if (key.return) {
      onResponse(selectedValues);
      return;
    }
  });

  return (
    <Box flexDirection="column">
      {message && <Text color="cyan">{message}</Text>}
      <Text>(Tree selection not fully implemented yet)</Text>
    </Box>
  );
}

interface FileSelectInputComponentProps {
  question: ParsedFileSelectQuestion;
  message: string;
  onResponse: (response: ResultTypeForQuestion<ParsedFileSelectQuestion>) => void;
}

function FileSelectInputComponent({ question, message, onResponse }: FileSelectInputComponentProps) {
  const [paths, setPaths] = useState<string[]>(question.defaultValue || []);

  useInput((input, key) => {
    if (key.escape) {
      onResponse(null);
      return;
    }
    if (key.return) {
      onResponse(paths);
      return;
    }
  });

  return (
    <Box flexDirection="column">
      {message && <Text color="cyan">{message}</Text>}
      <Text>(File selection not yet implemented)</Text>
    </Box>
  );
}
