/* eslint-disable import/extensions, import/no-absolute-path */
import { SQSHandler } from "aws-lambda";
import {
  GetObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

const s3 = new S3Client();

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
      const recordBody = JSON.parse(record.body);
      const snsMessage = JSON.parse(recordBody.Message);
  
      if (snsMessage.Records) {
        for (const messageRecord of snsMessage.Records) {
          const s3e = messageRecord.s3;
          const srcBucket = s3e.bucket.name;
          const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));
  
          // 将信息写入 DynamoDB
          const putParams = {
            TableName: 'ImageTable', 
            Item: {
              imageName: srcKey
            },
          };
  
          try {
            await dynamoDb.put(putParams).promise();
            console.log('DynamoDB write successful:', srcKey);
          } catch (error) {
            console.error('Error writing to DynamoDB:', error);
          }
        }
      }
    }
  };