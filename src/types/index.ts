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
