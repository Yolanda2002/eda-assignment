import { SNSHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler: SNSHandler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    const key = message.Records[0].s3.object.key;

    // 删除 DynamoDB 表中的项
    const params = {
      TableName: 'ImageTable',
      Key: { imageName: key }
    };

    try {
      await dynamoDb.delete(params).promise();
      console.log('Deleted item:', key);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }
};
