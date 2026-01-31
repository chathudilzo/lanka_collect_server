require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("../models/User");
const Branch = require("../models/Branch");
const Center = require("../models/Center");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const Receipt = require("../models/Receipt");
const loanService = require("../services/loanService");

const ratnapuraLocations = [
  "Ratnapura Town",
  "Balangoda",
  "Embilipitiya",
  "Eheliyagoda",
  "Pelmadulla",
  "Kuruwita",
  "Kahawatta",
  "Rakwana",
  "Kalawana",
  "Nivithigala",
  "Godakawela",
  "Ayagama",
  "Weligepola",
  "Opanayaka",
  "Kolonna",
  "Kiriella",
  "Imbulpe",
  "Udawalawe",
  "Pallebedda",
  "Pinnawala",
  "Gilimale",
  "Sri Palabaddala",
  "Wewelwatta",
  "Dodampe",
  "Parakaduwa",
  "Dela",
  "Lellopitiya",
  "Hidellana",
  "Batugedara",
  "Malwala",
  "Pathakada",
  "Karandana",
  "Teppanawa",
  "Panamura",
  "Weralupa",
  "Mudduwa",
  "Angammana",
  "Muwagama",
  "Thiriwanaketiya",
  "Hangamuwa",
  "Rassagala",
  "Ranwala",
  "Pothupitiya",
  "Kaltota",
  "Morahela",
  "Madalagama",
  "Marapana",
  "Ellepola",
  "Galabada",
  "Niralagama",
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Connection Successful. Starting Scaled Ratnapura Seed...");

    // 1. CLEAR DATA
    await Promise.all([
      Branch.deleteMany({}),
      User.deleteMany({}),
      Center.deleteMany({}),
      Customer.deleteMany({}),
      Loan.deleteMany({}),
      Receipt.deleteMany({}),
    ]);

    // 2. CREATE BRANCH
    const branchRNP = await Branch.create({
      branchId: "BR-RNP-01",
      name: "Ratnapura Main Branch",
      address: "Main Street, Ratnapura",
      contactNumber: "0452223344",
    });

    const adminRNP = await User.create({
      name: "Ratnapura Admin",
      email: "admin.rnp@finance.lk",
      password: "admin123",
      role: "admin",
      branchId: branchRNP.branchId,
    });

    // 3. CREATE CENTERS (50 centers distributed across ALL 7 DAYS)
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const centers = [];
    for (let i = 0; i < ratnapuraLocations.length; i++) {
      const center = await Center.create({
        centerId: `C-RNP-${(i + 1).toString().padStart(3, "0")}`,
        centerName: ratnapuraLocations[i],
        branchId: branchRNP._id,
        routeId: `ROUTE-${Math.floor(i / 10) + 1}`,
        dayOfWeek: days[i % 7], // Modulo 7 for Mon-Sun distribution
        meetingTime: "09:00 AM",
      });
      centers.push(center);
    }

    // 4. CREATE 10 COLLECTORS & ASSIGN CENTERS
    const collectors = [];
    for (let i = 1; i <= 2; i++) {
      const startIdx = (i - 1) * 25;
      const myCenterIds = centers
        .slice(startIdx, startIdx + 25)
        .map((c) => c.centerId);

      const col = await User.create({
        name: `Collector ${i}`,
        email: `collector${i}@finance.lk`,
        password: "col123",
        role: "collector",
        branchId: branchRNP.branchId,
        assignedCenters: myCenterIds,
      });
      collectors.push(col);
    }

    console.log("⏳ Generating Customers, Loans, and Today's Receipts...");

    const todayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    for (const center of centers) {
      for (let j = 1; j <= 3; j++) {
        const customer = await Customer.create({
          nic: `19${Math.floor(70 + Math.random() * 20)}${Math.floor(10000000 + Math.random() * 90000000)}`,
          fullName: `Customer ${center.centerId}-C${j}`,
          phone: "071" + Math.floor(1000000 + Math.random() * 900000),
          address: `Near ${center.centerName}, Ratnapura`,
          branchId: branchRNP.branchId,
          centerId: center.centerId,
        });

        const principal = 30000 + Math.floor(Math.random() * 5) * 5000;
        const total = principal * 1.15;
        const schedule = loanService.generateSchedule(
          total,
          12,
          "weekly",
          new Date(),
        );

        const loan = await Loan.create({
          loanId: `L-${center.centerId}-${j}`,
          customerId: customer._id,
          loanTypeId: "W-PRO-15",
          principalAmount: principal,
          totalInterest: principal * 0.15,
          totalPayable: total,
          repaymentType: "weekly",
          duration: 12,
          penaltyRate: 5.0,
          status: "approved",
          branchId: branchRNP.branchId,
          centerId: center.centerId,
          schedule: schedule,
        });

        customer.activeLoanId = loan._id;
        await customer.save();

        // 5. ADD RECEIPTS ONLY FOR TODAY'S CENTERS
        if (center.dayOfWeek === todayName) {
          const collector = collectors.find((c) =>
            c.assignedCenters.includes(center.centerId),
          );

          if (collector) {
            // --- FIX: MATCHING YOUR SCHEMA PERFECTLY ---
            await Receipt.create({
              receiptNo: `REC-${loan.loanId}-${Date.now()}`,
              loanId: loan._id,
              customerId: customer._id,
              collectorId: collector._id,

              amountPaid: 2500, // Matches schema
              panaltyPaid: 0, // Matches schema spelling (panalty)
              totalReceived: 2500, // Matches schema

              paymentMethod: "Cash", // Capital 'C' matches Enum
              status: "valid",
              location: {
                latitude: 6.6828, // Ratnapura Lat
                longitude: 80.3992, // Ratnapura Long
              },
            });
            // -------------------------------------------
          }
        }
      }
    }

    console.log("✅ RATNAPURA SEEDING COMPLETE!");
    console.log(`- 50 Centers Created across Mon-Sun`);
    console.log(`- 10 Collectors created (5 centers each)`);
    console.log(`- Receipts generated for today (${todayName})`);
    process.exit();
  } catch (error) {
    console.error("❌ Seed Failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
