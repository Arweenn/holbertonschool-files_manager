import pkg from 'mongodb';
const { MongoClient } = pkg;

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;
    this.connected = false;

    this.client.connect()
      .then(() => {
        this.connected = true;
        this.db = this.client.db(this.dbName);
      })
      .catch((err) => {
        console.log(`MongoDB connection error: ${err}`);
        this.connected = false;
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.connected) {
      return 0;
    }
    try {
      const count = await this.db.collection('users').countDocuments();
      return count;
    } catch (err) {
      console.log(`Error counting users: ${err}`);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.connected) {
      return 0;
    }
    try {
      const count = await this.db.collection('files').countDocuments();
      return count;
    } catch (err) {
      console.log(`Error counting files: ${err}`);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
