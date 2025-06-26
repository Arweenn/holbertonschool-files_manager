import redisClient from './redis';
import dbClient from './db';

/**
 * Module with user utils
 */
const userUtils = {
  /**
   * Gets a user id and key 
   * @request {request_object}
   * @return {object} userId and redis key for token
   */
  async getUserIdAndKey(request) {
    const obj = { userId: null, key: null };

    const xToken = request.header('X-Token');

    if (!xToken) return obj;

    obj.key = `auth_${xToken}`;

    obj.userId = await redisClient.get(obj.key);

    return obj;
  },

  /**
   * Gets a user from database
   * @query {object} finding user
   * @return {object} user document object
   */
  async getUser(query) {
    const user = await dbClient.usersCollection.findOne(query);
    return user;
  },
};

export default userUtils;
