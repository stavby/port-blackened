const MessageQuestion = ({ color = "#9CA6B5", width = "37", height = "36" }: { color?: string; width?: string; height?: string }) => (
  <svg width={width} height={height} viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg" color={color}>
    <path
      d="M25.8301 27.6451H19.8301L13.1551 32.0851C12.1651 32.7451 10.8301 32.0401 10.8301 30.8401V27.6451C6.33008 27.6451 3.33008 24.6451 3.33008 20.1451V11.145C3.33008 6.64502 6.33008 3.64502 10.8301 3.64502H25.8301C30.3301 3.64502 33.3301 6.64502 33.3301 11.145V20.1451C33.3301 24.6451 30.3301 27.6451 25.8301 27.6451Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.3298 17.04V16.7251C18.3298 15.7051 18.9598 15.1651 19.5898 14.7301C20.2048 14.3101 20.8198 13.7701 20.8198 12.7801C20.8198 11.4001 19.7098 10.29 18.3298 10.29C16.9498 10.29 15.8398 11.4001 15.8398 12.7801"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M18.3233 20.625H18.3368" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default MessageQuestion;
