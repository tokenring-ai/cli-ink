import {useStdin, useStdout} from "ink";
import {useEffect, useState} from "react";

export default function useScreenSize() {
  const {stdout} = useStdout();
  const [size, setSize] = useState({ rows: stdout.rows ?? 24, columns: stdout.columns ?? 80 });
  useEffect(() => {
    function handleResize() {
      setSize({ rows: stdout.rows ?? 24, columns: stdout.columns ?? 80 });
    }
    stdout.on('resize', handleResize);
    return () => {
      stdout.off('resize', handleResize);
    }
  }, []);

  return size;
}