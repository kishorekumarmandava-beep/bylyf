"use client";

import React from "react";
import PolicyTemplate from "@/components/legal/PolicyTemplate";

export default function PrivacyPage() {
  return (
    <PolicyTemplate title="Privacy Policy" lastUpdated="May 08, 2026">
      <h2>1. Information We Collect</h2>
      <p>
        We collect several different types of information for various purposes to provide and improve our Service to you:
      </p>
      <ul>
        <li><strong>Personal Data:</strong> Name, email address, phone number, and shipping address.</li>
        <li><strong>Usage Data:</strong> Information on how the Service is accessed and used.</li>
        <li><strong>Consent Data:</strong> Logs of your acceptance of our policies and marketing preferences.</li>
      </ul>

      <h2>2. Use of Data</h2>
      <p>
        BYLYF uses the collected data for various purposes:
      </p>
      <ul>
        <li>To provide and maintain our Service;</li>
        <li>To notify you about changes to our Service;</li>
        <li>To provide customer support;</li>
        <li>To gather analysis or valuable information so that we can improve our Service;</li>
        <li>To monitor the usage of our Service;</li>
        <li>To detect, prevent and address technical issues.</li>
      </ul>

      <h2>3. Data Retention & Consent</h2>
      <p>
        As per our audit requirements, we store your consent logs including timestamps and policy versions. This is to ensure compliance with digital e-commerce regulations in India.
      </p>

      <h2>4. Your Data Protection Rights</h2>
      <p>
        You have the right to access, update or delete the information we have on you. If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us.
      </p>
    </PolicyTemplate>
  );
}
