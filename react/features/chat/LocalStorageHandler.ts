export class LocalStorageHandle {
     protected key: string;

     constructor(key: string) {
          this.key = key;
     }

     getByKey() {
          if (!this.key || !this.checkKeyExists()) {
               return null;
          }
          const item = localStorage.getItem(this.key);
          if (item !== null) {
               return JSON.parse(item);
          }
          return null;
     }

     checkKeyExists() {
          return localStorage.getItem(this.key) !== null;
     }

     setKey(data: any) {
          localStorage.setItem(this.key, JSON.stringify(data));
     }

     removeKey() {
          if (!this.key) return;
          localStorage.removeItem(this.key);
     }
}
