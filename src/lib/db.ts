import Dexie, { Table } from 'dexie';
import { Song } from '@/types';

export class MySubClassedDexie extends Dexie {
  songs!: Table<Song>;

  constructor() {
    super('SetlistDB');
    this.version(1).stores({
      songs: '++id, title, duration, createdAt'
    });
  }
}

export const db = new MySubClassedDexie();

