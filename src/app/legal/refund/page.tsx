"use client";

import React from "react";
import PolicyTemplate from "@/components/legal/PolicyTemplate";

export default function RefundPage() {
  return (
    <PolicyTemplate title="Refund & Shipping" lastUpdated="May 08, 2026">
      <h2>1. Shipping Policy</h2>
      <p>
        We aim to deliver your products as quickly as possible.
      </p>
      <ul>
        <li><strong>Physical Products:</strong> Usually shipped within 24-48 hours. Estimated delivery time is 3-7 business days across India.</li>
        <li><strong>Digital Products:</strong> Delivered instantly via email and your user dashboard upon successful payment.</li>
      </ul>

      <h2>2. Refund & Cancellation</h2>
      <p>
        <strong>Physical Products:</strong> We offer a 7-day replacement policy for products that are defective or damaged upon arrival. Refunds are processed only if a replacement is unavailable.
      </p>
      <p>
        <strong>Digital Products:</strong> Due to the nature of digital content, all sales of downloadable products, courses, and digital assets are <strong>Final and Non-Refundable</strong> once the download link has been accessed.
      </p>

      <h2>3. Shipping Charges</h2>
      <p>
        Shipping charges are calculated at checkout. We offer Free Shipping for all digital products. For physical products, a flat fee of ₹60 is applicable.
      </p>

      <h2>4. Return Process</h2>
      <p>
        To initiate a return for a physical product, please contact the Grievance Officer or use the "Return" button in your order history within 7 days of delivery.
      </p>
    </PolicyTemplate>
  );
}
