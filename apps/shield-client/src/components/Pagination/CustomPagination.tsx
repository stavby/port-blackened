import { APP_WRAPPER_ID } from "@components/AppWrapper";
import { Pagination, PaginationProps } from "@mui/material";
import { startTransition, useCallback, useEffect, useRef } from "react";

interface CustomPaginationProps extends Pick<PaginationProps, "count" | "page"> {
  handlePageChange: (newPage: number) => void;
}

export const CustomPagination = ({ count, page, handlePageChange }: CustomPaginationProps) => {
  const onPageChange = useCallback(
    (newPage: number) => {
      startTransition(() => {
        const scrollableElement = document.getElementById(APP_WRAPPER_ID);

        (scrollableElement || window).scrollTo({
          top: 0,
          behavior: "smooth",
        });

        handlePageChange(newPage);
      });
    },
    [handlePageChange],
  );

  useEffect(() => {
    if (page && count && page > count) onPageChange(count);
  }, [page, count, onPageChange]);

  return (
    <Pagination
      color="primary"
      variant="outlined"
      count={count}
      page={page}
      onChange={(_, newPage) => onPageChange(newPage)}
      sx={{ [`& .MuiPaginationItem-page`]: { minWidth: 45 } }}
    />
  );
};
