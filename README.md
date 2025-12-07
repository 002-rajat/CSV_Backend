CSV Backend – File Upload & MySQL Storage:-

This backend allows users to upload CSV files containing name, email, phone data.
It validates all rows, inserts valid ones into MySQL (with batching), and returns detailed error reports to the frontend.

Tech Stack:-

Backend:-

Node.js
Express.js
Multer → CSV file upload handling
fast-csv → Stream-based CSV parsing
MySQL2 / mysql2-promise pool → Database
dotenv → Environment variables
CORS → API access from frontend

Datebase:
MySQL Table-

CREATE TABLE users_csv (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



Project Structure:-

backend-app/
│── controllers/
│   └── uploadFile.js
│── routes/
│   └── route.js
│── DataBase/
│   └── db.js
│── uploads/            ← CSV files stored temporarily
│── server.js
│── .env
└── package.json

Setup Instructions:-

1) Clone the repository
git clone https://github.com/002-rajat/CSV_Backend.git
cd CSV_Backend

2) Install dependencies
npm install

3) Configure environment variables

Create a .env file:

PORT=4000
UPLOAD_DIR=./uploads

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306

BATCH_SIZE=1000   # (optional)

4) Start the backend:
npm start

Server runs on :
http://localhost:4000

How It Works:-

CSV Upload Flow:-

1) User uploads a CSV file
2) File is temporarily saved using Multer
3) File is parsed row-by-row using fast-csv
4) Each row is validated:
    Name: alphabet only
    Email: valid format
    Phone: exactly 10 digits
5) Valid rows → inserted into MySQL using batch insert
6) Invalid rows → returned to frontend with reasons
7) CSV file is auto-deleted from server after processing

API Documentation:-

POST /api/upload
Uploads a CSV file.
Request:
   Method: POST
   Content-Type: multipart/form-data
Body:
   file: CSV file (.csv extension only)
   Sample headers:
   name, email, phone


Example Successful Response:- 

   {
  "totalRows": 5,
  "successCount": 4,
  "failedCount": 1,
  "failedRecords": [
    {
      "rowNumber": 3,
      "values": {
        "name": "",
        "email": "bademail",
        "phone": "123"
      },
      "errors": [
        "Name is required",
        "Invalid email format",
       "Phone must be exactly 10 digits"
      ]
    }
  ]
}

Error Responses:-
Invalid File Type

{
  "error": "Only .csv files are allowed"
}

No File Uploaded

{
  "error": "No file uploaded"
}








