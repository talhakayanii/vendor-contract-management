const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); 


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password098',
    database: 'vendorcontractmanagement',
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1); 
    }
    console.log("Connected to the database!");
});

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Signup route
app.post("/signup", (req, res) => {
    const { name, email, password, role, serviceCategory, complianceCertifications, budget } = req.body;

    
    const userQuery = "INSERT INTO User (Name, Email, Password, Role) VALUES (?, ?, ?, ?)";
    db.query(userQuery, [name, email, password, role], (err, result) => {
        if (err) {
            console.error("Error signing up:", err.message);
            return res.status(500).send("Error signing up");
        }

        const userId = result.insertId;

        
        if (role.toLowerCase() === "vendor") {
            const vendorQuery = "INSERT INTO Vendor (UserId, ServiceCategory, ComplianceCertifications, PerformanceRating) VALUES (?, ?, ?, ?)";
            db.query(vendorQuery, [userId, serviceCategory, complianceCertifications, 0], (err) => {
                if (err) {
                    console.error("Error saving vendor data:", err.message);
                    return res.status(500).send("Error saving vendor data");
                }
                res.redirect('/signup-success');
            });
        } else if (role.toLowerCase() === "department") {
            const departmentQuery = "INSERT INTO Department (UserId, Name, Budget) VALUES (?, ?, ?)";
            db.query(departmentQuery, [userId, name, parseFloat(budget)], (err) => {
                if (err) {
                    console.error("Error saving department data:", err.message);
                    return res.status(500).send("Error saving department data");
                }
                res.redirect('/signup-success');
            });
        } else {
            res.status(400).send("Invalid role");
        }
    });
});


app.get("/signup-success", (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Login route
app.post("/login", (req, res) => {
    const { loginEmail, loginPassword } = req.body;
    const loginQuery = "SELECT * FROM User WHERE Email = ? AND Password = ?";

    db.query(loginQuery, [loginEmail, loginPassword], (err, result) => {
        if (err) {
            console.error("Error logging in:", err.message);
            return res.status(500).send("Error logging in");
        }

        if (result.length > 0) {
            const user = result[0];
            console.log("User Role:", user.Role); 

            if (user.Role.toLowerCase() === "vendor") {
                res.redirect(`/vendor-dashboard?name=${encodeURIComponent(user.Name)}`);

            } else if (user.Role.toLowerCase() === "department") {
                res.redirect(`/department-dashboard?name=${encodeURIComponent(user.Name)}`);

            } else {
                res.send("Unknown Role");
            }
        } else {
            res.send("Invalid email or password");
        }
    });
});

// Vendor dashboard
app.get('/vendor-dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/vendor.html');
});

// Department dashboard
app.get('/department-dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/department.html');
});

// Create contract route
app.post('/create-contractt', (req, res) => {
    console.log("Submitted Data:", req.body);
    const { createdBy, assignedTo, terms, conditions, startDate, endDate, specialClauses, status } = req.body;

    const contractQuery = `
        INSERT INTO Contract (CreatedBy, AssignedTo, Terms, Conditions, StartDate, EndDate, SpecialClauses, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(contractQuery, [createdBy, assignedTo, terms, conditions, startDate, endDate, specialClauses, status], (err) => {
        if (err) {
            console.error("Error creating contract:", err.message);
            return res.status(500).send("Error creating contract");
        }
        
        
        res.redirect('/department-dashboard?success=true');
    });
});
// Route to submit vendor performance
app.post('/submitVendorPerformance', (req, res) => {
    const { vendorID, rating, feedback, date, redirectTo } = req.body;

    const sql = 'INSERT INTO VendorPerformance (VendorID, Rating, Feedback, Date) VALUES (?, ?, ?, ?)';
    const values = [vendorID, rating, feedback, date];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Failed to insert data.');
            return;
        }

        
        res.json({ message: 'Added successfully!', redirect: redirectTo });
    });
});
// route to create purchase order
app.post('/create-purchase-order', (req, res) => {
    const { vendorID, departmentID, itemDetails, quantity, totalCost, orderStatus } = req.body;

    const query = `INSERT INTO PurchaseOrder (VendorID, DepartmentID, ItemDetails, Quantity, TotalCost, OrderStatus)
                   VALUES (?, ?, ?, ?, ?, ?)`;

    db.execute(query, [vendorID, departmentID, itemDetails, quantity, totalCost, orderStatus], (err, results) => {
        if (err) {
            console.error('Error inserting purchase order: ' + err.stack);
            res.status(500).json({ success: false, message: 'Error inserting purchase order' });
        } else {
            res.status(200).json({ success: true, message: 'Purchase Order added successfully!' });
        }
    });
});
app.get('/department/:id', (req, res) => {
    const departmentId = req.params.id;
    const query = 'SELECT DepartmentID, Name, Budget, RemainingAmount, BudgetStatus FROM Department WHERE DepartmentID = ?';

    db.query(query, [departmentId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('Department not found');
        }

        res.json(results[0]);
    });
});
app.get('/vendors', (req, res) => {
    const query = 'SELECT * FROM Vendor';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching vendors:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});
// Route to get contracts by department ID
app.get('/contracts/:departmentId', (req, res) => {
    const departmentId = req.params.departmentId;
    const query = `
        SELECT * FROM Contract 
        WHERE CreatedBy = ?
    `;

    db.query(query, [departmentId], (err, results) => {
        if (err) {
            console.error('Error fetching contracts:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});
app.get('/purchase-orders', (req, res) => {
    const departmentId = req.query.departmentId; 

    if (!departmentId) {
        return res.status(400).json({ error: 'DepartmentID is required.' });
    }

    const query = `
        SELECT OrderID, VendorID, ItemDetails, Quantity, TotalCost, OrderStatus 
        FROM PurchaseOrder 
        WHERE DepartmentID = ?`;

    db.query(query, [departmentId], (err, results) => {
        if (err) {
            console.error('Error fetching purchase orders:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'No purchase orders found for this department.' });
        }
        res.json(results);
    });
});


app.get('/order-details', (req, res) => {
    const orderId = req.query.orderId; 

    if (!orderId) {
        return res.status(400).json({ error: 'OrderID is required.' });
    }

    const query = `
        SELECT OrderID, VendorID, ItemDetails, Quantity, TotalCost, OrderStatus 
        FROM PurchaseOrder 
        WHERE OrderID = ?`;

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order details:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json(results[0]); 
    });
});
// Contract Renewal Route
app.get('/check-contract-renewals', (req, res) => {
    const departmentId = req.query.departmentId;

    if (!departmentId) {
        return res.status(400).json({ error: "Department ID is required." });
    }

    
    const query = `
        SELECT ContractID, CreatedBy, AssignedTo, EndDate 
        FROM Contract
        WHERE CreatedBy = ? 
        AND EndDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `;

    db.query(query, [departmentId], (err, results) => {
        if (err) {
            console.error("Error fetching expiring contracts:", err.message);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        res.json(results); 
    });
});
app.get('/get-contracts', (req, res) => {
    const vendorId = req.query.vendorId;
    if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const query = `
        SELECT * FROM Contract 
        WHERE AssignedTo = ?
    `;
    db.query(query, [vendorId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching contracts' });
        }
        res.json({ contracts: results });
    });
});

// Update the status of a contract
app.post('/update-contract', (req, res) => {
    const { contractId, status } = req.body;
    if (!contractId || !status) {
        return res.status(400).json({ error: 'Contract ID and status are required' });
    }

    const query = `
        UPDATE Contract 
        SET Status = ? 
        WHERE ContractID = ?
    `;
    db.query(query, [status, contractId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating contract status' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Contract not found' });
        }
        res.json({ message: 'Contract status updated successfully' });
    });
});
// Fetching all purchase orders for a specific vendor
app.get('/get-purchase-orders', (req, res) => {
    const vendorId = req.query.vendorId;
    if (!vendorId) {
        return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const query = `
        SELECT * FROM PurchaseOrder
        WHERE VendorID = ?
    `;
    db.query(query, [vendorId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching purchase orders' });
        }
        res.json({ purchaseOrders: results });
    });
});

//to update the status of a purchase order
app.post('/update-purchase-order', (req, res) => {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
        return res.status(400).json({ error: 'Order ID and status are required' });
    }

    const query = `
        UPDATE PurchaseOrder
        SET OrderStatus = ?
        WHERE OrderID = ?
    `;
    db.query(query, [status, orderId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating purchase order status' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        res.json({ message: 'Purchase order status updated successfully' });
    });
});
app.post('/send-notification', (req, res) => {
    const { sentTo, sentBy, message, deadline } = req.body;

    
    const query = 'INSERT INTO Notification (Message, SentTo, SentBy, Date, Deadline) VALUES (?, ?, ?, NOW(), ?)';
    db.query(query, [message, sentTo, sentBy, deadline], (err, results) => {
        if (err) {
            console.error('Error inserting notification:', err);
            return res.status(500).json({ success: false, message: 'Failed to send notification.' });
        }

        
        res.json({ success: true });
    });
});
app.get('/get-notifications/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = 'SELECT * FROM Notification WHERE SentTo = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).json({ success: false, message: 'Error fetching notifications.' });
        }

        if (results.length > 0) {
            const notifications = results.map(notification => ({
                Message: notification.Message,
                SentBy: notification.SentBy
            }));
            res.json({ success: true, notifications });
        } else {
            res.json({ success: false, notifications: [] });
        }
    });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

