import type { AllTokenTypes, CommonProperties } from "./common";
import type { TokenInterfaceMap, TokenOfType } from "./token";

type GroupTokenInterfaceMap = {
  [K in keyof TokenInterfaceMap]: Omit<TokenInterfaceMap[K], "$type"> & {
    $type?: TokenInterfaceMap[K]["$type"];
  };
};

export type GroupOfType<T extends AllTokenTypes> = GroupTokenInterfaceMap[T];

type GroupItem =
  | TokenOfType<AllTokenTypes>
  | GroupOfType<AllTokenTypes>
  | Group;

interface GroupProperties extends CommonProperties {
  $type?: AllTokenTypes;
}

export type Group = GroupProperties & {
  [K: string]: GroupItem;
};
