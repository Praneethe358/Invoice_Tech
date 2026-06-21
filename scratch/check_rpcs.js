const supabaseUrl = 'https://atcdcbcybgturgswfjjo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0Y2RjYmN5Ymd0dXJnc3dmampvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTQxNjk1NSwiZXhwIjoyMDk2OTkyOTU1fQ.NQ4EKU7FQTsaGJ-fgfNftNHMOiJnvUode26cuLlH3Dg';

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    const paths = Object.keys(data.paths || {});
    console.log("Available paths:");
    paths.filter(p => p.includes('rpc')).forEach(p => console.log(p));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
