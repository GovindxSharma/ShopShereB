// src/utils/cache.ts
interface CacheItem<T> {
  data: T
  expiry: number
}

class SimpleMemoryCache {
  private store = new Map<string, CacheItem<any>>()

  get<T>(key: string): T | null {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }
    return item.data as T
  }

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    })
  }

  clearPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  clearAll(): void {
    this.store.clear()
  }
}

export const appCache = new SimpleMemoryCache()
