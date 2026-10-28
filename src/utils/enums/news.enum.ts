export enum NewsCategoryEnum {
  NEWS = "news",
  NOTICE = "notice",
  EVENT = "event",
  NOVENA = "novena",
  MASS = "mass",
  CAMPAIGN = "campaign",
  COMMUNITY = "community",
  PASTORAL = "pastoral",
  CATECHESIS = "catechesis",
  YOUTH = "youth",
  CHARITY = "charity",
  LITURGY = "liturgy",
  FORMATION = "formation",
  OTHER = "other",
}

export const NewsCategoryLabels: Record<NewsCategoryEnum, string> = {
  [NewsCategoryEnum.NEWS]: "Notícia",
  [NewsCategoryEnum.NOTICE]: "Comunicado",
  [NewsCategoryEnum.EVENT]: "Evento",
  [NewsCategoryEnum.NOVENA]: "Novena",
  [NewsCategoryEnum.MASS]: "Missa",
  [NewsCategoryEnum.CAMPAIGN]: "Campanha",
  [NewsCategoryEnum.COMMUNITY]: "Comunidade",
  [NewsCategoryEnum.PASTORAL]: "Pastoral",
  [NewsCategoryEnum.CATECHESIS]: "Catequese",
  [NewsCategoryEnum.YOUTH]: "Juventude",
  [NewsCategoryEnum.CHARITY]: "Ação Social",
  [NewsCategoryEnum.LITURGY]: "Liturgia",
  [NewsCategoryEnum.FORMATION]: "Formação",
  [NewsCategoryEnum.OTHER]: "Outro",
};

const eventCategoryOptions = [
  NewsCategoryEnum.EVENT,
  NewsCategoryEnum.NOVENA,
  NewsCategoryEnum.MASS,
  NewsCategoryEnum.COMMUNITY,
  NewsCategoryEnum.CAMPAIGN,
  NewsCategoryEnum.OTHER,
];

export const isEventCategory = (category: NewsCategoryEnum) =>
  eventCategoryOptions.includes(category);
