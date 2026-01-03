import { useState, useCallback } from "react";

function useBoolean(initialValue: boolean) {
  const [value, setValue] = useState<boolean>(initialValue);

  const onTrue = useCallback(() => setValue(true), []);
  const onFalse = useCallback(() => setValue(false), []);
  const onToggle = useCallback(() => setValue((prevValue) => !prevValue), []);

  return { value, onTrue, onFalse, onToggle };
}

export default useBoolean;
