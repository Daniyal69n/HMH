import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'Rs'
  },
  image: {
    type: String, // Store Base64 string or URL
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ name: 'text' });

// Prevent model recompilation in development
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product = mongoose.model('Product', productSchema);

export default Product;
