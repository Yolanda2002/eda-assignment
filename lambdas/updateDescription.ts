import { SNSHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

export const handler: SNSHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event));
    for (const record of event.Records) {
        const message = JSON.parse(record.Sns.Message);
        const key = message.name;
        const description = message.description;

        const params = {
            TableName: 'ImageTable',
            Key: { imageName: key },
            UpdateExpression: 'set description = :d',
            ExpressionAttributeValues: {
                ':d': description
            }
        };

        try {
            await dynamoDb.update(params).promise();
            console.log('Updated item:', key);
        } catch (error) {
            console.error('Error updating item:', error);
        }
    }
};
