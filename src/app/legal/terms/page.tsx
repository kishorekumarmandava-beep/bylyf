"use client";

import React from "react";
import PolicyTemplate from "@/components/legal/PolicyTemplate";

export default function TermsPage() {
  return (
    <PolicyTemplate title="Terms of Service" lastUpdated="May 08, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using the BYLYF platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
      </p>

      <h2>2. Use License</h2>
      <p>
        Permission is granted to temporarily download one copy of the materials (information or software) on BYLYF's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
      </p>
      <ul>
        <li>Modify or copy the materials;</li>
        <li>Use the materials for any commercial purpose, or for any public display;</li>
        <li>Attempt to decompile or reverse engineer any software contained on BYLYF's website;</li>
        <li>Remove any copyright or other proprietary notations from the materials.</li>
      </ul>

      <h2>3. User Account & Conduct</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.
      </p>

      <h2>4. Lucky Draw & Coupons</h2>
      <p>
        Participation in any lucky draw or the use of coupons on BYLYF is subject to specific campaign rules. BYLYF reserves the right to disqualify any participant or void any transaction if fraudulent activity is suspected.
      </p>

      <h2>5. Governing Law</h2>
      <p>
        These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in Hyderabad, Telangana.
      </p>
    </PolicyTemplate>
  );
}
