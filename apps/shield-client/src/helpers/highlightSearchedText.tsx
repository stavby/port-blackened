export const highlightSearchedText = (nodeText: string, searchedValue: string) => {
  const indexToColor = nodeText.toLowerCase().indexOf(searchedValue.toLowerCase());
  const beforeStr = nodeText.substring(0, indexToColor);
  const searchStr = nodeText.substring(indexToColor, indexToColor + searchedValue.length);
  const afterStr = nodeText.substring(indexToColor + searchedValue.length);

  return (
    <>
      {indexToColor > -1 ? (
        <span>
          {beforeStr}
          <span style={{ fontWeight: "bold" }}>{searchStr}</span>
          {afterStr}
        </span>
      ) : (
        <span>{nodeText}</span>
      )}
    </>
  );
};
