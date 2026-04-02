const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Branch = require("../models/Branch");
const Center = require("../models/Center");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const Receipt = require("../models/Receipt");
const CollectionHandover = require("../models/CollectionHandover");
const LoanApplication = require("../models/LoanApplication");
const loanService = require("../services/loanService");

const allLocations = [
  // First 25 for Ratnapura
  "Ratnapura Town",
  "Eheliyagoda",
  "Pelmadulla",
  "Kuruwita",
  "Kahawatta",
  "Rakwana",
  "Kalawana",
  "Nivithigala",
  "Ayagama",
  "Kiriella",
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
  "Weralupa",
  "Mudduwa",
  // Next 25 for Embilipitiya
  "Embilipitiya",
  "Balangoda",
  "Godakawela",
  "Weligepola",
  "Opanayaka",
  "Kolonna",
  "Imbulpe",
  "Udawalawe",
  "Pallebedda",
  "Pinnawala",
  "Panamura",
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

const maleNames = [
  "Saman",
  "Kamal",
  "Nimal",
  "Sunil",
  "Ruwan",
  "Jagath",
  "Channa",
  "Pradeep",
  "Nuwan",
  "Roshan",
];
const femaleNames = [
  "Kumari",
  "Niluka",
  "Malki",
  "Chamari",
  "Dilhani",
  "Nadeesha",
  "Lakmali",
  "Gayani",
  "Sanduni",
  "Tharushi",
];
const lastNames = [
  "Perera",
  "Silva",
  "Fernando",
  "Bandara",
  "Jayawardena",
  "Wickramasinghe",
  "Dissanayake",
  "Gamage",
  "Liyanage",
  "Rathnayake",
];

const branchConfigs = [
  {
    branchId: "BR-RNP-01",
    name: "Ratnapura Main Branch",
    address: "Main Street, Ratnapura",
    contact: "0452223344",
    adminEmail: "admin.rnp@finance.lk",
    prefix: "RNP",
    locations: allLocations.slice(0, 25),
  },
  {
    branchId: "BR-EMB-01",
    name: "Embilipitiya Branch",
    address: "New Town, Embilipitiya",
    contact: "0472225566",
    adminEmail: "admin.emb@finance.lk",
    prefix: "EMB",
    locations: allLocations.slice(25, 50),
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(
      "🚀 Connection Successful. Starting Multi-Branch Full-Profile Seed...",
    );

    // 1. CLEAR DATA
    await Promise.all([
      Branch.deleteMany({}),
      User.deleteMany({}),
      Center.deleteMany({}),
      Customer.deleteMany({}),
      Loan.deleteMany({}),
      Receipt.deleteMany({}),
      LoanApplication.deleteMany({}),
      CollectionHandover.deleteMany({}),
    ]);

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const today = new Date();

    // Loop through each Branch Configuration
    for (const config of branchConfigs) {
      console.log(`\n===========================================`);
      console.log(`🏦 Seeding Branch: ${config.name}`);
      console.log(`===========================================`);

      // 2. CREATE BRANCH
      const branch = await Branch.create({
        branchId: config.branchId,
        name: config.name,
        address: config.address,
        contactNumber: config.contact,
      });

      const admin = await User.create({
        name: `${config.prefix} Admin`,
        email: config.adminEmail,
        password: "admin123",
        role: "admin",
        branchId: branch.branchId,
      });

      // 3. CREATE CENTERS
      const centers = [];
      for (let i = 0; i < config.locations.length; i++) {
        centers.push(
          await Center.create({
            centerId: `C-${config.prefix}-${(i + 1).toString().padStart(3, "0")}`,
            centerName: config.locations[i],
            branchId: branch._id,
            routeId: `ROUTE-${Math.floor(i / 10) + 1}`,
            dayOfWeek: days[i % 7],
            meetingTime: "09:00 AM",
          }),
        );
      }

      // 4. CREATE 2 COLLECTORS FOR THIS BRANCH
      const collectors = [];
      for (let i = 1; i <= 2; i++) {
        const startIdx = (i - 1) * 12; // Assign approx 12 centers per collector
        const myCenterIds = centers
          .slice(startIdx, startIdx + 12)
          .map((c) => c.centerId);

        collectors.push(
          await User.create({
            name: `${config.prefix} Collector ${i}`,
            email: `collector${i}.${config.prefix.toLowerCase()}@finance.lk`,
            password: "col123",
            role: "collector",
            branchId: branch.branchId,
            assignedCenters: myCenterIds,
          }),
        );
      }

      console.log("⏳ Generating Customers, Loans, and Receipts...");
      const allCreatedCustomers = [];

      // 5. CREATE CUSTOMERS & LOANS
      for (const center of centers) {
        const collector = collectors.find((c) =>
          c.assignedCenters.includes(center.centerId),
        );
        if (!collector) continue;

        for (let j = 1; j <= 5; j++) {
          const gender = Math.random() > 0.5 ? "Male" : "Female";
          const firstName =
            gender === "Male"
              ? maleNames[Math.floor(Math.random() * maleNames.length)]
              : femaleNames[Math.floor(Math.random() * femaleNames.length)];
          const lastName =
            lastNames[Math.floor(Math.random() * lastNames.length)];
          const photoId = Math.floor(Math.random() * 70);
          const photoUrl = `https://randomuser.me/api/portraits/${gender.toLowerCase() === "male" ? "men" : "women"}/${photoId}.jpg`;
          const lat = 6.6828 + (Math.random() - 0.5) * 0.05;
          const lng = 80.3992 + (Math.random() - 0.5) * 0.05;

          const customer = await Customer.create({
            nic: `19${Math.floor(70 + Math.random() * 20)}${Math.floor(10000000 + Math.random() * 90000000)}V`,
            fullName: `${firstName} ${lastName}`,
            nameWithInitials: `${firstName[0]}. ${lastName}`,
            phone: "071" + Math.floor(1000000 + Math.random() * 900000),
            address: `No. ${Math.floor(Math.random() * 100)}, Near ${center.centerName}`,
            gender: gender,
            location: { latitude: lat, longitude: lng },
            branchId: branch.branchId,
            centerId: center.centerId,
            totalLoansTaken: Math.floor(Math.random() * 5) + 1,
            customerPhoto: photoUrl,
            idFrontImage:
              "https://placehold.co/600x400/003366/FFF?text=NIC+Front",
            idBackImage:
              "https://placehold.co/600x400/003366/FFF?text=NIC+Back",
          });

          const principal = 30000 + Math.floor(Math.random() * 5) * 5000;
          const total = principal * 1.15;
          const startDate = new Date();
          startDate.setDate(today.getDate() - 30);

          const schedule = loanService.generateSchedule(
            total,
            12,
            "weekly",
            startDate,
          );

          const loan = await Loan.create({
            loanId: `L-${center.centerId}-${j}`,
            customerId: customer._id,
            loanTypeId: "W-PRO-15",
            principalAmount: principal,
            totalInterest: principal * 0.15,
            totalPayable: total,
            duration: 12,
            penaltyRate: 5.0,
            status: "approved",
            branchId: branch.branchId,
            centerId: center.centerId,
            schedule: schedule,
          });

          customer.activeLoanId = loan._id;
          await customer.save();
          allCreatedCustomers.push({ customer, collectorId: collector._id });

          // --- RECEIPTS (PAYMENT HISTORY) ---
          for (const installment of loan.schedule) {
            const dueDate = new Date(installment.dueDate);
            const isToday = dueDate.toDateString() === today.toDateString();

            if (dueDate < today && Math.random() > 0.2) {
              installment.paidAmount = installment.amountDue;
              installment.status = "paid";
              installment.paidDate = dueDate;

              await Receipt.create({
                receiptNo: `REC-${loan.loanId}-${dueDate.getTime()}`,
                loanId: loan._id,
                customerId: customer._id,
                collectorId: collector._id,
                branchId: branch.branchId, // Added Branch ID here!
                amountPaid: installment.amountDue,
                panaltyPaid: 0,
                totalReceived: installment.amountDue,
                paymentMethod: "Cash",
                status: "valid",
                createdAt: dueDate,
                location: { latitude: lat, longitude: lng },
                handoverId: new mongoose.Types.ObjectId(),
              });
            }

            if (isToday && Math.random() > 0.5) {
              installment.paidAmount = installment.amountDue;
              installment.status = "paid";
              installment.paidDate = new Date();

              await Receipt.create({
                receiptNo: `REC-${loan.loanId}-${Date.now()}`,
                loanId: loan._id,
                customerId: customer._id,
                collectorId: collector._id,
                branchId: branch.branchId, // Added Branch ID here!
                amountPaid: installment.amountDue,
                panaltyPaid: 0,
                totalReceived: installment.amountDue,
                paymentMethod: "Cash",
                status: "valid",
                createdAt: new Date(),
                location: { latitude: lat, longitude: lng },
                handoverId: null,
              });
            }
          }
          await loan.save();
        }
      }

      console.log("📝 Generating Loan Applications...");

      // 6. SEED LOAN APPLICATIONS
      for (const collector of collectors) {
        const collectorCustomers = allCreatedCustomers.filter((c) =>
          c.collectorId.equals(collector._id),
        );
        const centerId = collector.assignedCenters[0];

        // Pending
        for (let k = 0; k < 3; k++) {
          await LoanApplication.create({
            nic: `2000${Math.floor(10000000 + Math.random() * 90000000)}`,
            fullName: `Pending Applicant ${k + 1}`,
            phone: "077000000" + k,
            address: "123 New Street",
            gender: "Male",
            location: { latitude: 6.68, longitude: 80.4 },
            loanAmount: 50000,
            duration: 12,
            nicFrontImage:
              "https://placehold.co/600x400/orange/white?text=Pending+Front",
            nicBackImage:
              "https://placehold.co/600x400/orange/white?text=Pending+Back",
            customerPhoto:
              "https://placehold.co/150x150/orange/white?text=User",
            status: "pending",
            collectorId: collector._id,
            branchId: branch.branchId,
            centerId: centerId,
          });
        }

        // Rejected
        for (let k = 0; k < 3; k++) {
          if (collectorCustomers[k]) {
            const cust = collectorCustomers[k].customer;
            await LoanApplication.create({
              nic: cust.nic,
              fullName: cust.fullName,
              phone: cust.phone,
              address: cust.address,
              gender: cust.gender,
              location: cust.location,
              loanAmount: 100000,
              status: "rejected",
              reviewedBy: admin._id,
              reviewNote: "Customer already has an active loan.",
              reviewedAt: new Date(),
              collectorId: collector._id,
              branchId: branch.branchId,
              centerId: centerId,
              nicFrontImage: cust.idFrontImage,
              nicBackImage: cust.idBackImage,
              customerPhoto: cust.customerPhoto,
            });
          }
        }

        // Approved
        for (let k = 0; k < 2; k++) {
          const nic = `1988${Math.floor(10000000 + Math.random() * 90000000)}V`;
          const name = `Approved Customer ${k + 1}`;
          const amount = 40000;

          const newCust = await Customer.create({
            nic: nic,
            fullName: name,
            phone: "072000000" + k,
            address: "Success Road",
            gender: "Male",
            branchId: branch.branchId,
            centerId: centerId,
            idFrontImage:
              "https://placehold.co/600x400/green/white?text=Valid+NIC",
            idBackImage:
              "https://placehold.co/600x400/green/white?text=Valid+NIC",
            customerPhoto: "https://placehold.co/150x150/green/white?text=User",
          });

          const total = amount * 1.15;
          const schedule = loanService.generateSchedule(
            total,
            12,
            "weekly",
            new Date(),
          );

          const newLoan = await Loan.create({
            loanId: `L-NEW-${centerId}-${Date.now()}-${k}`,
            customerId: newCust._id,
            loanTypeId: "W-PRO-15",
            principalAmount: amount,
            totalInterest: amount * 0.15,
            totalPayable: total,
            duration: 12,
            penaltyRate: 5.0,
            status: "approved",
            branchId: branch.branchId,
            centerId: centerId,
            schedule: schedule,
          });

          newCust.activeLoanId = newLoan._id;
          await newCust.save();

          await LoanApplication.create({
            nic: nic,
            fullName: name,
            phone: newCust.phone,
            address: newCust.address,
            gender: "Male",
            location: { latitude: 6.68, longitude: 80.4 },
            loanAmount: amount,
            status: "approved",
            reviewedBy: admin._id,
            reviewNote: "Documents verified. Approved.",
            reviewedAt: new Date(),
            collectorId: collector._id,
            branchId: branch.branchId,
            centerId: centerId,
            createdCustomerId: newCust._id,
            createdLoanId: newLoan._id,
            nicFrontImage: newCust.idFrontImage,
            nicBackImage: newCust.idBackImage,
            customerPhoto: newCust.customerPhoto,
          });
        }
      }
    }

    console.log(`\n✅ FULL MULTI-BRANCH SEED COMPLETE!`);
    console.log(
      `Log in with: admin.rnp@finance.lk or admin.emb@finance.lk (Pass: admin123)`,
    );
    process.exit();
  } catch (error) {
    console.error("❌ Seed Failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
