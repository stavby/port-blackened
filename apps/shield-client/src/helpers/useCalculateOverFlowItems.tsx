import { DependencyList, RefObject, useCallback, useLayoutEffect, useState } from "react";

const calculateOverFlowItems = (container: HTMLDivElement) => {
  const containerWidth = container?.offsetWidth;
  const items = container.children;
  const gap = parseFloat(window.getComputedStyle(container).columnGap) || 0;

  let accItemsWidth = 0;
  let overFlowItems = 0;

  Array.from(items).forEach((currItem, index) => {
    const item = currItem as HTMLDivElement;
    accItemsWidth += item.offsetWidth;

    if (index < items.length - 1) {
      accItemsWidth += gap;
    }

    if (accItemsWidth > containerWidth) {
      overFlowItems++;
    }
  });

  return overFlowItems;
};

export const useCalculateOverFlowItems = (containerRef: RefObject<HTMLDivElement | null>, deps?: DependencyList) => {
  const [overflowCount, setOverflowCount] = useState(0);

  const handleResize = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const overFlowItems = calculateOverFlowItems(container);
    setOverflowCount(overFlowItems);
  }, [setOverflowCount]);

  useLayoutEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize, ...(deps ?? [])]);

  return overflowCount;
};
