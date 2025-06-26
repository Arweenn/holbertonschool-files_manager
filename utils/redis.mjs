import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = false;

    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err}`);
      this.connected = false;
    });

    this.client.on('ready', () => {
      this.connected = true;
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (err) {
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.setexAsync(key, duration, value.toString());
    } catch (err) {
      console.log(`Error setting key ${key}: ${err}`);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(`Error deleting key ${key}: ${err}`);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
