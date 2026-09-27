import multer from "multer";

const storage = multer.diskStorage({
  // You're telling Multer: "I want to save uploaded files on the disk."

  destination: function (req, file, cb) {
    // req → information about the user's request
    // file → information about the uploaded file
    // cb → callback function that tells Multer what to do
    cb(null, "./public/temp"); //"There is no error (null), and use ./public/temp as the destination."
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // "Keep the original name of the uploaded file."
  },
});

export const upload = multer({
  storage, // Now you're creating the actual Multer middleware called:
});
