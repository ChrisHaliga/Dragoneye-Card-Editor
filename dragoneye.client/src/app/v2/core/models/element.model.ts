// Element data models

export interface ElementData {
  key: string;
  name: string;
  symbol: string;
}

export interface ElementSymbolMap {
  [key: string]: string;
}

export interface ElementDisplayInfo {
  symbol: string;
  cssClass: string;
  name: string;
}
