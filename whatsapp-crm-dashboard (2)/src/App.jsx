import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase config (your details already embedded)
const supabase = createClient(
  "https://ynjwdcjhqzodrwjbalnl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluandkY2pocXpvZHJ3amJhbG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzM0NzQsImV4cCI6MjA3MjE0OTQ3NH0.cdB6BefZu8-PgAGgVAYpVqpzBR6w24OJw66F6aPJCZ0"
);

// n8n webhook endpoint
const N8N_WEBHOOK = "https://autobricksoffcial.app.n8n.cloud/webhook/b314255f-3bce-490c-84ed-c6932bf5be5e/webhook";

export default function App() {
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel("realtime:leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (payload) => {
        console.log("Realtime change:", payload);
        fetchLeads();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLeads() {
    let { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error) setLeads(data);
  }

  async function sendMessage(leadId) {
    await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, message }),
    });
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">WhatsApp CRM Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Contacts</h2>
          <ul>
            {leads.map((lead) => (
              <li key={lead.id} className="border-b py-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => setMessage(`Hi ${lead.name || "there"}!`)}
                >
                  {lead.name || lead.phone}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-2 bg-white rounded-lg shadow p-4 flex flex-col">
          <h2 className="font-semibold mb-2">Chat</h2>
          <textarea
            className="border p-2 rounded mb-2"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply..."
          />
          <button
            onClick={() => leads[0] && sendMessage(leads[0].id)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send to Latest Lead
          </button>
        </div>
      </div>
    </div>
  );
}
