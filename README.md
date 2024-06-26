## EDA Assignment - Distributed Systems.

**Name:** Jia Yang  20104736

**YouTube Demo link** -  https://youtu.be/6vOkk824zEc



### Phase 1.

- Confirmation Mailer - Fully implemented.

  mailer.ts

  After the user has uploaded the code, an email will be sent to inform the user that the upload has been successful.

- Rejection Mailer - Fully implemented.

  rejectionMailer.ts

  When a user uploads a file that does not end in .jpeg or .png or .jpg, an email is sent notifying the user that the upload failed.

- Process Image - Fully implemented.

  changed processImage.ts

  User uploaded images are passed into the DynamoDB library for flexible storage.

  

### Phase 2 (if relevant).

- Confirmation Mailer - Fully implemented.

- Rejection Mailer - Fully implemented.

- Process Image - Fully implemented.

- Update Table - Fully implemented.

  updateDescription.ts

  Users can add image descriptions using the AWS CLI and upload them to DynamoDB.
  
- Delete images - Fully implemented.(I added)

  processDelete.ts

  Users can delete objects (images) from storage buckets using the AWS CLI.



### Phase 3 (if relevant).

- Confirmation Mailer - Fully implemented.

- Process Image - Fully implemented.

- Update Table - Not implemented.

- Delete images - Fully implemented.(I added)

  processDelete.ts

  Users can delete objects (images) from storage buckets using the AWS CLI.

- Delete Mailer - Fully implemented.

  deleteMailer.ts

  Users can get an email after deleting things from the database.

  **Since  I recorded the video first and uploaded this feature later, I added a image to show the results. Hope you could see it!**

![](https://github.com/Yolanda2002/eda-assignment/blob/master/images/mail.png)