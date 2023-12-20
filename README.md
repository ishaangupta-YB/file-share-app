# File Sharing App

A file sharing application built with node.js and mongoDB to easily share/upload/download files.

## Demo
The app requires the user to select any file from the local storage and submit the uploaded file. Once the file upload is completed, the user is provided a download link and a shareable link. Multiple file are supported. The shareable link will be valid for 1 day, after file upload, after which the document is deleted from the Database using the TTL concept.

https://github.com/ishaangupta-YB/file-share-app/assets/52467684/706484a1-50c4-48b0-8e8c-131911c79ce5

# Getting Started

1. Fork this repo and run the git clone <forked repo> command from your terminal/bash.
2. npm install all the dependencies from the package file.
3. Create a .env file in the root of the directory and store the following keys in that file:
    1. MONGO_CONNECTION_URL = Insert your MongoDB Atlas connection URI after you create a free tier collection
    2. APP_BASE_URL = Insert your deployed/localhost link
    3. ENCRYPTION_IV = Insert the encryption IV key
    4. ENCRYPTION_KEY = Insert the encryption key
4. If your are deploying it, do not forget to add scheduler.js script to a cron job to make sure to delete every file after it's expiry.
     
### Once all this is set up, you can choose to send a PR in case you add to the project!

# Future Improvements
* A user authentication and dashboard setup.
* Adding CORS.
* Implementing AWS S3 or any other cloud storage service.
* Allowing multiple file/folders uploads simultaneously.
* Setting up a payment gateway to allow file uploads of upto a 1GB size limit.
* File storage for upto a year/more, upon the payment of a nominal charge.
* UI to deal with file upload durations.
* QR Code for sharing links.

### Any more suggestions are always welcome in the PRs!

# Challenges faced
This one of my beginner learning projects during my 1st semester of university so implementing GCP storage at that time was really hard as a beginner. I removed the cloud storage feature for now since it was heavily depreciated. I might be converting it to AWS S3 and updating soon!

# Technologies Used
### Technologies used in the development of this web application are as follow:

* MongoDB Atlas: It provides a free cloud service to store MongoDB collections.
* Node.js: A runtime environment to help build fast server applications using JS.
* Express.js: A popular Node.js framework to build scalable server-side for web applications.
* Mongoose: An ODM(Object Data Modelling)library for MongoDB and Node.js
* Multer: Node.js package that help in dealing with file uploads.
* ~~GCP Storage Bucket: An object storage service that offers industry-leading scalability, data availability, security, and performance.~~
* ~~Heroku: A platform(PaaS) to deploy full stack web applications for free.~~

# LICENSE
### Apache License, Version 2.0 or later.
