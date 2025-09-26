# Question 1

To deploy this project in production I believe the infrastructure of the project needs to be defined.

I believe this kind of service could be deployed with the backend part in AWS Lambda with the front being deployed to a Cloudfront.

The steps required for this setup would be:
* Define the infrastructure as code (Cloudformation/Terraform...)
* Setup a testing pipeline which would build and test the code
* Setup a deployment pipeline which would:
  1. Deploy the infrastructure
  2. Package the frontend and the backend for deployment
* Deploy to testing and production environments

The basic infrastructure would include:
* VPC
* Cloudfront
* Lambda
* S3 bucket (if the data team does not manage their own)
* Cloudwatch dashboard and alarm

Once we have a deployable unit of code we'll need to instrument observability tools to monitor the run.  

I suggest adjusting given the criticality of the service, but at least `api/games/populate` calls need to trigger an alerting system if they fail given that they would block users from seeing the latest data.

Observability depends on the systems already in place in Voodoo but barebones Cloudwatch is exploitable.  
Otherwise more involved solutions can be implemented like the tracing agent of Datadog to track the backend failures and samples.

I would not challenge the storage solution yet, but if scaling issues appear during testing, I would suggest moving to a service like mongoDB or postgres.

# Question 2

To ingest the files every day, I see two options:
* Use a cron / scheduler to run the `api/games/populate` endpoint at fixed time every day. Could be EventBridge.
* Use the event system of S3 to trigger the endpoint when a file is added or changed in the bucket.

The first option is a fixed time update to which we can adjust the timing if the games need to change outside working hours, for example.  
The second option is reactive and ensures we always have the latest data. 

I would go with the second option as it's more flexible. However, it would require a slightly more involved infrastructure as code to wire the S3 bucket to the lambda.  
If the bucket is not available in the same account as the service, and it is not possible to do cross-account access, I would go with the first option.

Also, a concern is if the service must ingest more than the hardcoded files in the `api/games/populate` endpoint code, it would be more flexible to pass to the endpoint the filenames of the files we need to ingest at a given time.