import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Item {
  id?: number;
  nome: string;
  descricao: string;
}

@Component({
  selector: 'app-item-form',
  templateUrl: './item-form.component.html',
  styleUrls: ['./item-form.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class ItemFormComponent implements OnInit, AfterViewInit {
  novoItem: Item = {
    nome: '',
    descricao: ''
  };

  itens: Item[] = [];
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ItemsDB';
  private readonly storeName = 'items';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Inicialização básica
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      setTimeout(() => {
        this.inicializarDB();
      });
    }
  }

  private inicializarDB() {
    if ('indexedDB' in window) {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB');
        this.usarLocalStorage();
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        this.carregarItens();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    } else {
      console.warn('IndexedDB não está disponível');
      this.usarLocalStorage();
    }
  }

  private carregarItens() {
    if (!this.isBrowser) return;

    if (this.db) {
      const transaction = this.db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        this.itens = request.result;
      };
    }
  }

  private usarLocalStorage() {
    if (!this.isBrowser) return;

    try {
      const itensStorage = localStorage.getItem('itens');
      if (itensStorage) {
        this.itens = JSON.parse(itensStorage);
      }
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error);
    }
  }

  onSubmit() {
    if (!this.isBrowser || !this.novoItem.nome.trim()) return;

    if (this.db) {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.add({...this.novoItem});

      transaction.oncomplete = () => {
        this.carregarItens();
        this.limparFormulario();
      };
    } else {
      this.itens.push({...this.novoItem});
      try {
        localStorage.setItem('itens', JSON.stringify(this.itens));
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
      this.limparFormulario();
    }
  }

  removerItem(index: number) {
    if (!this.isBrowser) return;

    if (this.db) {
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const item = this.itens[index];
      if (item.id) {
        store.delete(item.id);
      }
      transaction.oncomplete = () => {
        this.carregarItens();
      };
    } else {
      this.itens.splice(index, 1);
      try {
        localStorage.setItem('itens', JSON.stringify(this.itens));
      } catch (error) {
        console.error('Erro ao remover do localStorage:', error);
      }
    }
  }

  private limparFormulario() {
    this.novoItem = {
      nome: '',
      descricao: ''
    };
  }
}
