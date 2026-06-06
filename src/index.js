import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import net from "net";
import dns from "dns/promises";
import app from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 8000;

// ── Network probe: runs before MongoDB connect, results in logs ──
async function probeNetwork() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
    const srvHost = uri.replace("mongodb+srv://", "").split("@")[1]?.split("/")[0];

    console.log("=== NETWORK PROBE ===");
    console.log("SRV host:", srvHost || "(could not parse)");

    if (!srvHost) return;

    // 1. DNS SRV lookup
    try {
        const srv = await dns.resolveSrv(`_mongodb._tcp.${srvHost}`);
        console.log("DNS SRV ok:", srv.length, "records");
        srv.forEach(r => console.log(" ->", r.name, "port", r.port));

        // 2. TCP probe on first host
        const target = srv[0];
        await new Promise((resolve) => {
            const sock = new net.Socket();
            const timeout = 5000;
            sock.setTimeout(timeout);
            sock.connect(target.port, target.name, () => {
                console.log(`TCP ${target.name}:${target.port} → OPEN ✅`);
                sock.destroy();
                resolve();
            });
            sock.on("timeout", () => {
                console.log(`TCP ${target.name}:${target.port} → TIMEOUT ❌ (port likely firewalled)`);
                sock.destroy();
                resolve();
            });
            sock.on("error", (e) => {
                console.log(`TCP ${target.name}:${target.port} → ERROR ❌`, e.code);
                sock.destroy();
                resolve();
            });
        });
    } catch (e) {
        console.log("DNS SRV FAILED ❌:", e.code || e.message);
    }
    console.log("=== END PROBE ===");
}

await probeNetwork();

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to the database:", err.message);
        process.exit(1);
    });