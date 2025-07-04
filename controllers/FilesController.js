import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import fileQueue from '../worker';

const { mkdir, writeFile } = fsPromises;
const fs = require('fs');

class FilesController {
  static async postUpload(request, response) {
    const userToken = request.get('X-Token');
    if (typeof userToken !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const userId = await redisClient.getUserId(userToken);
    if (!userId) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const userObject = await dbClient.userById(userId);
    if (!userObject) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const fileObject = {
      name: request.body.name,
      type: request.body.type,
      isPublic: request.body.isPublic || false,
      parentId: request.body.parentId || 0,
      userId: userObject._id,
    };

    if (typeof fileObject.name !== 'string') {
      response.status(400);
      response.send({ error: 'Missing name' });
      return;
    }
    if (fileObject.type !== 'folder' && fileObject.type !== 'file' && fileObject.type !== 'image') {
      response.status(400);
      response.send({ error: 'Missing type' });
      return;
    }
    if (!request.body.data && fileObject.type !== 'folder') {
      response.status(400);
      response.send({ error: 'Missing data' });
      return;
    }

    if (fileObject.parentId) {
      const parentFile = await dbClient.fileWithID(fileObject.parentId);
      if (!parentFile) {
        response.status(400);
        response.send({ error: 'Parent not found' });
        return;
      }

      if (parentFile.type !== 'folder') {
        response.status(400);
        response.send({ error: 'Parent is not a folder' });
        return;
      }
    }

    if (fileObject.type !== 'folder') {
      const fileDir = process.env.FOLDER_PATH || '/tmp/files_manager/';

      try {
        if (fs.existsSync(fileDir)) {
          await fsPromises.rm(fileDir, { recursive: true });
        }
        await mkdir(fileDir);
      } catch (error) {
      }

      fileObject.localPath = fileDir + uuidv4();

      const fileContent = Buffer.from(request.body.data, 'base64')
        .toString('utf-8');

      try {
        await writeFile(fileObject.localPath, fileContent);
      } catch (error) {
        response.status(500);
        response.send({ error: 'Failed to add file' });
        return;
      }
    }

    const insertResult = await dbClient.addFile(fileObject);

    if (!insertResult.result.ok) {
      response.status(500);
      response.send({ error: 'Failed to add file' });
      return;
    }

    if (fileObject.type === 'image') {
      fileQueue.add({ userId: fileObject.userId, fileId: fileObject._id });
    }

    fileObject.id = fileObject._id;
    delete fileObject._id;

    response.status(201);
    response.send(fileObject);
  }
}

module.exports = FilesController;
