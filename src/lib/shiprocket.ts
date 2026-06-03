/**
 * BYLYF Shiprocket Integration Service
 * 
 * Handles:
 * 1. Authentication with Shiprocket API
 * 2. Creating custom shipments on order success
 * 3. Fetching tracking status
 */

export async function createShiprocketOrder(orderData: any) {
  const EMAIL = process.env.SHIPROCKET_EMAIL;
  const PASSWORD = process.env.SHIPROCKET_PASSWORD;

  if (!EMAIL || !PASSWORD) {
    console.warn("⚠️ Shiprocket Integration Skipped: No credentials found in .env");
    return { success: false, error: "Credentials missing" };
  }

  try {
    // 1. Authenticate to get token
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const { token } = await authRes.json();

    // 2. Create Order in Shiprocket
    const shipRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderData.orderId,
        order_date: new Date().toISOString(),
        pickup_location: "Primary", // Must match your Shiprocket setup
        billing_customer_name: orderData.customerName,
        billing_last_name: "",
        billing_address: orderData.address,
        billing_city: orderData.city,
        billing_pincode: orderData.pincode,
        billing_state: orderData.state,
        billing_country: "India",
        billing_email: orderData.email || "support@bylyf.com",
        billing_phone: orderData.phone,
        shipping_is_billing: true,
        order_items: orderData.items.map((item: any) => ({
          name: `${item.title}${item.selectedSize ? ` (${item.selectedSize})` : ""}${item.selectedColor ? ` [${item.selectedColor}]` : ""}`,
          sku: item.sku || item.id,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
          hsn: item.hsn || ""
        })),
        payment_method: "Prepaid",
        sub_total: orderData.total,
        length: 10,
        width: 10,
        height: 10,
        weight: 0.5
      }),
    });

    const result = await shipRes.json();
    return { success: shipRes.ok, result };
  } catch (error) {
    console.error("❌ Shiprocket API Error:", error);
    return { success: false, error };
  }
}
