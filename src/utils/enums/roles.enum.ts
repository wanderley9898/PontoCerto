export enum RolesEnum {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  SECRETARY = "secretary",
  COMMUNICATION = "communication",
  EDITOR = "editor",
}

export const RolesLabels: Record<RolesEnum, string> = {
  [RolesEnum.SUPER_ADMIN]: "Super Administrador",
  [RolesEnum.ADMIN]: "Administrador",
  [RolesEnum.SECRETARY]: "Secretaria",
  [RolesEnum.COMMUNICATION]: "Comunicação",
  [RolesEnum.EDITOR]: "Editor",
};
