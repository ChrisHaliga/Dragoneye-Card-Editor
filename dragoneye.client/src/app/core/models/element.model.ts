// Element data models

export interface ElementData {
  key: string;
  name: string;
  symbol: string;
  imagePath: string;
}

export interface ElementSymbolMap {
  [key: string]: string;
}

export interface ElementImageMap {
  [key: string]: string;
}

export interface ElementDisplayInfo {
  symbol: string;
  cssClass: string;
  name: string;
  imagePath: string;
}
