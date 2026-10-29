import type { SVGProps } from "react";

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const IconImage = () => (
  <Svg><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></Svg>
);
export const IconSend = () => (
  <Svg width={20} height={20} strokeWidth={2.4}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></Svg>
);
export const IconPlus = () => (
  <Svg><path d="M12 5v14M5 12h14" /></Svg>
);
export const IconX = () => (
  <Svg width={18} height={18}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const IconPerson = () => (
  <Svg width={16} height={16}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);
export const IconGift = () => (
  <Svg><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v9H5v-9" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></Svg>
);
export const IconShirt = () => (
  <Svg><path d="M20.4 6.6 16 4l-1.5 1.5a3.5 3.5 0 0 1-5 0L8 4 3.6 6.6a1 1 0 0 0-.4 1.3l1.6 3.2a1 1 0 0 0 1.2.5L8 11v9h8v-9l2 .6a1 1 0 0 0 1.2-.5l1.6-3.2a1 1 0 0 0-.4-1.3z" /></Svg>
);
export const IconSparkle = () => (
  <Svg><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></Svg>
);