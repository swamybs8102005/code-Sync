const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    
    roomId: { type: String, required: true, unique: true },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', DocumentSchema);
