export interface Airport {
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface SearchResult {
  type: 'city' | 'airport';
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  airports?: Airport[];
}

export interface HighlightedText {
  text: string;
  highlight: boolean;
} 