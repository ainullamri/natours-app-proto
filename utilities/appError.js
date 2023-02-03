// SEBELUMNYA

// const err = new Error(

//   `FAILED : Could not find ${req.originalUrl} in this server!`
// );
// err.statusCode = 404;
// err.status = "fail";

// next(err);

class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // akan mengikuti parent classnya

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // sebagai penanda bahwa yang diawasi hanya operasional error sja,
    // tidak termasuk programming error

    Error.captureStackTrace(this, this.constructor); // akan menghasilkan track atau posisi
    //line error ketika memanggil err.stack
  }
}

module.exports = AppError;
