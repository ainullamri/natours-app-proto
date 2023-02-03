class APIFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY
    // 1A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    queryStr = JSON.parse(queryStr);

    // code di atas akan mengubah a ==> b
    // a. { difficulty : 'easy', duration: { gte: 5 } } // query string from get request
    // b. { difficulty : 'easy', duration: { $gte: 5 } } // mongoDB query method
    // gte, gt, lte, lt

    this.query = this.query.find(queryStr);
    return this;

    // find mongosh method return a Promise Array
    // const query = Tour.find()
    //   .where("duration")
    //   .equals(5)
    //   .where("difficulty")
    //   .equals("easy");
  }

  sort() {
    // 2) Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.replaceAll(",", " ");
      this.query = this.query.sort(sortBy);
      // console.log(req.this.query);
      // console.log(sortBy);
    } else {
      this.query = this.query.sort("-_id");
      // this.query = this.query.sort("-createdAt");
      // not work well because the data created at the same time.
      // instead use another sort string
    }

    return this;
  }

  limitFields() {
    // 3) Fields Limiting (Projecting) only return selected property
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replaceAll(",", " ");
      // console.log(fields);
      this.query = this.query.select(fields);
    } else {
      // default field
      this.query = this.query.select("-__v");
    }

    return this;
  }

  pagination() {
    // 4) Pagination & Limitation/page
    const page = this.queryString.page * 1 || 1;
    const limitValue = this.queryString.limit * 1 || 100;
    const skipValue = (page - 1) * limitValue;
    // misal limit = 3
    // kalau halaman 3, berarti skip 6 document (3-1) * 3
    // akan mulai dari 21, skip 20

    //=3 & limit=10, page 1 = 1 - 10, page 2 == 11 - 20, dst
    this.query = this.query.skip(skipValue).limit(limitValue);

    return this;
  }
}

module.exports = APIFeature;
