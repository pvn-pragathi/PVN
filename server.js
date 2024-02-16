const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const excel = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const http = require("http");
const socketIO = require("socket.io");
const Circular = require("./models/circular");
const axios = require('axios');
require('dotenv').config();
const {
  populateDatabaseFromExcel,
  getLatestFilePath,
  sendEmail,
  populateMarksFromExcel,
  calculateGrade,
  calculatePoints,
  calculateOverallGrade,
  calculateGPA,
  updateExcelFile
} = require("./utils");
const PORT = process.env.PORT || 5000;
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "Pragathi@12345",
    resave: false,
    saveUninitialized: true,
  })
);

const authorizedUsers = {
  username: 'chiefguest',
  password: 'launch123',
};

// Middleware to check if the user is authenticated
const authenticate = (req, res, next) => {
  const { username, password } = req.body;
  if (username === authorizedUsers.username && password === authorizedUsers.password) {
    // Authentication successful
    return next();
  }
  // Authentication failed
  res.redirect('/login?error=true');
};

// Middleware to redirect unauthorized users to login page
const requireAuth = (req, res, next) => {
  const isAuthenticated = req.session.isAuthenticated || false;
  if (!isAuthenticated) {
    return res.redirect('/login');
  }
  next();
};

// Login route (exclude from maintenance middleware)
app.get('/login', (req, res) => {
  const error = req.query.error === 'true';
  res.render('login', { error });
});

// Authenticate and set session on login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === authorizedUsers.username && password === authorizedUsers.password) {
    req.session.isAuthenticated = true;
    return res.redirect('/launch-portal');
  }
  res.redirect('/login?error=true');
});

// Launch portal route (requires authentication)
app.get('/launch-portal', requireAuth, (req, res) => {
  res.render('launch-portal');
});

let isUnderMaintenance = true;

// Assuming you are using Express
app.post('/toggle-maintenance', (req, res) => {
  isUnderMaintenance = !isUnderMaintenance;
  console.log("Toggled");
  res.json({ status: 'success', isUnderMaintenance });
});

app.use((req, res, next) => {
  if (isUnderMaintenance) {
    return res.render('maintenance'); // Display maintenance page
  }
  next();
});




const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the destination folder where uploaded files will be stored
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Specify a custom filename for the uploaded file
    cb(null, file.originalname);
  },
});

// const upload = multer({ storage: storage });

app.use(methodOverride("_method"));

const uri =
  "mongodb+srv://swaroop-chikkam:630swaroop@pvn.vdv88pa.mongodb.net/PVNDB?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// app.get("/admin", function (req, res) {
//   res.render("admin", { message: "" });
// });

// app.post(
//   "/admin",
//   upload.fields([
//     { name: "file", maxCount: 1 },
//     { name: "fileFA1", maxCount: 1 },
//     { name: "fileFA2", maxCount: 1 },
//     { name: "fileFA3", maxCount: 1 },
//     { name: "fileFA4", maxCount: 1 },
//     { name: "fileSA1", maxCount: 1 },
//     { name: "fileSA2", maxCount: 1 },
//     { name: "daySchoolFiles", maxCount: 25 },
//   ]),
//   async function (req, res) {
//     const username = req.body.username.trim();
//     const password = req.body.password.trim();

//     if (username === "PVN@admin" && password === "PVN@website") {
//       req.session.adminAuthenticated = true;

//       if (req.files) {
//         const examFiles = [
//           { fieldName: "fileFA1", examName: "FA-1" },
//           { fieldName: "fileFA2", examName: "FA-2" },
//           { fieldName: "fileFA3", examName: "FA-3" },
//           { fieldName: "fileFA4", examName: "FA-4" },
//           { fieldName: "fileSA1", examName: "SA-1" },
//           { fieldName: "fileSA2", examName: "SA-2" },
//         ];

//         for (const examFile of examFiles) {
//           const fieldName = examFile.fieldName;
//           const examName = examFile.examName;
//           const files = req.files[fieldName];

//           if (files && files.length > 0) {
//             const file = files[0];
//             const newFilePath = path.join(
//               __dirname,
//               "student-marks-sheet",
//               `${examName}.xlsx`
//             );
//             const previousFilePath = getLatestFilePath("student-marks-sheet/");

//             if (previousFilePath) {
//               fs.unlinkSync(previousFilePath);
//               console.log(`Previous file ${previousFilePath} removed.`);
//             }

//             fs.renameSync(file.path, newFilePath);
//             console.log(`File ${file.path} moved to ${newFilePath}.`);

//             try {
//               await populateMarksFromExcel(newFilePath, examName);
//               console.log(
//                 `Marks population for ${examName} completed successfully.`
//               );
//             } catch (error) {
//               console.error(`Error updating marks for ${examName}:`, error);
//             }
//           } else {
//             console.log(`No file uploaded for ${examName}`);
//           }
//         }

//         const schoolDataFiles = req.files["file"];

//         if (schoolDataFiles && schoolDataFiles.length > 0) {
//           const schoolDataFile = schoolDataFiles[0];
//           const newFilePath = path.join(
//             __dirname,
//             "student-details",
//             schoolDataFile.originalname
//           );
//           const previousFilePath = getLatestFilePath("student-details/");

//           if (previousFilePath) {
//             fs.unlinkSync(previousFilePath);
//             console.log(`Previous file ${previousFilePath} removed.`);
//           }

//           fs.renameSync(schoolDataFile.path, newFilePath);
//           console.log(`File ${schoolDataFile.path} moved to ${newFilePath}.`);

//           try {
//             await populateDatabaseFromExcel(
//               newFilePath,
//               false,
//               Student,
//               DayStudent
//             );
//             console.log("School database updated successfully.");
//           } catch (error) {
//             console.error("Error updating school database:", error);
//           }
//         } else {
//           console.log("No school data file uploaded");
//         }

//         const daySchoolDataFiles = req.files["daySchoolFiles"];

//         if (daySchoolDataFiles && daySchoolDataFiles.length > 0) {
//           for (const daySchoolDataFile of daySchoolDataFiles) {
//             const newFilePath = path.join(
//               __dirname,
//               "day-student-details",
//               daySchoolDataFile.originalname
//             );
//             const previousFilePath = path.join(
//               __dirname,
//               "day-student-details",
//               daySchoolDataFile.originalname
//             );

//             if (fs.existsSync(previousFilePath)) {
//               fs.unlinkSync(previousFilePath);
//               console.log(`Previous file ${previousFilePath} removed.`);
//             }

//             fs.renameSync(daySchoolDataFile.path, newFilePath);
//             console.log(
//               `File ${daySchoolDataFile.path} moved to ${newFilePath}.`
//             );

//             try {
//               await populateDatabaseFromExcel(
//                 newFilePath,
//                 true,
//                 Student,
//                 DayStudent
//               );
//               console.log("Day school database updated successfully.");
//             } catch (error) {
//               console.error("Error updating day school database:", error);
//             }
//           }
//         } else {
//           console.log("No day school data files uploaded");
//         }
//       } else {
//         console.log("No files uploaded");
//       }

//       res.redirect("/admin");
//     } else {
//       res.redirect("/admin?error=Authentication failed");
//     }
//   }
// );

app.post("/student-login", async (req, res) => {
  const aadharNumber = req.body.aadhar.replace(/\s/g, "");
  const password = req.body.password;
  try {
    // First, check in hostel_students collection
    var student = await db
      .collection("hostel_students")
      .findOne({ "AADHAR NO": aadharNumber }, { maxTimeMS: 30000 });

    // If no data found in hostel_students, check in day_students_collection
    if (!student) {
      student = await db
        .collection("day_students_collection")
        .findOne({ AADHAR: aadharNumber }, {maxTimeMS: 30000 });
    }

    // If still no data found, display an error message
    if (!student) {
      console.log(
        "Aadhar number not found in the database. Please update your Aadhar number in the database."
      );
      return res.render("student-login", {
        message:
          "Aadhar number not found in the database. Please update your Aadhar number in the database.",
      });
    }

    // Rest of the existing code to handle authentication and rendering the student details
    var admissionNumber = student["ADMN"].toString();
    const expectedPassword = `PVN@${admissionNumber}`;

    if (password !== expectedPassword) {
      console.log("Invalid password");
      return res.render("student-login", { message: "Invalid password" });
    }

    const studentDetails = student;
    delete studentDetails._id;
    req.session.student = {
      class: studentDetails.CLASS,
    };
    req.session.studentId = student._id; // Store the student ID in the session
    res.set("Cache-Control", "no-store");
    return res.render("student-details", {
      studentDetails,
      marks: true,
      calculateGrade,
      calculatePoints,
      calculateOverallGrade,
      calculateGPA,
    });
  } catch (error) {
    console.error("Error retrieving student details from the database:", error);
    return res.render("student-login", {
      message: "An error occurred. Please try again later.",
    });
  }
});

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/admission", function (req, res) {
  const submitted = req.session.submitted;
  const error = req.session.error;
  delete req.session.submitted;
  delete req.session.error;
  res.render("admission", { submitted, error });
});

app.post("/admission", async function (req, res) {
  try {
    const formData = req.body;
    const formattedData = `Name: ${formData.studentname}\nMother Name: ${formData.mothername}\nFather Name: ${formData.fathername}\nStudent age: ${formData.age}\nDOB: ${formData.dob}\nAdmission Class: ${formData.admissioninto}\nAddress: ${formData.address}\nContact Address: ${formData.contact_address}\nAadhar No: ${formData.aadhar}\nContact-1: ${formData.contact1}\nContact-2: ${formData.contact2}`;

    // Send email with formatted data
    await sendEmail(formattedData);

    // Update existing Excel file in the public folder
    const excelFilePath = path.join(__dirname, "public", "existing_data.xlsx");
    await updateExcelFile(excelFilePath, formData);

    // Set a flag to indicate successful form submission
    req.session.submitted = true;
    res.redirect("/admission");
  } catch (error) {
    console.error("Error handling form submission:", error);
    // Set an error flag to indicate form submission error
    req.session.error = true;
    res.redirect("/admission");
  }
});

app.get("/admin/admissions", function (req, res) {
  const excelFilePath = path.join(__dirname, "public", "existing_data.xlsx");

  // Set the appropriate headers for file download
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=existing_data.xlsx");

  // Stream the file to the response
  const fileStream = fs.createReadStream(excelFilePath);
  fileStream.pipe(res);
});



const GITHUB_REPO_OWNER = 'pvn-pragathi';
const GITHUB_REPO_NAME = 'PVN-gallery';
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

app.get('/gallery', async (req, res) => {
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/`;
    const headers = {
      Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
    };

    const response = await axios.get(apiUrl, { headers });

    const folders = response.data
      .filter(item => item.type === 'dir')
      .map(item => ({
        name: item.name.substring(3),  // Remove the first two characters
        url: item.url,
      }))
      .sort((a, b) => parseInt(b.name.split('.')[0]) - parseInt(a.name.split('.')[0]));

    const folderPromises = folders.map(async (folder) => {
      const folderContents = await axios.get(folder.url, { headers });
      const imageFiles = folderContents.data
        .filter(item => item.type === 'file')
        .filter(item => isImageFile(item.name));

      const imagePromises = imageFiles.map(async (item) => {
        const imageDetails = await axios.get(item.url, { headers });
        return imageDetails.data.download_url;
      });

      return { name: folder.name, images: await Promise.all(imagePromises) };
    });

    const resolvedFolders = await Promise.all(folderPromises);

    const photos = Object.fromEntries(resolvedFolders.map(folder => [folder.name, folder.images]));

    res.render('gallery', { folders, photos, GITHUB_REPO_OWNER, GITHUB_REPO_NAME });
  } catch (err) {
    console.error('Error fetching GitHub repository contents:', err);
    res.render('gallery', { folders: [], photos: {}, GITHUB_REPO_OWNER, GITHUB_REPO_NAME });
  }
});





function isImageFile(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}


// const gallery_storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, uuidv4() + '-' + file.originalname);
//   },
// });

// const gallery_upload = multer({ storage: gallery_storage });

// // Render gallery-login or gallery-upload page based on authentication
// app.get('/gallery-upload', (req, res) => {
//   // Check if user is already authenticated (replace this with your actual logic)
//   const isAuthenticated = req.session.isAuthenticated === true;

//   if (isAuthenticated) {
//     res.render('gallery-upload.ejs');
//   } else {
//     res.render('gallery-login.ejs');
//   }
// });

// // Handle authentication
// app.post('/gallery-upload', (req, res) => {
//   const { username, password } = req.body;

//   // Check credentials (replace this with your actual authentication logic)
//   if (username === 'PVN@admin' && password === 'PVN@gallery') {
//     // Set authentication status in session
//     req.session.isAuthenticated = true;
//     // Redirect to the /gallery-upload route after successful authentication
//     res.redirect('/gallery-upload');
//   } else {
//     res.send('Invalid credentials');
//   }
// });

// app.post('/gallery-upload', upload.array('images'), async (req, res) => {
//   const { title } = req.body;
//   const images = req.files;

//   // Authenticate with GitHub (replace with your actual authentication logic)
//   const token = GITHUB_ACCESS_TOKEN; // Replace with your GitHub token
//   const headers = { Authorization: `Bearer ${token}` };

//   // GitHub repository details
//   const owner = GITHUB_REPO_OWNER;
//   const repo = GITHUB_REPO_NAME;
//   const branch = 'main'; // Replace with your branch name

//   // Loop through uploaded images and upload to GitHub
//   try {
//     for (const image of images) {
//       const content = fs.readFileSync(image.path, { encoding: 'base64' });

//       // Create or update file in GitHub repository
//       await axios.put(
//         `https://api.github.com/repos/${owner}/${repo}/contents/${title}/${image.originalname}`,
//         {
//           message: 'Upload image',
//           content: content,
//           branch: branch,
//         },
//         { headers: headers }
//       );

//       // Optionally, you can remove the local file after uploading to GitHub
//       fs.unlinkSync(image.path);
//     }

//     res.send('Images uploaded successfully');
//   } catch (error) {
//     console.error('Error uploading images to GitHub:', error.message);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.get("/fee", function (req, res) {
  res.render("fee");
});

app.get("/ssc-results", function (req, res) {
  res.render("ssc-results");
});

app.get("/rules", function (req, res) {
  res.render("rules");
});

app.get("/student-login", (req, res) => {
  res.render("student-login", { message: "" });
});

app.get("/circulars", async (req, res) => {
  try {
    // Retrieve circulars and sort them by date in descending order
    const circulars = await Circular.find();

    // Render the circulars page with the sorted circulars
    res.render("circulars", {
      circulars,
      message: "",
      teacherLoggedIn: req.session.teacher,
    });
  } catch (error) {
    console.error("Error retrieving circulars:", error);
    res.render("circulars", {
      circulars: [],
      message: "Error retrieving circulars",
      teacherLoggedIn: req.session.teacher,
    });
  }
});


app.get("/teacher-login", (req, res) => {
  res.render("teacher-login", { message: "" });
});

app.post("/teacher-login", (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password.trim();

  if (username === "PVN@teacher" && password === "PVN@circular") {
    req.session.teacher = true;
    res.redirect("/post-circular");
  } else {
    res.render("teacher-login", { message: "Invalid username or password" });
  }
});

const checkTeacherAuth = (req, res, next) => {
  if (req.session.teacher) {
    // If teacher is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // If not authenticated, redirect to teacher login page
    res.redirect("/teacher-login");
  }
};

// Apply the middleware to the "/post-circular" route
app.get("/post-circular", checkTeacherAuth, (req, res) => {
  res.render("post-circular", { message: "" });
});

app.post("/post-circular", async (req, res) => {
  if (!req.session.teacher) {
    return res.redirect("/teacher-login");
  }

  const { title, classes, date, day, content } = req.body;
  const circular = new Circular({
    title,
    classes,
    date,
    day,
    content,
  });

  try {
    await circular.save();
    io.emit("newCircular", circular);
    return res.redirect("/post-circular");
  } catch (error) {
    console.error("Error posting circular:", error);
    return res.redirect("/post-circular");
  }
});

app.delete("/circulars/:id", async (req, res) => {
  if (req.session.teacher) {
    const circularId = req.params.id;

    try {
      await Circular.findByIdAndDelete(circularId);
      console.log("Circular deleted:", circularId);
      res.redirect("/circulars");
    } catch (error) {
      console.error("Error deleting circular:", error);
      res.redirect("/circulars");
    }
  } else {
    res.redirect("/teacher-login");
  }
});

app.use((req, res, next) => {
  res.status(404).render('404'); // Render the 404 EJS view
});

app.listen(PORT, function () {
  console.log(`Server started at port ${PORT}.`);
});
