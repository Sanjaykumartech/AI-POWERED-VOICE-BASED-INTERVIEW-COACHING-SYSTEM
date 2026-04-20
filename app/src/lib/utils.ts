import { clsx } from "clsx";

export const cn = (...inputs: Array<string | false | null | undefined>) => clsx(inputs);

export const formatScore = (value: number) => `${value.toFixed(1)}/10`;

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

