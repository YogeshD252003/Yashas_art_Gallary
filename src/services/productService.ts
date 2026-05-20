import { firestore } from '../firebase/firebaseConfig';
import { collection, addDoc, getDoc, doc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { uploadFile } from '../firebase/storage';

export interface Product {
  id?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  stock: number;
  tags?: string[];
  type: 'IMAGE' | '3D';
  images: string[]; // URLs for images or thumbnails
  modelUrl?: string; // URL for 3D model (if type === '3D')
  createdAt?: any;
}

const productsCol = collection(firestore, 'products');

/**
 * Create a new product. Handles file upload (image or 3D model) and stores metadata.
 */
export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>, file: File | null): Promise<string> => {
  let imageUrl = '';
  let modelUrl = '';
  if (file) {
    if (product.type === 'IMAGE') {
      imageUrl = await uploadFile(file, 'images', true);
    } else {
      modelUrl = await uploadFile(file, 'models', false);
      // For 3D we can also generate a thumbnail later (placeholder for now)
    }
  }

  const docRef = await addDoc(productsCol, {
    ...product,
    images: product.type === 'IMAGE' ? [imageUrl] : [],
    modelUrl: product.type === '3D' ? modelUrl : undefined,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

/** Fetch a single product by ID */
export const fetchProduct = async (id: string): Promise<Product | null> => {
  const docRef = doc(firestore, 'products', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
};

/** List all products, ordered by creation date descending */
export const listProducts = async (): Promise<Product[]> => {
  const q = query(productsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
};

/** Delete a product and its associated storage files */
export const deleteProduct = async (id: string): Promise<void> => {
  // NOTE: In a real app you would also delete storage files using deleteObject.
  const docRef = doc(firestore, 'products', id);
  await deleteDoc(docRef);
};
