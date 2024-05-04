## EDA Assignment - Distributed Systems.

**Name:** Jia Yang  20104736

**YouTube Demo link** -  



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



### Phase 3 (if relevant).

- Confirmation Mailer - Fully implemented.

- Process Image - Fully implemented.

- Update Table - Not implemented.

- Delete images - Fully implemented.(I added)

  processDelete.ts

  Users can delete objects (images) from storage buckets using the AWS CLI.

  