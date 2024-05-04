import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as events from "aws-cdk-lib/aws-lambda-event-sources";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from "constructs";
import { RegionInfo } from "aws-cdk-lib/region-info";
import { StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import {  DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EDAAppStack extends cdk.Stack {
  // 定义云设施堆栈
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //创建存储桶
    const imagesBucket = new s3.Bucket(this, "images", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
    });

    // Integration infrastructure
    // SQS队列暂存图片
    const imageProcessQueue = new sqs.Queue(this, "img-created-queue", {
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

    const newImageTopic = new sns.Topic(this, "NewImageTopic", {
      displayName: "New Image topic",
    });

    const mailerQ = new sqs.Queue(this, "mailer-queue", {
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });

     // 添加第二个队列用于拒绝邮件
     const rejectionMailerQ = new sqs.Queue(this, "rejection-mailer-queue", {
      receiveMessageWaitTime: cdk.Duration.seconds(10),
    });
    
    // 创建 DynamoDB 表
    const imageTable = new dynamodb.Table(this, 'ImageTable', {
      partitionKey: { name: 'imageName', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
      tableName:'ImageTable',
    });

    const deleteImageTopic = new sns.Topic(this, 'DeleteImageTopic', {
      displayName: 'Delete Image Topic'
    });

    const totalImageTopic = new sns.Topic(this, "TotalImageTopic", {
      displayName: "Total Image Topic",
  });

    // 配置 S3 删除事件通知
    imagesBucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED_DELETE,
      new s3n.SnsDestination(deleteImageTopic)
    );
  

    imagesBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.SnsDestination(totalImageTopic)
  );
  imagesBucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED_DELETE,
      new s3n.SnsDestination(totalImageTopic)
  );

  


    // Lambda functions

    const processImageFn = new lambdanode.NodejsFunction(
      this,
      "ProcessImageFn",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/processImage.ts`,
        timeout: cdk.Duration.seconds(15),
        memorySize: 128,
        environment: {
          TABLE_NAME: imageTable.tableName,
          REGION:'eu-west-1',
        }
      }
    );

    const mailerFn = new lambdanode.NodejsFunction(this, "mailer-function", {
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(3),
      entry: `${__dirname}/../lambdas/mailer.ts`,
    });

    
    // 添加拒绝邮件处理的Lambda函数
    const rejectionMailerFn = new lambdanode.NodejsFunction(this, "RejectionMailerFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(3),
      entry: `${__dirname}/../lambdas/rejectionMailer.ts`,  
    });

    const processDeleteFn = new lambdanode.NodejsFunction(this, 'ProcessDeleteFunction', {
      runtime: lambda.Runtime.NODEJS_16_X, 
      entry: `${__dirname}/../lambdas/processDelete.ts`, 
      handler: 'handler',
      environment: {
        TABLE_NAME: imageTable.tableName,
        REGION:'eu-west-1',
      }
    });

    const updateDescriptionFn = new lambdanode.NodejsFunction(this, "UpdateDescriptionFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/updateDescription.ts`,
      handler: 'handler',
      environment: {
          TABLE_NAME: imageTable.tableName,
          REGION:'eu-west-1',
      }
  });

  const deleteMailerFn = new lambdanode.NodejsFunction(this, "DeleteMailerFunction", {
    runtime: lambda.Runtime.NODEJS_16_X,
    entry: `${__dirname}/../lambdas/deleteMailer.ts`,
    environment: {
        TABLE_NAME: imageTable.tableName,
        REGION: cdk.Aws.REGION
    }
});
    
    // S3 --> SQS
    //  对象创建时发送提示
    imagesBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(newImageTopic)  // Changed
    );
    newImageTopic.addSubscription(
      new subs.SqsSubscription(imageProcessQueue)
    );

    newImageTopic.addSubscription(new subs.SqsSubscription(mailerQ));

    // reject队列
    newImageTopic.addSubscription(new subs.SqsSubscription(rejectionMailerQ));

    deleteImageTopic.addSubscription(new subs.LambdaSubscription(processDeleteFn));

    new cdk.CfnOutput(this, "TotalImageTopicArn", {
      value: totalImageTopic.topicArn
  });

    // SQS --> Lambda
    //  触发lambda语句
    const newImageEventSource = new events.SqsEventSource(imageProcessQueue, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(10),
    });

    processImageFn.addEventSource(newImageEventSource);


    const newImageMailEventSource = new events.SqsEventSource(mailerQ, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(10),
    }); 

    mailerFn.addEventSource(newImageMailEventSource);

    mailerFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
        ],
        resources: ["*"],
      })
    );
    
    const updateDescriptionTopic = new sns.Topic(this, 'UpdateDescriptionTopic', {
      displayName: 'Update Description Topic'
  });
  
  updateDescriptionTopic.addSubscription(new subs.LambdaSubscription(updateDescriptionFn));
  

  // 为 Lambda 函数授予权限
updateDescriptionFn.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
      "dynamodb:UpdateItem", // 允许更新 DynamoDB 表中的条目
  ],
  resources: [imageTable.tableArn] // 使用表的 ARN
}));

    // rejectemail
    const rejectionMailerEventSource = new events.SqsEventSource(rejectionMailerQ, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(10),
    });
     rejectionMailerFn.addEventSource(rejectionMailerEventSource);

     rejectionMailerFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
        ],
        resources: ["*"],
      })
    );

    

processDeleteFn.addToRolePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
        "dynamodb:DeleteItem", // 允许删除 DynamoDB 表中的条目
        "dynamodb:GetItem", // 如果需要在删除前检查条目
        "dynamodb:Scan", // 如果需要查找条目
    ],
    resources: ["arn:aws:dynamodb:region:account-id:table/ImageTable"]
}));


    // Permissions
    // 权限
    imagesBucket.grantRead(processImageFn);
     // 授予 Process Image Lambda 函数访问 DynamoDB 表的权限
     imageTable.grantReadWriteData(processImageFn);
     imageTable.grantReadWriteData(processDeleteFn);

    // Output
    //输出桶名称
    new cdk.CfnOutput(this, "bucketName", {
      value: imagesBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'UpdateDescriptionTopicArn', {
      value: updateDescriptionTopic.topicArn,
  });
  }
}
