"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AdminNav from "@/components/admin/AdminNav";
import { 
  Upload, 
  Trash2, 
  Save, 
  ChevronLeft,
  Package,
  FileDigit,
  Percent,
  Truck,
  Zap,
  FileText
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    type: "physical" as "physical" | "digital",
    mrp: 0,
    sellingPrice: 0,
    gstRate: 18,
    hsnSac: "",
    taxMode: "inclusive",
    sku: "",
    stock: 0,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    category: "",
    brand: "",
    luckyDrawEligible: false,
    tags: ""
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [digitalFileName, setDigitalFileName] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || "",
            slug: data.slug || "",
            description: data.description || "",
            type: data.type || "physical",
            mrp: data.mrp || 0,
            sellingPrice: data.sellingPrice || 0,
            gstRate: data.gstRate || 18,
            hsnSac: data.hsnSac || "",
            taxMode: data.taxMode || "inclusive",
            sku: data.sku || "",
            stock: data.stock || 0,
            weight: data.weight || 0,
            dimensions: data.dimensions || { length: 0, width: 0, height: 0 },
            category: data.category || "",
            brand: data.brand || "",
            luckyDrawEligible: data.luckyDrawEligible || false,
            tags: data.tags ? data.tags.join(", ") : ""
          });
          setExistingImages(data.images || []);
        } else {
          toast.error("Product not found");
          router.push("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error loading product");
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDigitalFile(file);
      setDigitalFileName(file.name);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages([...newImages, ...files]);
      const urls = files.map(file => URL.createObjectURL(file));
      setNewPreviews([...newPreviews, ...urls]);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload New Images
      const newImageUrls = await Promise.all(
        newImages.map(async (file) => {
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );

      const finalImages = [...existingImages, ...newImageUrls];

      // 2. Upload Digital File (if changed/new and digital type)
      let digitalUrl = "";
      if (formData.type === "digital" && digitalFile) {
        const digitalRef = ref(storage, `digital-products/${Date.now()}_${digitalFile.name}`);
        const snapshot = await uploadBytes(digitalRef, digitalFile);
        digitalUrl = await getDownloadURL(snapshot.ref);
      }

      // 3. Prepare Data
      const productData = {
        ...formData,
        mrp: Number(formData.mrp),
        sellingPrice: Number(formData.sellingPrice),
        stock: Number(formData.stock),
        weight: Number(formData.weight),
        tags: formData.tags.split(",").map(t => t.trim()),
        images: finalImages,
        updatedAt: serverTimestamp(),
      };

      // 4. Update Firestore
      const docRef = doc(db, "products", id as string);
      await updateDoc(docRef, productData);

      // 5. Update Digital Metadata if provided
      if (formData.type === "digital" && digitalUrl) {
        await addDoc(collection(db, "product_content"), {
          productId: id as string,
          fileUrl: digitalUrl,
          fileName: digitalFileName,
          fileSize: digitalFile?.size || 0,
          createdAt: serverTimestamp(),
        });
      }
      
      toast.success("Product updated successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="min-h-screen flex items-center justify-center font-bold italic">Loading product...</div>;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h1 className="text-4xl font-black tracking-tight">Edit Product</h1>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Product"}
              <Save className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Product Title</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                      onChange={(e) => setFormData({...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, "-")})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Description</label>
                    <textarea 
                      rows={5}
                      required
                      value={formData.description}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Brand</label>
                      <input 
                        type="text" 
                        required
                        value={formData.brand}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Category</label>
                      <input 
                        type="text" 
                        required
                        value={formData.category}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Percent className="w-6 h-6 text-primary" />
                  Pricing & GST
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">MRP</label>
                    <input 
                      type="number" 
                      required
                      value={formData.mrp}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none font-bold"
                      onChange={(e) => setFormData({...formData, mrp: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Selling Price</label>
                    <input 
                      type="number" 
                      required
                      value={formData.sellingPrice}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none font-bold text-primary"
                      onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">GST Rate (%)</label>
                    <select 
                      value={formData.gstRate}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                      onChange={(e) => setFormData({...formData, gstRate: Number(e.target.value)})}
                    >
                      <option value="18">18%</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="28">28%</option>
                      <option value="0">Exempt</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">HSN Code</label>
                    <input 
                      type="text" 
                      required
                      value={formData.hsnSac}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                      onChange={(e) => setFormData({...formData, hsnSac: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Truck className="w-6 h-6 text-primary" />
                  Inventory & Shipping
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Stock Quantity</label>
                    <input 
                      type="number" 
                      required
                      value={formData.stock}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none font-bold"
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Weight (KG)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required={formData.type === "physical"}
                      value={formData.weight}
                      className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none"
                      onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-primary text-primary-foreground rounded-[2.5rem] p-8">
                <h3 className="text-lg font-black mb-6">Product Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, type: "physical"})}
                    className={cn("py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", formData.type === "physical" ? "bg-white text-primary" : "bg-white/10")}>
                    <Truck className="w-4 h-4" /> Physical
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, type: "digital"})}
                    className={cn("py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all", formData.type === "digital" ? "bg-white text-primary" : "bg-white/10")}>
                    <FileDigit className="w-4 h-4" /> Digital
                  </button>
                </div>
              </div>

              {formData.type === "digital" && (
                <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                  <h3 className="text-lg font-black mb-6">Digital Asset</h3>
                  <label className="w-full h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary relative">
                    {digitalFile ? (
                      <div className="text-center p-4">
                        <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                        <div className="text-xs font-bold truncate max-w-[200px]">{digitalFileName}</div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                        <span className="text-[10px] font-bold">Update File</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={handleDigitalFileChange} />
                  </label>
                </div>
              )}

              <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                <h3 className="text-lg font-black mb-6">Images</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {existingImages.map((url, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-border relative group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(url)} className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {newPreviews.map((url, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-border relative group border-primary/50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(i)} className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <input type="file" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-black text-sm">Lucky Draw</span>
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, luckyDrawEligible: !formData.luckyDrawEligible})}
                    className={cn("w-12 h-6 rounded-full relative transition-colors", formData.luckyDrawEligible ? "bg-primary" : "bg-muted")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", formData.luckyDrawEligible ? "left-7" : "left-1")}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
