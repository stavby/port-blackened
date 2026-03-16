import StyledTooltipShield from "@components/Tooltip";
import { useCalculateOverFlowItems } from "@helpers/useCalculateOverFlowItems";
import {
  Box,
  Card,
  CardContent,
  Chip,
  chipClasses,
  ChipProps,
  Collapse,
  Grid,
  IconButton,
  IconButtonProps,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { CaretDown } from "@phosphor-icons/react";
import { ReactNode, useRef, useState } from "react";

export const TitleStyled = styled(Chip)(() => ({
  background: "transparent",
  border: "none",
  maxWidth: "fit-content",
  [`& .${chipClasses.label}`]: {
    maxWidth: "fit-content",
    p: 0,
    textWrap: "wrap",
    fontSize: 15,
  },
}));

export const ChipStyled = styled(Chip)((props) => ({
  borderColor: !props.color || props.color === "default" ? "#667085" : undefined,
}));

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ExpandMore = styled(({ expand, ...props }: ExpandMoreProps) => {
  return <IconButton sx={{ color: "primary.main" }} {...props} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
  "& .caretDownIcon:disabled": {
    color: theme.palette.primary.main,
  },
}));

export const StyledCard = styled(Card)(() => ({
  backgroundColor: "transparent",
  boxShadow: "none",
}));

export const StyledCardContent = styled(CardContent)(() => ({
  padding: 0,
  "&:last-child": {
    paddingBottom: 0,
  },
}));

export interface ChipItem<T extends string | number = string | number> {
  id: T;
  label: string;
  disabled?: boolean;
  extraInfo?: string;
}

interface OverflowChipListProps<T extends string | number> {
  chips: ChipItem<T>[];
  placeholder?: ReactNode;
  titleProps?: { itemSize: number; text: string };
  chipProps?: ChipProps;
  handleChipDelete?: (id: T) => void;
}

function OverflowChipList<T extends string | number>({
  titleProps,
  chips,
  handleChipDelete,
  chipProps,
  placeholder,
}: OverflowChipListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);
  const overflowCount = useCalculateOverFlowItems(stackRef, [chips]);
  const showingPlaceholder = !!placeholder && chips.length === 0;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Grid container spacing={0.5} sx={{ alignItems: "center" }}>
        <Grid item xs={10}>
          <Grid container sx={{ alignItems: "center" }}>
            {titleProps && (
              <Grid item xs={titleProps.itemSize} alignSelf="flex-start">
                <TitleStyled label={titleProps.text} />
              </Grid>
            )}
            <Grid item xs={titleProps ? 12 - titleProps.itemSize : 12}>
              {showingPlaceholder ? (
                placeholder
              ) : (
                <StyledCard>
                  <StyledCardContent>
                    {/**This stack is dummy for calculating chips overflowCount*/}
                    <Stack
                      direction={"row"}
                      columnGap={1}
                      sx={{
                        alignItems: "center",
                        height: "0px",
                        overflowX: "hidden",
                        maxWidth: "100%",
                      }}
                      ref={stackRef}
                    >
                      {chips.slice(0, chips.length).map(({ id, label, disabled }) => (
                        <div key={id}>
                          <ChipStyled
                            {...chipProps}
                            label={label}
                            disabled={disabled}
                            {...(handleChipDelete ? { onDelete: () => handleChipDelete(id) } : {})}
                          />
                        </div>
                      ))}
                    </Stack>
                    {/**This stack is real*/}
                    <Stack
                      direction={"row"}
                      columnGap={1}
                      sx={{
                        alignItems: "center",
                        overflowX: "hidden",
                        maxWidth: "100%",
                      }}
                    >
                      {chips.slice(0, chips.length - overflowCount).map(({ id, label, disabled, extraInfo }) => (
                        <StyledTooltipShield
                          title={
                            extraInfo ? (
                              <Typography variant="body2" sx={{ direction: "ltr", whiteSpace: "wrap", maxWidth: "50ch" }}>
                                {extraInfo}
                              </Typography>
                            ) : undefined
                          }
                          key={id}
                          arrow
                        >
                          <div style={{ width: "fit-content" }}>
                            <ChipStyled
                              {...chipProps}
                              label={label}
                              disabled={disabled}
                              {...(handleChipDelete ? { onDelete: () => handleChipDelete(id) } : {})}
                            />
                          </div>
                        </StyledTooltipShield>
                      ))}
                    </Stack>
                  </StyledCardContent>
                  <Collapse in={isExpanded} timeout={"auto"} unmountOnExit>
                    <StyledCardContent>
                      {chips.slice(chips.length - overflowCount, chips.length).map(({ id, label, disabled, extraInfo }) => (
                        <StyledTooltipShield
                          title={
                            extraInfo ? (
                              <Typography variant="body2" sx={{ direction: "ltr" }}>
                                {extraInfo}
                              </Typography>
                            ) : undefined
                          }
                          key={id}
                          arrow
                        >
                          <div style={{ width: "fit-content" }}>
                            <ChipStyled
                              {...chipProps}
                              key={id}
                              label={label}
                              disabled={disabled}
                              {...(handleChipDelete ? { onDelete: () => handleChipDelete(id) } : {})}
                              sx={{ m: 0.5, ...chipProps?.sx }}
                            />
                          </div>
                        </StyledTooltipShield>
                      ))}
                    </StyledCardContent>
                  </Collapse>
                </StyledCard>
              )}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={2}>
          {!showingPlaceholder && (
            <Stack direction={"row"} spacing={1} justifyContent={"flex-end"} alignItems={"center"}>
              {overflowCount > 0 && !isExpanded && <Typography>{`${overflowCount}+`}</Typography>}
              <ExpandMore
                expand={isExpanded && overflowCount > 0}
                onClick={() => setIsExpanded((prevState) => !prevState)}
                disabled={overflowCount === 0}
              >
                <CaretDown weight="fill" size={16} className="caretDownIcon" />
              </ExpandMore>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default OverflowChipList;
