
---
# AuthentiTest
https://youtu.be/KWZtVZcIpa4
--------------

**AuthentiTest** is a comprehensive online examination platform designed to ensure academic integrity through advanced face detection and plagiarism checks. The application leverages AWS Rekognition for real-time face verification, Groq API for AI-generated content and plagiarism analysis, and integrates seamlessly with MongoDB for data persistence.

## Features

- **User Authentication**: Secure registration and login for both teachers and students.
- **Real-Time Face Detection**: Continuous face scanning during exams to prevent impersonation.
- **Plagiarism & AI Detection**: Analyze submitted answers to detect AI-generated content and plagiarism using Groq API.
- **Dynamic Test Management**: Teachers can create, assign, and manage tests; students can view assigned tests and submit answers.
- **Responsive UI**: Built with React and Tailwind CSS for an intuitive user experience.
- **Socket.IO Integration**: Real-time alerts and notifications for enhanced interactivity.

---

## Table of Contents

- [AuthentiTest](#authentitest)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Running the Application](#running-the-application)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [Tests](#tests)
    - [Students](#students)
    - [Face Detection](#face-detection)
  - [Contributing](#contributing)
    - [Steps to Contribute](#steps-to-contribute)
    - [Guidelines for Contributions](#guidelines-for-contributions)
  - [License](#license)
  - [Contact](#contact)

---

## Getting Started

### Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance
- AWS account with Rekognition access
- Groq API key

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/authentiTest.git
   cd authentiTest
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set Up Environment Variables**:
   Create a `.env` file in the `backend` directory with the following structure:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # MongoDB Connection
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/authentiTest?retryWrites=true&w=majority

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here

   # AWS Rekognition Credentials
   AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here

   # Groq API Key
   GROQ_API_KEY=your_groq_api_key_here
   ```

   **Note:** Replace placeholders like `<username>`, `<password>`, and API keys with actual values.

5. **Start the Development Servers**:
   - **Backend**:
     ```bash
     cd backend
     node index.js
     ```
   - **Frontend**:
     ```bash
     cd frontend
     npm run dev
     ```

---

## Running the Application

- **Backend**: Runs on `http://localhost:5000`
- **Frontend**: Runs on `http://localhost:5173`

Access the application via the frontend URL.

---

## API Endpoints

### Authentication

- `POST /register`: Register a new user (teacher or student).
- `POST /login`: Authenticate and log in a user.
- `GET /me`: Retrieve authenticated user details.
- `POST /logout`: Log out the current user.

### Tests

- `POST /tests`: Create a new test (Teacher only).
- `GET /tests`: Fetch all tests (filtered by role).
- `POST /tests/:id/submit`: Submit answers for a test (Student only).
- `POST /tests/:id/assign`: Assign a test to a student (Teacher only).

### Students

- `GET /students`: Fetch all students (Teacher only).

### Face Detection

- `POST /detect-faces`: Detect faces in an uploaded image.

---

## Contributing

We welcome contributions from the community! Here's how you can contribute:

### Steps to Contribute

1. **Fork the Repository**:
   - Click the "Fork" button on the top-right corner of this repository to create a copy under your GitHub account.

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/your-username/authentiTest.git
   cd authentiTest
   ```

3. **Create a New Branch**:
   ```bash
   git checkout -b feature/YourFeatureName
   ```

4. **Make Your Changes**:
   - Add new features, fix bugs, or improve existing functionality.
   - Ensure your code adheres to the project's coding standards.

5. **Test Your Changes**:
   - Run the application locally to verify that your changes work as expected.

6. **Commit Your Changes**:
   ```bash
   git add .
   git commit -m "Add some feature"
   ```

7. **Push to Your Fork**:
   ```bash
   git push origin feature/YourFeatureName
   ```

8. **Open a Pull Request**:
   - Go to the original repository and click "New Pull Request."
   - Provide a detailed description of your changes and submit the PR.

### Guidelines for Contributions

- Ensure your code is well-documented.
- Write unit tests for new features or bug fixes.
- Follow the existing code style and conventions.
- Describe your changes clearly in the pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For questions or feedback, please contact:

- Email: codedpool10@gmail.com
- GitHub: [https://github.com/your-repo/authentiTest](https://github.com/your-repo/authentiTest)

---

Thank you for using **AuthentiTest**! We hope this platform helps maintain academic integrity while providing a seamless testing experience.

--- 

Create with ❤️ and 🧠 @ DUHACKS4.0 by 🦊🐢
