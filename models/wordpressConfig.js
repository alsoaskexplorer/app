const mongoose = require("mongoose");
const { Schema } = mongoose;  // Destructure Schema from mongoose

mongoose.connect("mongodb+srv://alsoaskexplorer:BFQ7$XZ97irzqxA@alsoaskexplorer.oz2hb.mongodb.net/?retryWrites=true&w=majority&appName=alsoaskexplorer");

const wordpressConfigSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wpconfig: [
      {
        url: {
          type: String,
          required: true,
        },
        username: {
          type: String,
          required: true,
        },
        password: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WordpressConfig", wordpressConfigSchema);
