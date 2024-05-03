import { SQSHandler } from "aws-lambda";
import { SES_EMAIL_FROM, SES_EMAIL_TO, SES_REGION } from "../env";
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from "@aws-sdk/client-ses";

const client = new SESClient({ region: SES_REGION });

export const handler: SQSHandler = async (event) => {
  console.log("Event received: ", JSON.stringify(event));
  for (const record of event.Records) {
    const recordBody = JSON.parse(record.body);
    const snsMessage = JSON.parse(recordBody.Message);

    if (snsMessage.Records) {
      console.log("Record details: ", JSON.stringify(snsMessage));
      for (const messageRecord of snsMessage.Records) {
        const s3e = messageRecord.s3;
        const srcBucket = s3e.bucket.name;
        const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));

        const emailParams = {
          name: "Photo Rejection Service",
          email: SES_EMAIL_FROM,
          message: `Unfortunately, your image was not accepted. Please try another. Image URL: s3://${srcBucket}/${srcKey}`,
        };

        try {
          await client.send(new SendEmailCommand(sendEmailParams(emailParams)));
        } catch (error) {
          console.log("ERROR sending email: ", error);
        }
      }
    }
  }
};

function sendEmailParams({ name, email, message }: { name: string, email: string, message: string }): SendEmailCommandInput {
  return {
    Destination: {
      ToAddresses: [SES_EMAIL_TO],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: getHtmlContent(name, email, message),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Image Rejection Notification",
      },
    },
    Source: SES_EMAIL_FROM,
  };
}

function getHtmlContent(name: string, email: string, message: string): string {
  return `
    <html>
      <body>
        <h1>Image Rejection Notice</h1>
        <p>${message}</p>
        <p>If you have any questions, please contact us at ${email}.</p>
      </body>
    </html>
  `;
}
