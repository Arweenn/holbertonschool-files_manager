import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err}`);
    });

    this.client.connect().catch((err) => {
      console.log(`Redis client connection error: ${err}`);
    });
  }

  isAlive() {
    return this.client.isReady;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.log(`Error getting key ${key}: ${err}`);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.setEx(key, duration, value.toString());
    } catch (err) {
      console.log(`Error setting key ${key}: ${err}`);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.log(`Error deleting key ${key}: ${err}`);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
