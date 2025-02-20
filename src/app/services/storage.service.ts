import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Item {
  id?: number;
  nome: string;
  descricao: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ItemsDB';
  private readonly storeName = 'items';

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.initDB();
    }
  }

  private initDB(): void {
    if ('indexedDB' in window) {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Erro ao abrir o IndexedDB');
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    }
  }

  async getItems(): Promise<Item[]> {
    if (!isPlatformBrowser(this.platformId)) return [];

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      });
    } else {
      try {
        const items = localStorage.getItem('itens');
        return items ? JSON.parse(items) : [];
      } catch {
        return [];
      }
    }
  }

  async addItem(item: Item): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.add(item);
        transaction.oncomplete = () => resolve();
      });
    } else {
      try {
        const items = await this.getItems();
        items.push(item);
        localStorage.setItem('itens', JSON.stringify(items));
      } catch (error) {
        console.error('Erro ao salvar item:', error);
      }
    }
  }

  async removeItem(id: number): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.delete(id);
        transaction.oncomplete = () => resolve();
      });
    } else {
      try {
        const items = await this.getItems();
        const newItems = items.filter((_, index) => index !== id);
        localStorage.setItem('itens', JSON.stringify(newItems));
      } catch (error) {
        console.error('Erro ao remover item:', error);
      }
    }
  }
}
