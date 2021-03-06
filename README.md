## You must do the following before things will work:

>1. Make sure you have [PostgreSQL](https://www.postgresql.org/) installed
>2. Run the following code in the SQL Shell (psql) shell downloaded with PostgreSQL. (or run the script included at the root of this project)
```
CREATE DATABASE groupomania;
\c groupomania
CREATE TABLE users (user_id varchar PRIMARY KEY, user_email varchar(320) NOT NULL, password varchar(255) NOT NULL, first_name varchar(255) NOT NULL, last_name varchar(255) NOT NULL);
CREATE TABLE posts (post_id varchar(16) PRIMARY KEY, user_id varchar( 20 ) UNIQUE NOT NULL, caption varchar( 30 ) NOT NULL, file_upload varchar NOT NULL, time_stamp bigint NOT NULL, public_comments varchar[] NOT NULL, users_read text[]);
```

>3. Rename '.env_update_me' to '.env' and update values with your details where 'CHANGEME' is displayed - except for DATABASE_NAME (do not add inverted commas)
>4. install node_modules in frontend folder AND backend folder using ```npm install``` inside both folders
>5. run 'nodemon server' on backend
>6. run 'npm run serve' on frontend