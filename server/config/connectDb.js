import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("DB Connected Successfully");
        // Create analytics indexes after connection is established
        await createIndexes();
    } catch (err) {
        console.log(`Error in connecting to the DB ${err}`);
        process.exit(1); // stop server if DB fails
    }
};

/**
 * Creates MongoDB indexes required for admin analytics queries.
 * createIndex is idempotent — safe to call on every startup.
 * Each index is justified by the specific aggregation query it supports.
 */
const createIndexes = async () => {
    try {
        const db = mongoose.connection.db;

        // Interview indexes
        await db.collection("interviews").createIndex({ userId: 1 });           // per-user queries in all controllers
        await db.collection("interviews").createIndex({ createdAt: -1 });       // time-series aggregations & sorting
        await db.collection("interviews").createIndex({ status: 1 });           // status filter in getInterviews, getDashboardStats
        await db.collection("interviews").createIndex({ mode: 1 });             // mode filter & byMode aggregation
        await db.collection("interviews").createIndex({ finalScore: -1 });      // sort by score in getTopUsers

        // Payment indexes
        await db.collection("payments").createIndex({ userId: 1 });             // per-user payment lookup
        await db.collection("payments").createIndex({ createdAt: -1 });         // revenue time-series
        await db.collection("payments").createIndex({ status: 1 });             // filter paid/failed

        // User indexes
        await db.collection("users").createIndex({ role: 1 });                  // admin user filter
        await db.collection("users").createIndex({ createdAt: -1 });            // user growth analytics

        console.log("Indexes ensured successfully");
    } catch (err) {
        // Non-fatal: log and continue — app still works without indexes, just slower
        console.log("Index creation warning (non-critical):", err.message);
    }
};

export default connectDb;