async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/leaderboard');
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
main();
