export interface Employee {
  id: string;
  name: string;
  address: string;
  bankName: string;
  branchName: string;
  accountType: string; // 普通・当座など
  accountNumber: string;
  accountHolder: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  order: number; // 表示順序
}

export interface AppSettings {
  companyName: string;
  taxRate: number; // 0.1021
  ceoWithLiveRatio: number; // 0.7 (売上掛率)
  ceoRewardRatio: number; // 0.25 (報酬掛率)
  employeeWithLiveRatio: number; // 0.7 (売上掛率)
  employeeRewardRatio: number; // 0.5 (報酬掛率)
  products: Record<string, Product>;
}

export interface Song {
  id?: number; // Dexie auto-increment
  title: string;
  duration: number; // 秒単位
  fileData?: Blob; // 音源データ
  fileName?: string; // ファイル名
  createdAt: Date;
}

export interface SetlistItem {
  id: string; // UUID or temporary ID
  trackOrder: number;
  songId?: number; // 選択された曲のID
  title: string; // 自由入力も可能にするため、SongIdがなくても入力可とするか、Song選択時に自動入力
  duration: number; // 秒単位
  triggerType: "音先" | "板付" | "曲ふり" | "タイトルコール" | "カウント" | string;
  soundRequest: string;
  lightRequest: string;
  notes: string;
}

export interface Setlist {
  eventName: string;
  venue: string;
  date: string;
  artistName: string;
  memberCount: number;
  micCount: number;
  durationLimit: number; // 分単位? 要件では「演奏時間」
  items: SetlistItem[];
}
