import { useState } from "react";

export type CheckboxState<V extends string | number> = {
  checkedValues: Set<V>;
  handleCheckboxChange: (id: V, checked: boolean) => void;
};

export const useCheckboxState = <V extends string | number>(initialCheckedValues: Set<V> = new Set()): CheckboxState<V> => {
  const [checkedValues, setCheckedValues] = useState<Set<V>>(initialCheckedValues);

  const handleCheckboxChange = (id: V, checked: boolean) => {
    setCheckedValues((prevState) => {
      if (checked) {
        return new Set([...prevState, id]);
      } else {
        const newState = new Set(prevState);
        newState.delete(id);
        return newState;
      }
    });
  };

  return { checkedValues, handleCheckboxChange };
};
