// const mongoose = require('mongoose');

// const paaSchema =  mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'user',
//     },
//     query: {
//         searchQuery: {type: String},
//         resultStats: {type: String},
//         paa: {
//             q1:{type: String},
//             q2:{type: String},
//             q3:{type: String},
//             q4:{type: String}
//         },
//         hl: {type: String},
//         gl: {type: String},
//     },
//     date: {
//         type: Date,
//         default: Date.now,
//         required: true
//     },

// });

// module.exports = mongoose.model('paa', paaSchema);


const mongoose = require('mongoose');

const paaSchema =  mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    query: {
        q: {type: String},
        hl: {type: String},
        gl: {type: String}
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },

});

module.exports = mongoose.model('paa', paaSchema);