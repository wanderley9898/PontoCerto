export enum BroadcastStatusEnum {
  LIVE = "live",
  UPCOMING = "upcoming",
  PAST = "past",
}

export const BroadcastStatusLabels: Record<BroadcastStatusEnum, string> = {
  [BroadcastStatusEnum.LIVE]: "Ao vivo",
  [BroadcastStatusEnum.UPCOMING]: "Agendada",
  [BroadcastStatusEnum.PAST]: "Encerrada",
};

export const BroadcastStatusColors: Record<BroadcastStatusEnum, string> = {
  [BroadcastStatusEnum.LIVE]:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  [BroadcastStatusEnum.UPCOMING]:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  [BroadcastStatusEnum.PAST]:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
};

export const BroadcastStatusVariant = {
  [BroadcastStatusEnum.LIVE]: "destructive",
  [BroadcastStatusEnum.UPCOMING]: "secondary",
  [BroadcastStatusEnum.PAST]: "outline",
} as const;
